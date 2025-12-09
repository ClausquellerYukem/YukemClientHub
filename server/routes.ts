import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertLicenseSchema, insertInvoiceSchema, insertBoletoConfigSchema, insertCompanySchema, insertUserCompanySchema, insertCashAccountSchema, insertCashBaseSchema, insertCashSessionSchema, insertCashAccountTypeSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin, requirePermission, getUserFromSession } from "./replitAuth";
import { cashRouter } from "./modules/cash";
import { invoicesRouter } from "./modules/invoices";
import { licensesRouter } from "./modules/licenses";
import { boletoRouter } from "./modules/boleto";
import { reportsRouter } from "./modules/reports";
import { companiesRouter } from "./modules/companies";
import { permissionsRouter } from "./modules/permissions";
import { userRouter, usersAdminRouter } from "./modules/users";
import { rolesRouter } from "./modules/roles";
import { adminRouter } from "./modules/admin";

// Helper function to get companyId for multi-tenant data isolation
// Returns activeCompanyId if user has one set (for both admins and regular users)
// Returns undefined for admins without activeCompanyId (they can see all companies)
// Returns null for regular users without activeCompanyId (allows graceful empty state)
async function getCompanyIdForUser(req: any): Promise<string | undefined | null> {
  // Use dbUserId from session if available, otherwise use OAuth ID
  const userId = req.user.dbUserId || req.user.email || req.user.claims?.sub;
  console.log('[getCompanyIdForUser] Looking for user - dbUserId:', req.user.dbUserId, 'OAuth ID:', req.user.claims?.sub, 'Using:', userId);
  
  let user = await storage.getUser(userId);
  console.log('[getCompanyIdForUser] User found by ID?', user ? `YES (${user.email})` : 'NO');
  
  // Fallback: try by email if not found by ID (indexed lookup, efficient)
  if (!user && req.user.claims?.email) {
    console.log('[getCompanyIdForUser] Trying to find by email:', req.user.claims.email);
    user = await storage.getUserByEmail(req.user.claims.email);
    console.log('[getCompanyIdForUser] User found by email?', user ? `YES (${user.email})` : 'NO');
  }
  
  if (!user) {
    console.error('[getCompanyIdForUser] ERROR: User not found in database');
    throw new Error('User not found');
  }
  
  console.log('[getCompanyIdForUser] User found:', user.email, 'ID:', user.id, 'activeCompanyId:', user.activeCompanyId, 'role:', user.role);
  
  // If user has an active company selected, always use it (for both admins and regular users)
  if (user.activeCompanyId) {
    console.log('[getCompanyIdForUser] Returning activeCompanyId:', user.activeCompanyId);
    return user.activeCompanyId;
  }
  
  // Admin users without active company can see all companies
  if (user.role === 'admin') {
    console.log('[getCompanyIdForUser] Admin user without activeCompanyId - returning undefined');
    return undefined;
  }
  
  // Regular users without active company return null (allows graceful empty state)
  console.log('[getCompanyIdForUser] Regular user without activeCompanyId - returning null for empty state');
  return null;
}

