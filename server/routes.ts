import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { storage } from "./storage";
import { insertCohortSchema, insertApplicationQuestionSchema, insertCohortMembershipSchema, insertMentorshipMatchSchema } from "@shared/schema";

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

  // ============================================
  // Application Questions Routes
  // ============================================
  
  // Get application questions (public for cohort applications)
  app.get("/api/cohorts/:cohortId/questions", async (req, res, next) => {
    try {
      const { forRole } = req.query;
      const questions = await storage.getApplicationQuestions(req.params.cohortId, forRole as string);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  // Get default questions (admin only)
  app.get("/api/application-questions/defaults", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const questions = await storage.getDefaultQuestions();
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  // Create cohort-specific question (admin only)
  app.post("/api/cohorts/:cohortId/questions", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const validation = insertApplicationQuestionSchema.safeParse({
        ...req.body,
        cohortId: req.params.cohortId,
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid question data", errors: validation.error.flatten() });
      }
      const question = await storage.createApplicationQuestion(validation.data);
      res.status(201).json(question);
    } catch (error) {
      next(error);
    }
  });

  // Update question (admin only)
  app.patch("/api/application-questions/:id", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const question = await storage.updateApplicationQuestion(req.params.id, req.body);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      next(error);
    }
  });

  // Delete question (admin only)
  app.delete("/api/application-questions/:id", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      await storage.deleteApplicationQuestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // Public Application Routes
  // ============================================

  // Get public cohort info for application
  app.get("/api/public/cohorts/:id", async (req, res, next) => {
    try {
      const cohort = await storage.getCohort(req.params.id);
      if (!cohort || !cohort.isPublic) {
        return res.status(404).json({ message: "Cohort not found or not accepting applications" });
      }
      if (cohort.status !== 'RECRUITING') {
        return res.status(400).json({ message: "This cohort is not currently accepting applications" });
      }
      res.json({
        id: cohort.id,
        name: cohort.name,
        description: cohort.description,
        applicationDeadline: cohort.applicationDeadline,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
      });
    } catch (error) {
      next(error);
    }
  });

  // Submit application (authenticated users)
  app.post("/api/cohorts/:cohortId/apply", requireAuth, async (req, res, next) => {
    try {
      const { role, trackId, responses } = req.body;
      const cohortId = req.params.cohortId;
      const userId = req.user!.id;

      // Check cohort exists and is recruiting
      const cohort = await storage.getCohort(cohortId);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      if (cohort.status !== 'RECRUITING') {
        return res.status(400).json({ message: "This cohort is not accepting applications" });
      }

      // Check if user already applied
      const existing = await storage.getMembershipByUserAndCohort(userId, cohortId);
      if (existing) {
        return res.status(400).json({ message: "You have already applied to this cohort" });
      }

      // Create membership (application)
      const membership = await storage.createMembership({
        cohortId,
        userId,
        role: role as any,
        trackId,
        applicationStatus: 'PENDING',
        applicationData: { submittedAt: new Date().toISOString() },
      });

      // Save application responses
      if (responses && Array.isArray(responses)) {
        for (const resp of responses) {
          await storage.createApplicationResponse({
            membershipId: membership.id,
            questionId: resp.questionId,
            response: resp.response,
          });
        }
      }

      res.status(201).json({ 
        message: "Application submitted successfully",
        applicationId: membership.id
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // Matching Configuration Routes
  // ============================================

  // Get matching configuration for cohort
  app.get("/api/cohorts/:cohortId/matching-config", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      let config = await storage.getMatchingConfiguration(req.params.cohortId);
      if (!config) {
        // Return default configuration
        config = {
          id: '',
          cohortId: req.params.cohortId,
          languageWeight: 25,
          trackWeight: 20,
          expertiseWeight: 25,
          availabilityWeight: 15,
          experienceWeight: 10,
          communicationWeight: 5,
          minimumScore: 50,
          requireLanguageMatch: true,
          maxMenteesPerMentor: 3,
          createdAt: null,
          updatedAt: null,
        };
      }
      res.json(config);
    } catch (error) {
      next(error);
    }
  });

  // Create or update matching configuration
  app.put("/api/cohorts/:cohortId/matching-config", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const cohortId = req.params.cohortId;
      const existing = await storage.getMatchingConfiguration(cohortId);
      
      if (existing) {
        const config = await storage.updateMatchingConfiguration(cohortId, req.body);
        res.json(config);
      } else {
        const config = await storage.createMatchingConfiguration({ ...req.body, cohortId });
        res.status(201).json(config);
      }
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // Matching Routes
  // ============================================

  // Get unmatched participants for a cohort
  app.get("/api/cohorts/:cohortId/participants", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const cohortId = req.params.cohortId;
      const mentors = await storage.getUnmatchedMemberships(cohortId, 'MENTOR');
      const mentees = await storage.getUnmatchedMemberships(cohortId, 'MENTEE');
      
      // Get application responses for each participant
      const mentorsWithResponses = await Promise.all(mentors.map(async (m) => {
        const responses = await storage.getApplicationResponses(m.id);
        return { ...m, responses };
      }));
      
      const menteesWithResponses = await Promise.all(mentees.map(async (m) => {
        const responses = await storage.getApplicationResponses(m.id);
        return { ...m, responses };
      }));

      res.json({ mentors: mentorsWithResponses, mentees: menteesWithResponses });
    } catch (error) {
      next(error);
    }
  });

  // Get matches for a cohort
  app.get("/api/cohorts/:cohortId/matches", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const matches = await storage.getMatchesByCohort(req.params.cohortId);
      res.json(matches);
    } catch (error) {
      next(error);
    }
  });

  // Create a match
  app.post("/api/cohorts/:cohortId/matches", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { mentorMembershipId, menteeMembershipId, trackId, matchScore, matchReason } = req.body;
      const cohortId = req.params.cohortId;

      const match = await storage.createMatch({
        cohortId,
        mentorMembershipId,
        menteeMembershipId,
        trackId,
        status: 'PROPOSED',
        matchScore,
        matchReason,
        matchedAt: new Date(),
        matchedById: req.user!.id,
      });

      // Update membership match status
      await storage.updateMembership(mentorMembershipId, { matchStatus: 'MATCHED' });
      await storage.updateMembership(menteeMembershipId, { matchStatus: 'MATCHED' });

      res.status(201).json(match);
    } catch (error) {
      next(error);
    }
  });

  // Update match status
  app.patch("/api/matches/:id", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const match = await storage.updateMatch(req.params.id, req.body);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      next(error);
    }
  });

  // Auto-match endpoint (calculates compatibility scores)
  app.post("/api/cohorts/:cohortId/auto-match", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const cohortId = req.params.cohortId;
      const config = await storage.getMatchingConfiguration(cohortId) || {
        languageWeight: 25,
        trackWeight: 20,
        expertiseWeight: 25,
        availabilityWeight: 15,
        experienceWeight: 10,
        communicationWeight: 5,
        minimumScore: 50,
        requireLanguageMatch: true,
        maxMenteesPerMentor: 3,
      };

      const mentors = await storage.getUnmatchedMemberships(cohortId, 'MENTOR');
      const mentees = await storage.getUnmatchedMemberships(cohortId, 'MENTEE');

      // Get responses for all participants
      const mentorData = await Promise.all(mentors.map(async (m) => ({
        ...m,
        responses: await storage.getApplicationResponses(m.id),
      })));

      const menteeData = await Promise.all(mentees.map(async (m) => ({
        ...m,
        responses: await storage.getApplicationResponses(m.id),
      })));

      // Calculate compatibility matrix
      const compatibilityMatrix: Array<{
        mentorId: string;
        menteeId: string;
        score: number;
        breakdown: Record<string, number>;
        flags: string[];
        matchReason: string;
      }> = [];

      for (const mentor of mentorData) {
        for (const mentee of menteeData) {
          const { score, breakdown, flags, matchReason } = calculateCompatibility(
            mentor,
            mentee,
            config
          );
          
          if (score >= (config.minimumScore || 50) || !config.requireLanguageMatch || !flags.includes('no_language_match')) {
            compatibilityMatrix.push({
              mentorId: mentor.id,
              menteeId: mentee.id,
              score,
              breakdown,
              flags,
              matchReason,
            });
          }
        }
      }

      // Sort by score descending
      compatibilityMatrix.sort((a, b) => b.score - a.score);

      res.json({
        mentors: mentorData.map(m => ({ id: m.id, userId: m.userId, user: m.user })),
        mentees: menteeData.map(m => ({ id: m.id, userId: m.userId, user: m.user })),
        compatibilityMatrix,
        config,
      });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}

