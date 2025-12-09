import express from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export const rolesRouter = express.Router();

rolesRouter.get("/", isAuthenticated, async (_req, res) => {
  try {
    const roles = await storage.getAllRoles();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

