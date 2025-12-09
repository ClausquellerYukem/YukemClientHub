import express from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../replitAuth";
import { run as runSeed } from "../seed";

export const adminRouter = express.Router();

adminRouter.get("/status", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const companies = await storage.getAllCompanies();
    res.json({ services: ["cash", "invoices", "licenses", "boleto", "reports", "companies", "permissions", "users", "roles"], companiesCount: companies.length });
  } catch {
    res.json({ services: ["cash", "invoices", "licenses", "boleto", "reports", "companies", "permissions", "users", "roles"], companiesCount: null });
  }
});

adminRouter.post("/licenses/check-overdue", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { companyId } = req.body || {};
    if (companyId) {
      const result = await storage.checkAndBlockOverdueLicenses(companyId);
      return res.json({ companyId, ...result });
    }
    const companies = await storage.getAllCompanies();
    let totalBlocked = 0;
    let totalUnblocked = 0;
    for (const c of companies) {
      const r = await storage.checkAndBlockOverdueLicenses(c.id);
      totalBlocked += r.blocked || 0;
      totalUnblocked += r.unblocked || 0;
    }
    res.json({ blocked: totalBlocked, unblocked: totalUnblocked });
  } catch (error) {
    res.status(500).json({ error: "Failed to run overdue check" });
  }
});

  adminRouter.get("/ready", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      res.status(200).send("ok");
    } catch {
      res.status(503).send("unready");
    }
  });

  adminRouter.post("/seed", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      await runSeed();
      res.status(201).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to run seed" });
    }
  });