// Compatibility calculation helper function
function calculateCompatibility(
  mentor: any,
  mentee: any,
  config: any
): { score: number; breakdown: Record<string, number>; flags: string[]; matchReason: string } {
  const breakdown: Record<string, number> = {};
  const flags: string[] = [];
  const reasons: string[] = [];

  // Language Match (25% default weight)
  const mentorLanguages = mentor.user.languagesSpoken || [];
  const menteeLanguages = mentee.user.languagesSpoken || [];
  const sharedLanguages = mentorLanguages.filter((lang: string) => menteeLanguages.includes(lang));
  
  let languageScore = 0;
  if (sharedLanguages.length > 0) {
    if (mentor.user.preferredLanguage === mentee.user.preferredLanguage) {
      languageScore = 100;
      reasons.push(`Primary language match: ${mentor.user.preferredLanguage}`);
    } else {
      languageScore = 50 + (sharedLanguages.length * 10);
      reasons.push(`Shared languages: ${sharedLanguages.join(', ')}`);
    }
  } else {
    flags.push('no_language_match');
    if (config.requireLanguageMatch) {
      reasons.push('WARNING: No language match');
    }
  }
  breakdown.language = languageScore;

  // Track Alignment (20% default weight)
  let trackScore = 0;
  if (mentor.trackId && mentee.trackId) {
    if (mentor.trackId === mentee.trackId) {
      trackScore = 100;
      reasons.push('Same track selected');
    } else {
      trackScore = 30;
    }
  }
  breakdown.track = trackScore;

  // Experience Level Match (10% default weight)
  let experienceScore = 0;
  const mentorExp = mentor.user.yearsOfExperience || 0;
  const menteeExp = mentee.user.yearsOfExperience || 0;
  const expDiff = mentorExp - menteeExp;
  
  if (expDiff >= 5 && expDiff <= 15) {
    experienceScore = 100;
    reasons.push('Good experience gap');
  } else if (expDiff >= 3 && expDiff <= 20) {
    experienceScore = 70;
  } else if (expDiff > 0) {
    experienceScore = 40;
  }
  breakdown.experience = experienceScore;

  // Availability Overlap (15% default weight) - simplified
  let availabilityScore = 50; // Default moderate score
  breakdown.availability = availabilityScore;

  // Expertise/Interest Match (25% default weight) - simplified
  let expertiseScore = 60; // Default moderate score
  breakdown.expertise = expertiseScore;

  // Communication Style (5% default weight) - simplified
  let communicationScore = 50;
  breakdown.communication = communicationScore;

  // Calculate weighted total
  const totalWeight = (config.languageWeight || 25) + (config.trackWeight || 20) + 
    (config.expertiseWeight || 25) + (config.availabilityWeight || 15) + 
    (config.experienceWeight || 10) + (config.communicationWeight || 5);

  const weightedScore = (
    (languageScore * (config.languageWeight || 25)) +
    (trackScore * (config.trackWeight || 20)) +
    (expertiseScore * (config.expertiseWeight || 25)) +
    (availabilityScore * (config.availabilityWeight || 15)) +
    (experienceScore * (config.experienceWeight || 10)) +
    (communicationScore * (config.communicationWeight || 5))
  ) / totalWeight;

  return {
    score: Math.round(weightedScore),
    breakdown,
    flags,
    matchReason: reasons.join('. '),
  };
}
