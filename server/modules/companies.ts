import express from "express";
import { storage } from "../storage";
import { insertCompanySchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, requirePermission } from "../replitAuth";

export const companiesRouter = express.Router();

companiesRouter.get("/", isAuthenticated, requirePermission('companies', 'read'), async (_req, res) => {
  try {
    const companies = await storage.getAllCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

companiesRouter.post("/", isAuthenticated, requirePermission('companies', 'create'), async (req, res) => {
  try {
    const validatedData = insertCompanySchema.parse(req.body);
    const cleanedData = {
      ...validatedData,
      monthlyValue: validatedData.monthlyValue === "" ? null : validatedData.monthlyValue,
      revenueSharePercentage: validatedData.revenueSharePercentage === "" ? null : validatedData.revenueSharePercentage,
      freeLicenseQuota: validatedData.freeLicenseQuota === "" ? null : validatedData.freeLicenseQuota,
    } as any;
    const company = await storage.createCompany(cleanedData);
    res.status(201).json(company);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to create company" });
  }
});

companiesRouter.patch("/:id", isAuthenticated, requirePermission('companies', 'update'), async (req, res) => {
  try {
    const validatedData = insertCompanySchema.partial().parse(req.body);
    const cleanedData = {
      ...validatedData,
      monthlyValue: validatedData.monthlyValue === "" ? null : validatedData.monthlyValue,
      revenueSharePercentage: validatedData.revenueSharePercentage === "" ? null : validatedData.revenueSharePercentage,
      freeLicenseQuota: validatedData.freeLicenseQuota === "" ? null : validatedData.freeLicenseQuota,
    } as any;
    const company = await storage.updateCompany(req.params.id, cleanedData);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    res.status(500).json({ error: "Failed to update company" });
  }
});

companiesRouter.delete("/:id", isAuthenticated, requirePermission('companies', 'delete'), async (req, res) => {
  try {
    const deleted = await storage.deleteCompany(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Company not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete company" });
  }
});

