import express from "express";
import { storage } from "../storage";
import { insertCashAccountSchema, insertCashBaseSchema, insertCashSessionSchema, insertCashAccountTypeSchema } from "@shared/schema";
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

export const cashRouter = express.Router();

cashRouter.get("/accounts", isAuthenticated, requirePermission('cash_accounts', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const { q, movement, inactive, category, accountType, orderBy, orderDir, page, pageSize, filters, logical, filtersTree } = req.query as any;
    let parsedFilters: any[] | undefined;
    let parsedTree: any | undefined;
    try { parsedFilters = filters ? JSON.parse(filters) : undefined; } catch {}
    try { parsedTree = filtersTree ? JSON.parse(filtersTree) : undefined; } catch {}
    const treeToUse = parsedTree || (parsedFilters?.length ? { type: 'group', logical: logical === 'OR' ? 'OR' : 'AND', children: parsedFilters.map((f: any) => ({ type: 'cond', ...f })) } : undefined);
    const result = await storage.listCashAccounts({ companyId: companyId as any, q, movement, inactive: inactive === 'true' ? true : inactive === 'false' ? false : undefined, category: category ? parseInt(category) : undefined, accountType: accountType ? parseInt(accountType) : undefined, orderBy: orderBy === 'description' || orderBy === 'category' || orderBy === 'accountCashType' ? orderBy : undefined, orderDir: orderDir === 'desc' ? 'desc' : 'asc', page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined, filtersTree: treeToUse });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cash accounts" });
  }
});

cashRouter.post("/accounts", isAuthenticated, requirePermission('cash_accounts', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Nenhuma empresa ativa selecionada" });
    const data = insertCashAccountSchema.parse({ ...req.body, companyId });
    const created = await storage.createCashAccount(data);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to create cash account" });
  }
});

cashRouter.patch("/accounts/:id", isAuthenticated, requirePermission('cash_accounts', 'update'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const updates = insertCashAccountSchema.partial().parse(req.body);
    delete (updates as any).companyId;
    const updated = await storage.updateCashAccount(req.params.id, updates, companyId as any);
    if (!updated) return res.status(404).json({ error: "Conta não encontrada" });
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to update cash account" });
  }
});

cashRouter.delete("/accounts/:id", isAuthenticated, requirePermission('cash_accounts', 'delete'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const ok = await storage.deleteCashAccount(req.params.id, companyId as any);
    if (!ok) return res.status(404).json({ error: "Conta não encontrada" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete cash account" });
  }
});

cashRouter.get("/account-types", isAuthenticated, requirePermission('cash_accounts', 'read'), async (req, res) => {
  try {
    const { q, orderBy, orderDir, page, pageSize } = req.query as any;
    const result = await storage.listCashAccountTypes({ q, orderBy: orderBy === 'name' ? 'name' : 'name', orderDir: orderDir === 'desc' ? 'desc' : 'asc', page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cash account types" });
  }
});

cashRouter.post("/account-types", isAuthenticated, requirePermission('cash_accounts', 'create'), async (req, res) => {
  try {
    const data = insertCashAccountTypeSchema.parse(req.body);
    const created = await storage.createCashAccountType(data);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to create cash account type" });
  }
});

cashRouter.patch("/account-types/:id", isAuthenticated, requirePermission('cash_accounts', 'update'), async (req, res) => {
  try {
    const updates = insertCashAccountTypeSchema.partial().parse(req.body);
    const updated = await storage.updateCashAccountType(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: "Tipo não encontrado" });
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to update cash account type" });
  }
});

cashRouter.delete("/account-types/:id", isAuthenticated, requirePermission('cash_accounts', 'delete'), async (req, res) => {
  try {
    const ok = await storage.deleteCashAccountType(req.params.id);
    if (!ok) return res.status(404).json({ error: "Tipo não encontrado" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete cash account type" });
  }
});

cashRouter.get("/bases", isAuthenticated, requirePermission('cash_bases', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const { q, active, orderBy, orderDir, page, pageSize } = req.query as any;
    const result = await storage.listCashBases({ companyId: companyId as any, q, active: active === 'true' ? true : active === 'false' ? false : undefined, orderBy: orderBy === 'description' || orderBy === 'active' ? orderBy : undefined, orderDir: orderDir === 'desc' ? 'desc' : 'asc', page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cash bases" });
  }
});

cashRouter.post("/bases", isAuthenticated, requirePermission('cash_bases', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Nenhuma empresa ativa selecionada" });
    const sessionUser = req.user as any;
    const user = await getUserFromSession(sessionUser);
    const data = insertCashBaseSchema.parse({ ...req.body, companyId, userId: user?.id });
    const created = await storage.createCashBase(data);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to create cash base" });
  }
});

cashRouter.patch("/bases/:id", isAuthenticated, requirePermission('cash_bases', 'update'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const updates = insertCashBaseSchema.partial().parse(req.body);
    delete (updates as any).companyId;
    const updated = await storage.updateCashBase(req.params.id, updates, companyId as any);
    if (!updated) return res.status(404).json({ error: "Base não encontrada" });
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to update cash base" });
  }
});

cashRouter.delete("/bases/:id", isAuthenticated, requirePermission('cash_bases', 'delete'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const ok = await storage.deleteCashBase(req.params.id, companyId as any);
    if (!ok) return res.status(404).json({ error: "Base não encontrada" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete cash base" });
  }
});

cashRouter.get("/sessions", isAuthenticated, requirePermission('cash_sessions', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const { baseId, status, movement, orderBy, orderDir, openedFrom, openedTo, closedFrom, closedTo, page, pageSize } = req.query as any;
    const result = await storage.listCashSessions({ companyId: companyId as any, baseId, status: status === 'open' || status === 'closed' ? status : undefined, movement, orderBy: orderBy === 'openedAt' || orderBy === 'closedAt' ? orderBy : undefined, orderDir: orderDir === 'asc' ? 'asc' : 'desc', openedFrom: openedFrom ? new Date(openedFrom) : undefined, openedTo: openedTo ? new Date(openedTo) : undefined, closedFrom: closedFrom ? new Date(closedFrom) : undefined, closedTo: closedTo ? new Date(closedTo) : undefined, page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cash sessions" });
  }
});

cashRouter.post("/sessions/open", isAuthenticated, requirePermission('cash_sessions', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    if (!companyId) return res.status(400).json({ error: "Nenhuma empresa ativa selecionada" });
    const sessionUser = req.user as any;
    const user = await getUserFromSession(sessionUser);
    const data = insertCashSessionSchema.parse({ ...req.body, companyId, openedByUserId: user?.id });
    const created = await storage.openCashSession(data);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to open cash session" });
  }
});

cashRouter.post("/sessions/:id/close", isAuthenticated, requirePermission('cash_sessions', 'update'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const updated = await storage.closeCashSession(req.params.id, req.body, companyId as any);
    if (!updated) return res.status(404).json({ error: "Sessão não encontrada" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to close cash session" });
  }
});

