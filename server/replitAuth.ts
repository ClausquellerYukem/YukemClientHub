import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { Strategy as LocalStrategy } from "passport-local";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const useSecureCookies = process.env.COOKIE_SECURE === 'true';
  let store: session.Store;
  if (process.env.DATABASE_URL) {
    const PgStore = connectPg(session);
    store = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    const MemoryStore = createMemoryStore(session);
    store = new MemoryStore({ checkPeriod: sessionTtl });
  }
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    name: 'yukem.sid',
    store,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: sessionTtl,
      path: '/',
    },
  });
}

export async function getUserFromSession(sessionUser: any) {
  if (sessionUser.dbUserId) {
    const user = await storage.getUser(sessionUser.dbUserId);
    if (user) return user;
  }
  if (sessionUser.email) {
    const user = await storage.getUserByEmail(sessionUser.email);
    if (user) return user;
  }
  return undefined;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "dev";

  passport.use(new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
    try {
      if (!email || !password) return done(null, false);
      if (password !== MASTER_PASSWORD) return done(null, false);
      const user = await storage.upsertUser({ id: email, email });
      const sessionUser = { dbUserId: user.id, email: user.email };
      return done(null, sessionUser as any);
    } catch (err) {
      return done(err as any);
    }
  }));

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any) => {
      if (err) return res.status(500).json({ message: "Erro de login" });
      if (!user) return res.status(403).json({ message: "Credenciais inválidas" });
      req.logIn(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ message: "Falha ao iniciar sessão" });
        return res.json({ message: "Autenticado" });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Sessão encerrada" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const user = await getUserFromSession(sessionUser);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export function requirePermission(resource: string, action: string): RequestHandler {
  return async (req, res, next) => {
    const sessionUser = req.user as any;
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    try {
      const user = await getUserFromSession(sessionUser);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      if (user.role === "admin") return next();
      const hasPermission = await storage.checkUserPermission(user.id, resource as any, action as any);
      if (!hasPermission) {
        return res.status(403).json({ error: "Você não tem permissão." });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao verificar permissões" });
    }
  };
}
