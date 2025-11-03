import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertLicenseSchema, insertInvoiceSchema, insertBoletoConfigSchema, insertCompanySchema, insertUserCompanySchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin, requirePermission } from "./replitAuth";

// Helper function to get companyId for multi-tenant data isolation
// Returns undefined for admins (they can see all companies)
// Returns activeCompanyId for regular users (throws if not set)
async function getCompanyIdForUser(req: any): Promise<string | undefined> {
  const userId = req.user.claims.sub;
  const user = await storage.getUser(userId);
  
  // Admin users can see all companies
  if (user?.role === 'admin') {
    return undefined;
  }
  
  // Regular users must have an active company
  if (!user?.activeCompanyId) {
    throw new Error('User does not have an active company set');
  }
  
  return user.activeCompanyId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - Reference: blueprint:javascript_log_in_with_replit
  await setupAuth(app);

  // Auth route to get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
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
      const userId = sessionUser.claims.sub;
      const user = await storage.getUser(userId);
      
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

  app.get("/api/licenses", isAuthenticated, requirePermission('licenses', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const licenses = await storage.getAllLicenses(companyId);
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch licenses" });
    }
  });

  app.get("/api/licenses/:id", isAuthenticated, requirePermission('licenses', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const license = await storage.getLicense(req.params.id, companyId);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }
      res.json(license);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch license" });
    }
  });

  app.post("/api/licenses", isAuthenticated, requirePermission('licenses', 'create'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const validatedData = insertLicenseSchema.parse(req.body);
      
      // Enforce company isolation: overwrite companyId for non-admin users
      if (companyId) {
        validatedData.companyId = companyId;
      }
      
      const license = await storage.createLicense(validatedData);
      res.status(201).json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create license" });
    }
  });

  app.patch("/api/licenses/:id", isAuthenticated, requirePermission('licenses', 'update'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const validatedData = insertLicenseSchema.partial().parse(req.body);
      
      // Prevent companyId reassignment: remove from payload
      delete validatedData.companyId;
      
      const license = await storage.updateLicense(req.params.id, validatedData, companyId);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }
      res.json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update license" });
    }
  });

  app.delete("/api/licenses/:id", isAuthenticated, requirePermission('licenses', 'delete'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const deleted = await storage.deleteLicense(req.params.id, companyId);
      if (!deleted) {
        return res.status(404).json({ error: "License not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete license" });
    }
  });

  app.get("/api/invoices", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const invoices = await storage.getAllInvoices(companyId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const invoice = await storage.getInvoice(req.params.id, companyId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", isAuthenticated, requirePermission('invoices', 'create'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      // Enforce company isolation: overwrite companyId for non-admin users
      if (companyId) {
        validatedData.companyId = companyId;
      }
      
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", isAuthenticated, requirePermission('invoices', 'update'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      
      // Prevent companyId reassignment: remove from payload
      delete validatedData.companyId;
      
      const invoice = await storage.updateInvoice(req.params.id, validatedData, companyId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Automatic license control: if invoice is marked as paid, check if client has other overdue invoices
      if (validatedData.status === 'paid' && invoice.clientId) {
        // Get all invoices for this client
        const clientInvoices = await storage.getInvoicesByClientId(invoice.clientId);
        const now = new Date();
        
        // Check if client has any other overdue unpaid invoices
        const hasOtherOverdue = clientInvoices.some(
          inv => inv.id !== invoice.id && 
                 inv.status !== 'paid' && 
                 inv.dueDate && 
                 new Date(inv.dueDate) < now
        );
        
        // Only unblock if client has no other overdue invoices
        if (!hasOtherOverdue) {
          await storage.unblockClientLicenses(invoice.clientId);
        }
        // If client still has overdue invoices, keep licenses blocked
      }
      
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, requirePermission('invoices', 'delete'), async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const deleted = await storage.deleteInvoice(req.params.id, companyId);
      if (!deleted) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Automatic license blocking - Check overdue invoices and block/unblock licenses
  app.post("/api/licenses/check-overdue", isAuthenticated, async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const result = await storage.checkAndBlockOverdueLicenses(companyId);
      res.json(result);
    } catch (error) {
      console.error("Error checking overdue licenses:", error);
      res.status(500).json({ error: "Failed to check overdue licenses" });
    }
  });

  app.get("/api/boleto/config", isAuthenticated, requirePermission('boleto_config', 'read'), async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin';
      
      let companyId: string | undefined;
      
      if (isAdmin) {
        // Admins MUST specify companyId explicitly via query parameter
        companyId = req.query.companyId as string;
        if (!companyId) {
          return res.status(400).json({ error: "Admins must specify ?companyId=xxx" });
        }
      } else {
        // Regular users use their active company
        companyId = await getCompanyIdForUser(req);
      }
      
      const config = await storage.getBoletoConfig(companyId);
      if (!config) {
        return res.json(null);
      }
      
      const maskedConfig = {
        ...config,
        appToken: config.appToken ? `${config.appToken.substring(0, 4)}${"*".repeat(Math.max(0, config.appToken.length - 8))}${config.appToken.substring(Math.max(0, config.appToken.length - 4))}` : "",
        accessToken: config.accessToken ? `${config.accessToken.substring(0, 4)}${"*".repeat(Math.max(0, config.accessToken.length - 8))}${config.accessToken.substring(Math.max(0, config.accessToken.length - 4))}` : "",
      };
      res.json(maskedConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch boleto configuration" });
    }
  });

  app.post("/api/boleto/config", isAuthenticated, requirePermission('boleto_config', 'update'), async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin';
      
      const validatedData = insertBoletoConfigSchema.parse(req.body);
      let companyId: string;
      
      if (isAdmin) {
        // Admins MUST specify companyId in payload
        if (!validatedData.companyId) {
          return res.status(400).json({ error: "Admins must specify companyId in payload" });
        }
        companyId = validatedData.companyId;
      } else {
        // Regular users: always use their active company (enforce isolation)
        const userCompanyId = await getCompanyIdForUser(req);
        if (!userCompanyId) {
          return res.status(400).json({ error: "Active company not set" });
        }
        companyId = userCompanyId;
        validatedData.companyId = companyId;
      }
      
      const config = await storage.saveBoletoConfig(validatedData);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save boleto configuration" });
    }
  });

  app.post("/api/boleto/print/:id", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin';
      
      let companyId: string | undefined;
      
      if (isAdmin) {
        // Admins MUST specify companyId explicitly via query parameter
        companyId = req.query.companyId as string;
        if (!companyId) {
          return res.status(400).json({ error: "Admins must specify ?companyId=xxx" });
        }
      } else {
        // Regular users use their active company
        companyId = await getCompanyIdForUser(req);
      }
      
      const config = await storage.getBoletoConfig(companyId);
      if (!config) {
        return res.status(400).json({ error: "Configuração de boleto não encontrada. Configure primeiro." });
      }

      const invoiceId = req.params.id;
      const boletoApiUrl = `http://51.222.16.165:3010/v1/boleto/${invoiceId}`;

      const response = await fetch(boletoApiUrl, {
        method: 'GET',
        headers: {
          'app_token': config.appToken,
          'access_token': config.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Boleto API error:", errorText);
        return res.status(response.status).json({ 
          error: "Erro ao gerar boleto", 
          details: errorText 
        });
      }

      const boletoData = await response.json();
      
      if (!boletoData || (!boletoData.url && !boletoData.pdf && !boletoData.link && !boletoData.base64 && !boletoData.pdfBase64)) {
        console.error("Invalid boleto response:", boletoData);
        return res.status(500).json({ 
          error: "Resposta inválida da API de boletos",
          details: "A API não retornou um link ou arquivo válido para o boleto" 
        });
      }

      res.json(boletoData);
    } catch (error) {
      console.error("Error printing boleto:", error);
      res.status(500).json({ error: "Falha ao conectar com a API de boletos" });
    }
  });

  // Admin - User Management Routes
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithRoles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users/:userId/roles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      
      if (!roleId) {
        return res.status(400).json({ error: "Role ID is required" });
      }

      const assignment = await storage.assignRole({ userId, roleId });
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ error: "Failed to assign role" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, roleId } = req.params;
      const success = await storage.removeRoleAssignment(userId, roleId);
      
      if (!success) {
        return res.status(404).json({ error: "Role assignment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing role:", error);
      res.status(500).json({ error: "Failed to remove role" });
    }
  });

  // Admin - Role Management Routes
  app.get("/api/roles", isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Admin - Permission Management Routes
  app.get("/api/permissions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.put("/api/permissions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const permission = await storage.updateRolePermission(id, updates);
      
      if (!permission) {
        return res.status(404).json({ error: "Permission not found" });
      }
      
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Failed to update permission" });
    }
  });

  // Current user permissions (for UI guards)
  app.get("/api/me/permissions", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      
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

  app.get("/api/stats/dashboard", isAuthenticated, async (req, res) => {
    try {
      const companyId = await getCompanyIdForUser(req);
      const clients = await storage.getAllClients(companyId);
      const licenses = await storage.getAllLicenses(companyId);
      
      // Get company details for revenue calculation
      const company = companyId ? await storage.getCompany(companyId) : null;

      const activeClients = clients.filter(c => c.status === "active").length;
      const activeLicenses = licenses.filter(l => l.isActive).length;
      
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

      const stats = {
        totalClients: clients.length,
        activeLicenses: activeLicenses,
        monthlyRevenue: monthlyRevenue,
        conversionRate: clients.length > 0 ? (activeLicenses / clients.length) * 100 : 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Company Routes - Multi-tenant support
  app.get("/api/companies", isAuthenticated, requirePermission('companies', 'read'), async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", isAuthenticated, requirePermission('companies', 'create'), async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      
      // Convert empty strings to null for numeric fields (PostgreSQL requirement)
      const cleanedData = {
        ...validatedData,
        monthlyValue: validatedData.monthlyValue === "" ? null : validatedData.monthlyValue,
        revenueSharePercentage: validatedData.revenueSharePercentage === "" ? null : validatedData.revenueSharePercentage,
        freeLicenseQuota: validatedData.freeLicenseQuota === "" ? null : validatedData.freeLicenseQuota,
      };
      
      const company = await storage.createCompany(cleanedData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, requirePermission('companies', 'update'), async (req, res) => {
    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      
      // Convert empty strings to null for numeric fields (PostgreSQL requirement)
      const cleanedData = {
        ...validatedData,
        monthlyValue: validatedData.monthlyValue === "" ? null : validatedData.monthlyValue,
        revenueSharePercentage: validatedData.revenueSharePercentage === "" ? null : validatedData.revenueSharePercentage,
        freeLicenseQuota: validatedData.freeLicenseQuota === "" ? null : validatedData.freeLicenseQuota,
      };
      
      const company = await storage.updateCompany(req.params.id, cleanedData);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", isAuthenticated, requirePermission('companies', 'delete'), async (req, res) => {
    try {
      const deleted = await storage.deleteCompany(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // User-Company Routes
  app.get("/api/user/companies", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      const companies = await storage.getUserCompanies(userId);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching user companies:", error);
      res.status(500).json({ error: "Failed to fetch user companies" });
    }
  });

  app.patch("/api/user/active-company", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const user = await storage.setActiveCompany(userId, companyId);
      res.json(user);
    } catch (error) {
      console.error("Error setting active company:", error);
      res.status(500).json({ error: "Failed to set active company" });
    }
  });

  app.post("/api/user/companies", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertUserCompanySchema.parse(req.body);
      const userCompany = await storage.assignUserToCompany(validatedData);
      res.status(201).json(userCompany);
    } catch (error) {
      console.error("Error assigning user to company:", error);
      res.status(500).json({ error: "Failed to assign user to company" });
    }
  });

  app.delete("/api/user/companies/:userId/:companyId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, companyId } = req.params;
      const deleted = await storage.removeUserFromCompany(userId, companyId);
      if (!deleted) {
        return res.status(404).json({ error: "Association not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from company:", error);
      res.status(500).json({ error: "Failed to remove user from company" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
