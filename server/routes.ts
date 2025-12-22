import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/users", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      res.json({ message: "User management coming soon" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users/:id/force-logout", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      res.json({ message: "Force logout coming soon" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id/deactivate", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, { isActive: false });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id/activate", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, { isActive: true });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User activated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    const { password: _, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  app.patch("/api/profile", requireAuth, async (req, res, next) => {
    try {
      const allowedFields = [
        "firstName",
        "lastName",
        "phone",
        "timezone",
        "preferredLanguage",
        "languagesSpoken",
        "bio",
        "linkedInUrl",
        "organizationName",
        "jobTitle",
        "yearsOfExperience",
        "profileImage",
      ];

      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
