import express from "express";
import { storage } from "../storage";
import { insertUserCompanySchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, isAdmin, getUserFromSession } from "../replitAuth";

export const usersAdminRouter = express.Router();
export const userRouter = express.Router();

usersAdminRouter.get("/", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const usersWithRoles = await storage.getAllUsersWithRoles();
    const usersWithCompanies = await Promise.all(
      usersWithRoles.map(async (user) => {
        const companies = await storage.getUserCompanies(user.id);
        return { ...user, companies } as any;
      })
    );
    res.json(usersWithCompanies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

usersAdminRouter.post("/:userId/roles", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params as any;
    const { roleId } = req.body || {};
    if (!roleId) return res.status(400).json({ error: "Role ID is required" });
    const assignment = await storage.assignRole({ userId, roleId });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign role" });
  }
});

usersAdminRouter.delete("/:userId/roles/:roleId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.params as any;
    const success = await storage.removeRoleAssignment(userId, roleId);
    if (!success) return res.status(404).json({ error: "Role assignment not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to remove role" });
  }
});

userRouter.get("/companies", isAuthenticated, async (req, res) => {
  try {
    const sessionUser = req.user as any;
    const userId = sessionUser?.dbUserId || sessionUser?.email || sessionUser?.claims?.sub;
    if (!userId) return res.status(400).json({ error: "User ID not found in session" });
    const user = await getUserFromSession(sessionUser);
    let companies;
    if (user?.role === 'admin') companies = await storage.getAllCompanies();
    else companies = await storage.getUserCompanies(userId);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user companies" });
  }
});

userRouter.patch("/active-company", isAuthenticated, async (req, res) => {
  try {
    const sessionUser = req.user as any;
    const userId = sessionUser?.dbUserId || sessionUser?.email || sessionUser?.claims?.sub;
    const { companyId } = req.body || {};
    if (!companyId) return res.status(400).json({ error: "companyId is required" });
    const currentUser = await getUserFromSession(sessionUser);
    if (!currentUser) return res.status(401).json({ error: "User not found" });
    if (currentUser.role !== 'admin') {
      const userCompanies = await storage.getUserCompanies(userId);
      const hasAccess = userCompanies.some(c => c.id === companyId);
      if (!hasAccess) return res.status(403).json({ error: "User does not have access to this company" });
    }
    const user = await storage.setActiveCompany(currentUser.id, companyId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to set active company" });
  }
});

usersAdminRouter.post("/companies", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = insertUserCompanySchema.parse(req.body);
    const userCompany = await storage.assignUserToCompany(validatedData);
    res.status(201).json(userCompany);
  } catch (error: any) {
    if (error.code === '23505' && error.constraint === 'user_companies_user_id_company_id_unique') {
      return res.status(409).json({ error: "Usuário já está associado a esta empresa" });
    }
    res.status(500).json({ error: "Failed to assign user to company" });
  }
});

usersAdminRouter.delete("/companies/:userId/:companyId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, companyId } = req.params as any;
    const deleted = await storage.removeUserFromCompany(userId, companyId);
    if (!deleted) return res.status(404).json({ error: "Association not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to remove user from company" });
  }
});

