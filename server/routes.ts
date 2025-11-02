import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertLicenseSchema, insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/clients", isAuthenticated, async (req, res) => {
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

  app.patch("/api/clients/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
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

  app.get("/api/licenses", isAuthenticated, async (req, res) => {
    try {
      const licenses = await storage.getAllLicenses();
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch licenses" });
    }
  });

  app.get("/api/licenses/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/licenses", isAuthenticated, async (req, res) => {
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

  app.patch("/api/licenses/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/licenses/:id", isAuthenticated, async (req, res) => {
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

  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
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

  app.patch("/api/invoices/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
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
