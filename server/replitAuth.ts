// Replit Auth Integration - Reference: blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // In production/deployment, always use secure cookies (HTTPS)
  // In development, allow non-secure cookies for testing
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    name: 'yukem.sid', // Custom session cookie name
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust proxy in production (Cloud Run)
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // Use 'lax' for better compatibility with OAuth redirects
      maxAge: sessionTtl,
      path: '/', // Ensure cookie is sent for all paths
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  console.log('[upsertUser] Upserting user with sub:', claims["sub"], 'email:', claims["email"]);
  
  try {
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
    console.log('[upsertUser] User upserted successfully');
  } catch (error) {
    console.error('[upsertUser] FAILED to upsert user:', error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log('[OAuth Callback] Received callback request');
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err) {
        console.error('[OAuth Callback] Error during authentication:', err);
        return res.redirect('/api/login');
      }
      
      if (!user) {
        console.error('[OAuth Callback] No user returned, info:', info);
        return res.redirect('/api/login');
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[OAuth Callback] Error during login:', loginErr);
          return res.redirect('/api/login');
        }
        
        console.log('[OAuth Callback] Login successful, session saved, redirecting to /');
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;

  if (!req.isAuthenticated() || !sessionUser.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Import storage dynamically to avoid circular dependency
    const { storage } = await import("./storage");
    const userId = sessionUser.claims.sub;
    const user = await storage.getUser(userId);

    if (user?.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }

    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Permission-based middleware factory
export function requirePermission(resource: string, action: string): RequestHandler {
  return async (req, res, next) => {
    const sessionUser = req.user as any;

    if (!req.isAuthenticated() || !sessionUser.expires_at) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const { storage } = await import("./storage");
      const userId = sessionUser.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log(`[requirePermission] resource=${resource}, action=${action}, userId=${userId}, user=${JSON.stringify(user)}`);
      
      // Admins (via users.role field) have implicit access to everything
      // This ensures backward compatibility with existing admin users
      if (user?.role === "admin") {
        console.log(`[requirePermission] Admin access granted for ${resource}.${action}`);
        return next();
      }
      
      // Check role-based permissions for non-admin users
      const hasPermission = await storage.checkUserPermission(
        userId,
        resource as any,
        action as any
      );

      if (!hasPermission) {
        const actionMap: Record<string, string> = {
          'create': 'criar',
          'read': 'visualizar',
          'update': 'editar',
          'delete': 'excluir',
        };
        
        const resourceMap: Record<string, string> = {
          'clients': 'clientes',
          'licenses': 'licenças',
          'invoices': 'faturas',
          'boleto_config': 'configurações de boleto',
          'companies': 'empresas',
        };
        
        const actionText = actionMap[action] || action;
        const resourceText = resourceMap[resource] || resource;
        
        return res.status(403).json({ 
          error: `Você não tem permissão para ${actionText} ${resourceText}.` 
        });
      }

      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      return res.status(500).json({ error: "Erro ao verificar permissões" });
    }
  };
}
