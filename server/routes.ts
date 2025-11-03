import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertLicenseSchema, insertInvoiceSchema, insertBoletoConfigSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin, requirePermission } from "./replitAuth";

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
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, requirePermission('clients', 'read'), async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
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
      const validatedData = insertClientSchema.parse(req.body);
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
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
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
      // Soft delete - mark as inactive instead of deleting
      const client = await storage.updateClient(req.params.id, { status: "inactive" });
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
      const licenses = await storage.getAllLicenses();
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch licenses" });
    }
  });

  app.get("/api/licenses/:id", isAuthenticated, requirePermission('licenses', 'read'), async (req, res) => {
    try {
      const license = await storage.getLicense(req.params.id);
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
      const validatedData = insertLicenseSchema.parse(req.body);
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
      const validatedData = insertLicenseSchema.partial().parse(req.body);
      const license = await storage.updateLicense(req.params.id, validatedData);
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
      const deleted = await storage.deleteLicense(req.params.id);
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
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
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
      const validatedData = insertInvoiceSchema.parse(req.body);
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
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
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
      const deleted = await storage.deleteInvoice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  app.get("/api/boleto/config", isAuthenticated, requirePermission('boleto_config', 'read'), async (req, res) => {
    try {
      const config = await storage.getBoletoConfig();
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
      const validatedData = insertBoletoConfigSchema.parse(req.body);
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
      const config = await storage.getBoletoConfig();
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
      const clients = await storage.getAllClients();
      const licenses = await storage.getAllLicenses();
      const invoices = await storage.getAllInvoices();

      const activeClients = clients.filter(c => c.status === "active").length;
      const activeLicenses = licenses.filter(l => l.isActive).length;
      
      const paidInvoices = invoices.filter(i => i.status === "paid");
      const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      const stats = {
        totalClients: clients.length,
        activeLicenses: activeLicenses,
        monthlyRevenue: monthlyRevenue,
        conversionRate: clients.length > 0 ? (activeLicenses / clients.length) * 100 : 0,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
