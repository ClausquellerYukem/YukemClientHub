import express from "express";
import { storage } from "../storage";
import { insertLicenseSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, requirePermission } from "../replitAuth";

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

export const licensesRouter = express.Router();

licensesRouter.get("/", isAuthenticated, requirePermission('licenses', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const licenses = await storage.getAllLicenses(companyId as any);
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch licenses" });
  }
});

licensesRouter.get("/:id", isAuthenticated, requirePermission('licenses', 'read'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const license = await storage.getLicense(req.params.id, companyId as any);
    if (!license) return res.status(404).json({ error: "License not found" });
    res.json(license);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch license" });
  }
});

licensesRouter.post("/", isAuthenticated, requirePermission('licenses', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const validatedData = insertLicenseSchema.parse(req.body);
    if (companyId) validatedData.companyId = companyId;
    const license = await storage.createLicense(validatedData);
    res.status(201).json(license);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to create license" });
  }
});

licensesRouter.post("/generate", isAuthenticated, requirePermission('licenses', 'create'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const { clientId } = req.body as any;
    if (!clientId) return res.status(400).json({ error: "O ID do cliente é obrigatório" });
    const client = await storage.getClient(clientId, companyId as any);
    if (!client) return res.status(404).json({ error: "Cliente não encontrado ou acesso negado" });
    const existingLicenses = await storage.getAllLicenses(companyId as any);
    const activeLicense = existingLicenses.find(lic => lic.clientId === clientId && lic.isActive === true);
    if (activeLicense) return res.status(409).json({ error: "Já existe uma licença ativa para este cliente" });
    const { customAlphabet } = await import('nanoid');
    const generateSegment = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);
    const generateLicenseKey = () => `${generateSegment()}-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const licenseData = { companyId: client.companyId, clientId: client.id, licenseKey: generateLicenseKey(), isActive: true, expiresAt };
    const license = await storage.createLicense(licenseData as any);
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ error: "Falha ao gerar licença" });
  }
});

licensesRouter.patch("/:id", isAuthenticated, requirePermission('licenses', 'update'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const validatedData = insertLicenseSchema.partial().parse(req.body);
    delete (validatedData as any).companyId;
    const license = await storage.updateLicense(req.params.id, validatedData, companyId as any);
    if (!license) return res.status(404).json({ error: "License not found" });
    res.json(license);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to update license" });
  }
});

licensesRouter.delete("/:id", isAuthenticated, requirePermission('licenses', 'delete'), async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    const deleted = await storage.deleteLicense(req.params.id, companyId as any);
    if (!deleted) return res.status(404).json({ error: "License not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete license" });
  }
});

licensesRouter.post("/check-overdue", isAuthenticated, async (req, res) => {
  try {
    const companyId = await getCompanyIdForUser(req);
    if (companyId === null) return res.json({ blocked: 0, unblocked: 0 });
    const result = await storage.checkAndBlockOverdueLicenses(companyId as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to check overdue licenses" });
  }
});

