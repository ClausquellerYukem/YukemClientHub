import express from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../replitAuth";

export const permissionsRouter = express.Router();

permissionsRouter.get("/", isAuthenticated, isAdmin, async (_req, res) => {
  try {
    const permissions = await storage.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
});

permissionsRouter.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const permission = await storage.updateRolePermission(id, updates);
    if (!permission) return res.status(404).json({ error: "Permission not found" });
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: "Failed to update permission" });
  }
});

