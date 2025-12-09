import express from "express";
import { storage } from "../storage";
import { insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, requirePermission, getUserFromSession } from "../replitAuth";

async function getCompanyIdForUser(req: any): Promise<string | undefined | null> {
  const userId = req.user.dbUserId || req.user.email || req.user.claims?.sub;
  let user = await storage.getUser(userId);
  if (!user && req.user.claims?.email) {
    user = await storage.getUserByEmail(req.user.claims.email);
  }
  if (!user) {
    throw new Error('User not found');
  }
  if (user.activeCompanyId) return user.activeCompanyId;
  if (user.role === 'admin') return undefined;
  return null;
}

export const invoicesRouter = express.Router();

invoicesRouter.get("/", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const invoices = await storage.getAllInvoices(companyId as any);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

invoicesRouter.get("/:id", isAuthenticated, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const invoice = await storage.getInvoice(req.params.id, companyId as any);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

invoicesRouter.post("/", isAuthenticated, requirePermission('invoices', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const validatedData = insertInvoiceSchema.parse(req.body);
    if (companyId) validatedData.companyId = companyId;
    const invoice = await storage.createInvoice(validatedData);
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

invoicesRouter.post("/generate", isAuthenticated, requirePermission('invoices', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const { clientId } = req.body as any;
    if (!clientId) return res.status(400).json({ error: "O ID do cliente é obrigatório" });
    const client = await storage.getClient(clientId, companyId as any);
    if (!client) return res.status(404).json({ error: "Cliente não encontrado ou acesso negado" });
    const dueDay = client.dueDay;
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return res.status(400).json({ error: "Dia de vencimento inválido no cadastro do cliente" });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (dueDate.getDate() !== dueDay) dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if (dueDate < today) {
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      if (dueDate.getDate() !== dueDay) dueDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    }
    const existingInvoices = await storage.getInvoicesByClientId(clientId);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    const duplicateInvoice = existingInvoices.find(inv => new Date(inv.dueDate).toISOString().split('T')[0] === dueDateStr);
    if (duplicateInvoice) return res.status(409).json({ error: "Já existe uma fatura para este cliente com a mesma data de vencimento" });
    const invoiceData = { companyId: client.companyId, clientId: client.id, amount: client.monthlyValue, dueDate, status: "pending" as const };
    const invoice = await storage.createInvoice(invoiceData as any);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Falha ao gerar fatura" });
  }
});

invoicesRouter.patch("/:id", isAuthenticated, requirePermission('invoices', 'update'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const validatedData = insertInvoiceSchema.partial().parse(req.body);
    delete (validatedData as any).companyId;
    const invoice = await storage.updateInvoice(req.params.id, validatedData, companyId as any);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (validatedData.status === 'paid' && invoice.clientId) {
      const clientInvoices = await storage.getInvoicesByClientId(invoice.clientId);
      const now = new Date();
      const hasOtherOverdue = clientInvoices.some(inv => inv.id !== invoice.id && inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < now);
      if (!hasOtherOverdue) await storage.unblockClientLicenses(invoice.clientId);
    }
    res.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

invoicesRouter.delete("/:id", isAuthenticated, requirePermission('invoices', 'delete'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const deleted = await storage.deleteInvoice(req.params.id, companyId as any);
    if (!deleted) return res.status(404).json({ error: "Invoice not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