// Helper to calculate trend percentage for statistics
function calculateTrend(current: number, previous: number) {
  if (previous === 0) return null; // No previous data
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${Math.abs(change).toFixed(1)}%`,
    isPositive: change >= 0,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - Reference: blueprint:javascript_log_in_with_replit
  await setupAuth(app);

  app.get('/health', (_req, res) => {
    res.status(200).send('ok');
  });

  app.get('/ready', async (_req, res) => {
    if (!process.env.DATABASE_URL) return res.status(200).send('ok');
    try {
      const { pool } = await import('./db');
      await pool.query('SELECT 1');
      res.status(200).send('ok');
    } catch {
      res.status(503).send('unready');
    }
  });

  // Initialize roles and permissions if they don't exist
  const { seedRolesAndPermissions } = await import("./seed-data");
  await seedRolesAndPermissions();

  // Ensure master user exists when configured via environment
  try {
    const masterEmail = process.env.MASTER_USER_EMAIL;
    if (masterEmail) {
      await storage.upsertUser({ email: masterEmail });
      console.log('[Startup] Master user ensured:', masterEmail);
    }
  } catch (err) {
    console.error('[Startup] Failed to ensure master user:', err);
  }

  // Auth route to get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Use dbUserId from session if available, otherwise use OAuth ID
      const userId = req.user.dbUserId || req.user.email || req.user.claims?.sub;
      console.log('[GET /api/auth/user] Fetching user - dbUserId:', req.user.dbUserId, 'OAuth ID:', req.user.claims?.sub, 'Using:', userId);
      
      let user = await storage.getUser(userId);
      console.log('[GET /api/auth/user] User found by ID?', user ? 'YES' : 'NO');
      
      // If not found by ID, try by email (fallback for existing users) - indexed lookup
      if (!user && req.user.claims?.email) {
        console.log('[GET /api/auth/user] Trying to find by email:', req.user.claims.email);
        user = await storage.getUserByEmail(req.user.claims.email);
        console.log('[GET /api/auth/user] User found by email?', user ? 'YES' : 'NO');
      }
      
      if (!user) {
        console.error('[GET /api/auth/user] User not found in database');
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('[GET /api/auth/user] Returning user:', user.email, 'ID:', user.id);
      res.json(user);
    } catch (error) {
      console.error("[GET /api/auth/user] Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected routes - All client/license/invoice routes require authentication
  app.get("/api/clients", isAuthenticated, requirePermission('clients', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const clients = await storage.getAllClients(companyId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, requirePermission('clients', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const client = await storage.getClient(req.params.id, companyId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, requirePermission('clients', 'create'), async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const user = await getUserFromSession(sessionUser);
      
      // Convert empty strings to null for numeric fields (same fix as companies)
      const payload = { ...req.body };
      if (payload.monthlyValue === "") {
        payload.monthlyValue = null;
      }
      
      // For client creation, use activeCompanyId even for admins
      // Unlike read operations where admins can see all companies,
      // creation requires a specific company context
      const companyId = user?.activeCompanyId;
      if (!companyId) {
        return res.status(400).json({ error: "User must have an active company set" });
      }
      
      payload.companyId = companyId;
      
      const validatedData = insertClientSchema.parse(payload);
      
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, requirePermission('clients', 'update'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const validatedData = insertClientSchema.partial().parse(req.body);
      
      // Prevent companyId reassignment: remove from payload
      delete validatedData.companyId;
      
      const client = await storage.updateClient(req.params.id, validatedData, companyId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, requirePermission('clients', 'delete'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      // Soft delete - mark as inactive instead of deleting
      const client = await storage.updateClient(req.params.id, { status: "inactive" }, companyId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to deactivate client" });
    }
  });

  app.use("/api/licenses", licensesRouter);

  app.use("/api/invoices", invoicesRouter);

  

  app.use("/api/boleto", boletoRouter);

  

  app.get("/api/preferences/grid", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.dbUserId || req.user?.email || req.user?.claims?.sub;
      const { resource } = req.query as any;
      if (!resource) return res.status(400).json({ error: "resource é obrigatório" });
      const pref = await storage.getUserGridPreference(userId, resource);
      res.json(pref || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grid preference" });
    }
  });

  app.put("/api/preferences/grid", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.dbUserId || req.user?.email || req.user?.claims?.sub;
      const { resource, columns } = req.body || {};
      if (!resource || !columns) return res.status(400).json({ error: "resource e columns são obrigatórios" });
      const saved = await storage.upsertUserGridPreference({ userId, resource, columns });
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to save grid preference" });
    }
  });

  app.use("/api/cash", cashRouter);
  app.use("/api/companies", companiesRouter);
  app.use("/api/permissions", permissionsRouter);
  app.use("/api/user", userRouter);
  app.use("/api/users", usersAdminRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api/admin", adminRouter);

  

  // Current user permissions (for UI guards)
  app.get("/api/me/permissions", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser?.dbUserId || sessionUser?.email || sessionUser?.claims?.sub;
      
      const permissionsMap = await storage.getUserPermissions(userId);
      
      // Convert Map to JSON-serializable object
      const permissions: Record<string, string[]> = {};
      permissionsMap.forEach((actions, resource) => {
        permissions[resource] = Array.from(actions);
      });
      
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/stats/dashboard", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      
      // Return empty metrics for users without company (graceful empty state)
      if (companyId === null) {
        return res.json({
          totalClients: 0,
          totalClientsTrend: null,
          activeLicenses: 0,
          activeLicensesTrend: null,
          monthlyRevenue: 0,
          monthlyRevenueTrend: null,
          conversionRate: 0,
          conversionRateTrend: null,
          totalRevenue: 0,
          totalRevenueTrend: null,
          paidInvoicesCount: 0,
          paidInvoicesTrend: null,
          pendingInvoicesCount: 0,
          pendingInvoicesTrend: null,
        });
      }
      
      const clients = await storage.getAllClients(companyId);
      const licenses = await storage.getAllLicenses(companyId);
      const invoices = await storage.getAllInvoices(companyId);
      
      // Get company details for revenue calculation
      const company = companyId ? await storage.getCompany(companyId) : null;

      // Current month boundaries
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Previous month boundaries
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Current stats - using date-based calculations for consistency
      const activeClients = clients.filter(c => c.status === "active").length;
      
      // Count licenses that are currently active (activated before now, expires after now)
      const activeLicenses = licenses.filter(l => {
        const activatedAt = new Date(l.activatedAt);
        const expiresAt = new Date(l.expiresAt);
        return activatedAt <= now && expiresAt > now;
      }).length;
      
      // New revenue calculation logic based on free license quota and revenue share percentage
      let monthlyRevenue = 0;
      
      if (company) {
        // Safely parse financial fields with defaults to prevent NaN
        const freeLicenseQuota = company.freeLicenseQuota 
          ? parseFloat(company.freeLicenseQuota) 
          : 0;
        const revenueSharePercentage = company.revenueSharePercentage 
          ? parseFloat(company.revenueSharePercentage) 
          : 0;
        
        // Only calculate if revenue share is configured
        if (revenueSharePercentage > 0) {
          // Group licenses by client
          const licensesByClient = new Map<string, number>();
          licenses.filter(l => l.isActive).forEach(license => {
            const count = licensesByClient.get(license.clientId) || 0;
            licensesByClient.set(license.clientId, count + 1);
          });
          
          // Calculate revenue for each client
          licensesByClient.forEach((licensesCount, clientId) => {
            const client = clients.find(c => c.id === clientId);
            if (client && client.monthlyValue) {
              const clientMonthlyValue = parseFloat(client.monthlyValue);
              
              // Guard against NaN from invalid client monthly value
              if (!isNaN(clientMonthlyValue) && clientMonthlyValue > 0) {
                // Calculate paid licenses (licenses above free quota)
                const paidLicenses = Math.max(0, licensesCount - freeLicenseQuota);
                
                // Revenue = paid licenses × client monthly value × revenue share percentage
                const clientRevenue = paidLicenses * clientMonthlyValue * (revenueSharePercentage / 100);
                monthlyRevenue += clientRevenue;
              }
            }
          });
        }
      }

      // Calculate previous month stats for comparison
      const prevMonthClients = clients.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt <= previousMonthEnd;
      }).length;
      
      // Count licenses that were active at the end of previous month
      // A license was active if it was activated before/during prev month AND hadn't expired yet
      const prevMonthLicenses = licenses.filter(l => {
        const activatedAt = new Date(l.activatedAt);
        const expiresAt = new Date(l.expiresAt);
        return activatedAt <= previousMonthEnd && expiresAt > previousMonthEnd;
      }).length;

      // Current month invoice metrics (paid invoices in THIS month)
      const currentMonthPaidInvoices = invoices.filter(i => {
        if (i.status !== "paid" || !i.paidAt) return false;
        const paidDate = new Date(i.paidAt);
        return paidDate >= currentMonthStart && paidDate <= currentMonthEnd;
      });
      
      // Current month pending invoices (due in THIS month and not yet paid)
      const currentMonthPendingInvoices = invoices.filter(i => {
        if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        if (!(dueDate >= currentMonthStart && dueDate <= currentMonthEnd)) return false;
        // Consider pending if not paid yet OR paid after the current month ended
        return !i.paidAt || new Date(i.paidAt) > currentMonthEnd;
      });
      
      const currentMonthRevenue = currentMonthPaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      
      // Previous month invoice metrics
      const prevMonthPaidInvoices = invoices.filter(i => {
        if (i.status !== "paid" || !i.paidAt) return false;
        const paidDate = new Date(i.paidAt);
        return paidDate >= previousMonthStart && paidDate <= previousMonthEnd;
      });
      
      // Previous month pending invoices (due LAST month and were not paid by end of that month)
      const prevMonthPendingInvoices = invoices.filter(i => {
        if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        if (!(dueDate >= previousMonthStart && dueDate <= previousMonthEnd)) return false;
        // Consider it was pending at end of previous month if not paid OR paid after previous month ended
        return !i.paidAt || new Date(i.paidAt) > previousMonthEnd;
      });
      
      const prevMonthRevenue = prevMonthPaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      const stats = {
        totalClients: clients.length,
        totalClientsTrend: calculateTrend(clients.length, prevMonthClients),
        activeLicenses: activeLicenses,
        activeLicensesTrend: calculateTrend(activeLicenses, prevMonthLicenses),
        monthlyRevenue: monthlyRevenue,
        monthlyRevenueTrend: null, // This is projected revenue, not historical
        conversionRate: clients.length > 0 ? (activeLicenses / clients.length) * 100 : 0,
        conversionRateTrend: null, // Conversion rate is a calculated metric
        totalRevenue: currentMonthRevenue, // Current month revenue (aligned with trend period)
        totalRevenueTrend: calculateTrend(currentMonthRevenue, prevMonthRevenue),
        paidInvoicesCount: currentMonthPaidInvoices.length, // Current month count (aligned with trend period)
        paidInvoicesTrend: calculateTrend(currentMonthPaidInvoices.length, prevMonthPaidInvoices.length),
        pendingInvoicesCount: currentMonthPendingInvoices.length, // Current month count (aligned with trend period)
        pendingInvoicesTrend: calculateTrend(currentMonthPendingInvoices.length, prevMonthPendingInvoices.length),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Monthly Revenue Chart - Real data from invoices
  app.get("/api/stats/monthly-revenue", isAuthenticated, async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      
      // Return empty chart data for users without company (graceful empty state)
      if (companyId === null) {
        const now = new Date();
        const emptyMonthsData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
          emptyMonthsData.push({ month: monthName, revenue: 0 });
        }
        return res.json(emptyMonthsData);
      }
      
      const invoices = await storage.getAllInvoices(companyId);
      
      // Get the last 6 months
      const now = new Date();
      const monthsData = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        // Filter invoices for this month
        const monthInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt);
          return invoiceDate.getMonth() + 1 === month && 
                 invoiceDate.getFullYear() === year &&
                 (invoice.status === 'paid' || invoice.status === 'pending');
        });
        
        // Sum total revenue for this month
        const revenue = monthInvoices.reduce((sum, invoice) => {
          return sum + parseFloat(invoice.amount);
        }, 0);
        
        monthsData.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          revenue: revenue,
        });
      }
      
      res.json(monthsData);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      res.status(500).json({ error: "Failed to fetch monthly revenue" });
    }
  });

  // Repasse Total - Company value + excess license revenue
  app.get("/api/stats/repasse", isAuthenticated, async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      
      // Return empty metrics for users without company
      if (companyId === null) {
        return res.json({
          totalRepasse: 0,
          companyValue: 0,
          excessLicenseRevenue: 0,
          description: "R$ 0,00 da empresa + R$ 0,00 de licenças",
        });
      }
      
      // At this point, companyId is guaranteed to be a valid string
      const company = await storage.getCompany(companyId);
      const clients = await storage.getAllClients(companyId);
      const licenses = await storage.getAllLicenses(companyId);
      
      // Get company monthly value (safely parsed)
      const companyValue = company?.monthlyValue 
        ? parseFloat(company.monthlyValue) 
        : 0;
      
      // Calculate excess license revenue
      let excessLicenseRevenue = 0;
      
      if (company) {
        const freeLicenseQuota = company.freeLicenseQuota 
          ? parseFloat(company.freeLicenseQuota) 
          : 0;
        const revenueSharePercentage = company.revenueSharePercentage 
          ? parseFloat(company.revenueSharePercentage) 
          : 0;
        
        if (revenueSharePercentage > 0) {
          // Group licenses by client
          const licensesByClient = new Map<string, number>();
          licenses.filter(l => l.isActive).forEach(license => {
            const count = licensesByClient.get(license.clientId) || 0;
            licensesByClient.set(license.clientId, count + 1);
          });
          
          // Calculate revenue for each client
          licensesByClient.forEach((licensesCount, clientId) => {
            const client = clients.find(c => c.id === clientId);
            if (client && client.monthlyValue) {
              const clientMonthlyValue = parseFloat(client.monthlyValue);
              
              if (!isNaN(clientMonthlyValue) && clientMonthlyValue > 0) {
                // Calculate paid licenses (licenses above free quota)
                const paidLicenses = Math.max(0, licensesCount - freeLicenseQuota);
                
                // Revenue = paid licenses × client monthly value × revenue share percentage
                const clientRevenue = paidLicenses * clientMonthlyValue * (revenueSharePercentage / 100);
                excessLicenseRevenue += clientRevenue;
              }
            }
          });
        }
      }
      
      const totalRepasse = companyValue + excessLicenseRevenue;
      
      res.json({
        totalRepasse,
        companyValue,
        excessLicenseRevenue,
        description: `R$ ${companyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} da empresa + R$ ${excessLicenseRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de licenças`,
      });
    } catch (error) {
      console.error("Error fetching repasse stats:", error);
      res.status(500).json({ error: "Failed to fetch repasse stats" });
    }
  });

  app.use("/api/reports", reportsRouter);

  // Financial Stats - Real data with trends
  app.get("/api/stats/financial", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      
      // Return empty metrics for users without company (graceful empty state)
      if (companyId === null) {
        return res.json({
          totalRevenue: 0,
          totalRevenueTrend: null,
          paidInvoicesCount: 0,
          paidInvoicesTrend: null,
          pendingInvoicesCount: 0,
          pendingInvoicesTrend: null,
          overdueInvoicesCount: 0,
          overdueInvoicesAmount: 0,
          upcomingInvoicesCount: 0,
        });
      }
      
      const invoices = await storage.getAllInvoices(companyId);
      
      // Current month boundaries
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Previous month boundaries
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Current month metrics
      const currentPaidInvoices = invoices.filter(i => {
        if (i.status !== "paid" || !i.paidAt) return false;
        const paidDate = new Date(i.paidAt);
        return paidDate >= currentMonthStart && paidDate <= currentMonthEnd;
      });
      
      const currentPendingInvoices = invoices.filter(i => {
        if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        if (!(dueDate >= currentMonthStart && dueDate <= currentMonthEnd)) return false;
        return !i.paidAt || new Date(i.paidAt) > currentMonthEnd;
      });
      
      const currentOverdueInvoices = invoices.filter(i => {
        if (i.status === "paid") return false;
        if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        return dueDate < now;
      });
      
      const currentRevenue = currentPaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      // Upcoming installments (parcelas a vencer): all non-paid invoices with due date from now onward
      const upcomingInvoices = invoices.filter(i => {
        if (i.status === "paid" || !i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        return dueDate >= now;
      });
      
      // Previous month metrics
      const prevPaidInvoices = invoices.filter(i => {
        if (i.status !== "paid" || !i.paidAt) return false;
        const paidDate = new Date(i.paidAt);
        return paidDate >= previousMonthStart && paidDate <= previousMonthEnd;
      });
      
      const prevPendingInvoices = invoices.filter(i => {
        if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        if (!(dueDate >= previousMonthStart && dueDate <= previousMonthEnd)) return false;
        return !i.paidAt || new Date(i.paidAt) > previousMonthEnd;
      });
      
      const prevRevenue = prevPaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      const stats = {
        totalRevenue: currentRevenue,
        totalRevenueTrend: calculateTrend(currentRevenue, prevRevenue),
        paidInvoicesCount: currentPaidInvoices.length,
        paidInvoicesTrend: calculateTrend(currentPaidInvoices.length, prevPaidInvoices.length),
        pendingInvoicesCount: currentPendingInvoices.length,
        pendingInvoicesTrend: calculateTrend(currentPendingInvoices.length, prevPendingInvoices.length),
        overdueInvoicesCount: currentOverdueInvoices.length,
        overdueInvoicesAmount: currentOverdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        upcomingInvoicesCount: upcomingInvoices.length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching financial stats:", error);
      res.status(500).json({ error: "Failed to fetch financial stats" });
    }
  });

  // License Stats - Real data with trends
  app.get("/api/stats/licenses", isAuthenticated, requirePermission('licenses', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      
      // Return empty metrics for users without company (graceful empty state)
      if (companyId === null) {
        return res.json({
          totalLicenses: 0,
          activeLicenses: 0,
          activeLicensesTrend: null,
          inactiveLicenses: 0,
        });
      }
      
      const licenses = await storage.getAllLicenses(companyId);
      
      // Current stats
      const now = new Date();
      const activeLicenses = licenses.filter(l => {
        const activatedAt = new Date(l.activatedAt);
        const expiresAt = new Date(l.expiresAt);
        return activatedAt <= now && expiresAt > now && l.isActive;
      });
      
      const inactiveLicenses = licenses.filter(l => !l.isActive);
      
      // Previous month boundaries
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      
      // Previous month stats
      const prevActiveLicenses = licenses.filter(l => {
        const activatedAt = new Date(l.activatedAt);
        const expiresAt = new Date(l.expiresAt);
        return activatedAt <= previousMonthEnd && expiresAt > previousMonthEnd;
      });

      const stats = {
        totalLicenses: licenses.length,
        activeLicenses: activeLicenses.length,
        activeLicensesTrend: calculateTrend(activeLicenses.length, prevActiveLicenses.length),
        inactiveLicenses: inactiveLicenses.length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching license stats:", error);
      res.status(500).json({ error: "Failed to fetch license stats" });
    }
  });

  

  // User-Company Routes
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    console.log("========================================");
    console.log("ENDPOINT /api/users CALLED!");
    console.log("========================================");
    try {
      console.log("[GET /api/users] Starting request...");
      const usersWithRoles = await storage.getAllUsersWithRoles();
      console.log(`[GET /api/users] Got ${usersWithRoles.length} users from getAllUsersWithRoles`);
      
      // Fetch companies for each user
      const usersWithCompanies = await Promise.all(
        usersWithRoles.map(async (user) => {
          const companies = await storage.getUserCompanies(user.id);
          console.log(`[GET /api/users] User ${user.email} (${user.id}) has ${companies.length} companies`);
          return { ...user, companies };
        })
      );
      
      // Debug: Check what's being returned
      console.log("[GET /api/users] Final data check:");
      console.log("- Total users:", usersWithCompanies.length);
      if (usersWithCompanies.length > 0) {
        const firstUser = usersWithCompanies[0];
        console.log("- First user ID:", firstUser.id);
        console.log("- First user has companies field?", 'companies' in firstUser);
        console.log("- First user companies value:", firstUser.companies);
        console.log("- First user companies type:", typeof firstUser.companies);
        console.log("- First user has roles field?", 'roles' in firstUser);
        console.log("- First user roles value:", firstUser.roles);
      }
      
      res.json(usersWithCompanies);
    } catch (error) {
      console.error("[GET /api/users] Error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  

  

  

  

  // Rate limiting for initial setup endpoint
  const initialSetupAttempts = new Map<string, { count: number; resetAt: number }>();
  
  // ADMIN: Initial setup endpoint - Associates current admin user with all existing companies
  app.post("/api/admin/initial-setup", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const oauthId = sessionUser?.claims?.sub || sessionUser?.email || sessionUser?.dbUserId || 'local';
      const { masterPassword } = req.body;
      
      // Rate limiting: 5 attempts per hour per user
      const now = Date.now();
      const userAttempts = initialSetupAttempts.get(oauthId);
      
      if (userAttempts) {
        if (now < userAttempts.resetAt) {
          if (userAttempts.count >= 5) {
            return res.status(429).json({ 
              error: "Muitas tentativas. Tente novamente mais tarde." 
            });
          }
          userAttempts.count++;
        } else {
          initialSetupAttempts.set(oauthId, { count: 1, resetAt: now + 3600000 });
        }
      } else {
        initialSetupAttempts.set(oauthId, { count: 1, resetAt: now + 3600000 });
      }
      
      // Validate master password exists
      const MASTER_PASSWORD = process.env.MASTER_PASSWORD;
      
      if (!MASTER_PASSWORD) {
        console.error('[POST /api/admin/initial-setup] MASTER_PASSWORD not configured');
        return res.status(503).json({ 
          error: "Configuração de segurança não encontrada. Entre em contato com o suporte." 
        });
      }
      
      if (!masterPassword || masterPassword !== MASTER_PASSWORD) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[POST /api/admin/initial-setup] Invalid password attempt');
        }
        return res.status(403).json({ 
          error: "Senha master inválida." 
        });
      }
      
      // Get user with proper ID conversion
      const user = await getUserFromSession(sessionUser);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      const userId = user.id; // Use database UUID, not OAuth ID
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[POST /api/admin/initial-setup] Starting initial setup for user:', user.email);
      }
      
      // Get all companies
      const allCompanies = await storage.getAllCompanies();
      console.log('[POST /api/admin/initial-setup] Found', allCompanies.length, 'companies');
      
      if (allCompanies.length === 0) {
        return res.status(400).json({ 
          error: "Nenhuma empresa encontrada. Crie empresas primeiro." 
        });
      }
      
      // Get user's current companies
      const currentCompanies = await storage.getUserCompanies(userId);
      const currentCompanyIds = new Set(currentCompanies.map(c => c.id));
      console.log('[POST /api/admin/initial-setup] User already has', currentCompanies.length, 'companies');
      
      // Associate user with all companies they don't have yet
      const associations = [];
      for (const company of allCompanies) {
        if (!currentCompanyIds.has(company.id)) {
          try {
            const association = await storage.assignUserToCompany({
              userId,
              companyId: company.id,
            });
            associations.push(association);
            console.log('[POST /api/admin/initial-setup] Associated user with company:', company.name);
          } catch (error: any) {
            // Skip if already exists
            if (error.code === '23505') {
              console.log('[POST /api/admin/initial-setup] User already associated with:', company.name);
            } else {
              throw error;
            }
          }
        }
      }
      
      // Set first company as active if user doesn't have one
      if (!user.activeCompanyId && allCompanies.length > 0) {
        await storage.setActiveCompany(userId, allCompanies[0].id);
        console.log('[POST /api/admin/initial-setup] Set active company to:', allCompanies[0].name);
      }
      
      // Return final state
      const finalCompanies = await storage.getUserCompanies(userId);
      
      console.log('[POST /api/admin/initial-setup] Setup complete. User now has', finalCompanies.length, 'companies');
      
      res.json({
        success: true,
        message: `Configuração concluída! Você foi associado a ${finalCompanies.length} empresa(s).`,
        newAssociations: associations.length,
        totalCompanies: finalCompanies.length,
        companies: finalCompanies.map(c => ({ id: c.id, name: c.name }))
      });
    } catch (error) {
      console.error("[POST /api/admin/initial-setup] Error:", error);
      res.status(500).json({ error: "Falha ao realizar configuração inicial" });
    }
  });

  // TEMPORARY: User data fix endpoint (only accessible when authenticated)
  app.post("/api/admin/fix-user-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.dbUserId || req.user.claims.sub;
      const { action, companyId } = req.body;
      
      console.log('[fix-user-data] User:', userId, 'Action:', action, 'CompanyId:', companyId);
      
      if (action === 'make-admin') {
        // Get user by ID first
        let user = await storage.getUser(userId);
        
        // Fallback to email if not found
        if (!user && req.user.claims?.email) {
          user = await storage.getUserByEmail(req.user.claims.email);
        }
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Update user to admin
        await storage.updateUser(user.id, { role: 'admin' });
        console.log('[fix-user-data] User promoted to admin:', user.email);
        
        return res.json({ success: true, message: "User promoted to admin" });
      }
      
      if (action === 'assign-company') {
        let user = await storage.getUser(userId);
        if (!user && req.user.claims?.email) {
          user = await storage.getUserByEmail(req.user.claims.email);
        }
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        if (!companyId) {
          return res.status(400).json({ error: "Company ID is required" });
        }
        
        // Assign user to company
        await storage.assignUserToCompany({ userId: user.id, companyId });
        console.log('[fix-user-data] User assigned to company:', user.email, companyId);
        
        return res.json({ success: true, message: "User assigned to company" });
      }
      
      if (action === 'set-active-company') {
        let user = await storage.getUser(userId);
        if (!user && req.user.claims?.email) {
          user = await storage.getUserByEmail(req.user.claims.email);
        }
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        if (!companyId) {
          return res.status(400).json({ error: "Company ID is required" });
        }
        
        // Set active company
        await storage.setActiveCompany(user.id, companyId);
        console.log('[fix-user-data] Active company set:', user.email, companyId);
        
        return res.json({ success: true, message: "Active company set" });
      }
      
      return res.status(400).json({ error: "Invalid action" });
    } catch (error: any) {
      console.error("[fix-user-data] Error:", error);
      
      // Handle duplicate assignment
      if (error.code === '23505' && error.constraint === 'user_companies_user_id_company_id_unique') {
        return res.status(409).json({ error: "User already assigned to this company" });
      }
      
      res.status(500).json({ error: error.message || "Failed to fix user data" });
    }
  });

  // TEMPORARY: Get all companies (no permission required, only authentication)
  app.get("/api/admin/all-companies", isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching all companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
