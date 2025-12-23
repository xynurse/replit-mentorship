import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { storage } from "./storage";
import { insertCohortSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/admin/stats", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { role, search, isActive } = req.query;
      const users = await storage.getAllUsers({
        role: role as string | undefined,
        search: search as string | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
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

  app.get("/api/tracks", requireAuth, async (req, res, next) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/cohorts", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const cohorts = await storage.getAllCohorts();
      res.json(cohorts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/cohorts/:id", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const cohort = await storage.getCohort(req.params.id);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      res.json(cohort);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cohorts", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const validation = insertCohortSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid cohort data", errors: validation.error.flatten() });
      }
      const cohort = await storage.createCohort({ ...validation.data, createdById: req.user!.id });
      res.status(201).json(cohort);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/cohorts/:id", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const cohort = await storage.updateCohort(req.params.id, req.body);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      res.json(cohort);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/applications", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { status } = req.query;
      const applications = await storage.getMembershipsByStatus(status as string || 'PENDING');
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/applications/:id", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { applicationStatus, notes } = req.body;
      const membership = await storage.updateMembership(req.params.id, { 
        applicationStatus, 
        notes,
        joinedAt: applicationStatus === 'APPROVED' ? new Date() : undefined
      });
      if (!membership) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(membership);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
