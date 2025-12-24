import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireRole, getSessionMiddleware } from "./auth";
import { storage } from "./storage";
import { insertCohortSchema, insertApplicationQuestionSchema, insertCohortMembershipSchema, insertMentorshipMatchSchema, insertMessageSchema, insertConversationSchema, insertDocumentSchema, insertFolderSchema, insertDocumentAccessSchema } from "@shared/schema";
import { setupWebSocket, getOnlineUsers, isUserOnline } from "./websocket";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  
  // Set up WebSocket server after auth is initialized
  const sessionMiddleware = getSessionMiddleware();
  if (sessionMiddleware) {
    setupWebSocket(httpServer, sessionMiddleware);
  }

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

  // ============= MESSAGING ROUTES =============

  // Get user's conversations
  app.get("/api/conversations", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
      
      const sanitizedConversations = conversations.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => ({
          ...p,
          user: { 
            id: p.user.id, 
            firstName: p.user.firstName, 
            lastName: p.user.lastName, 
            profileImage: p.user.profileImage 
          }
        }))
      }));
      
      res.json(sanitizedConversations);
    } catch (error) {
      next(error);
    }
  });

  // Get or create direct conversation with another user
  app.post("/api/conversations/direct", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { recipientId } = req.body;
      
      if (!recipientId) {
        return res.status(400).json({ message: "Recipient ID is required" });
      }
      
      const conversation = await storage.getOrCreateDirectConversation(userId, recipientId);
      const participants = await storage.getConversationParticipants(conversation.id);
      
      res.json({
        ...conversation,
        participants: participants.map(p => ({
          ...p,
          user: { 
            id: p.user.id, 
            firstName: p.user.firstName, 
            lastName: p.user.lastName, 
            profileImage: p.user.profileImage 
          }
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  // Get single conversation
  app.get("/api/conversations/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const participants = await storage.getConversationParticipants(id);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ message: "Not authorized to view this conversation" });
      }
      
      res.json({
        ...conversation,
        participants: participants.map(p => ({
          ...p,
          user: { 
            id: p.user.id, 
            firstName: p.user.firstName, 
            lastName: p.user.lastName, 
            profileImage: p.user.profileImage 
          }
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const { limit, before } = req.query;
      
      const participants = await storage.getConversationParticipants(id);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ message: "Not authorized to view this conversation" });
      }
      
      const messages = await storage.getMessages(
        id, 
        limit ? parseInt(limit as string) : 50,
        before as string | undefined
      );
      
      res.json(messages.map(m => ({
        ...m,
        sender: { 
          id: m.sender.id, 
          firstName: m.sender.firstName, 
          lastName: m.sender.lastName, 
          profileImage: m.sender.profileImage 
        }
      })));
    } catch (error) {
      next(error);
    }
  });

  // Send a message via REST (fallback if WebSocket not available)
  app.post("/api/conversations/:id/messages", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const { content, replyToId } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const participants = await storage.getConversationParticipants(id);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ message: "Not authorized to send to this conversation" });
      }
      
      const message = await storage.createMessage({
        conversationId: id,
        senderId: userId,
        content: content.trim(),
        messageType: "TEXT",
        replyToId,
      });
      
      const sender = await storage.getUser(userId);
      
      res.status(201).json({
        ...message,
        sender: sender ? { 
          id: sender.id, 
          firstName: sender.firstName, 
          lastName: sender.lastName, 
          profileImage: sender.profileImage 
        } : null,
        attachments: []
      });
    } catch (error) {
      next(error);
    }
  });

  // Mark messages as read
  app.post("/api/conversations/:id/read", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      
      const participants = await storage.getConversationParticipants(id);
      if (!participants.some(p => p.userId === userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.markMessagesAsRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Get online users
  app.get("/api/users/online", requireAuth, async (req, res, next) => {
    try {
      const onlineUserIds = getOnlineUsers();
      res.json({ onlineUserIds });
    } catch (error) {
      next(error);
    }
  });

  // Check if specific user is online
  app.get("/api/users/:id/online", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      res.json({ isOnline: isUserOnline(id) });
    } catch (error) {
      next(error);
    }
  });

  // Create track community conversation (admin only)
  app.post("/api/conversations/community", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { trackId, cohortId, name } = req.body;
      
      const conversation = await storage.createConversation({
        type: "TRACK_COMMUNITY",
        name,
        trackId,
        cohortId,
        createdById: userId,
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  });

  // Create cohort announcement channel (admin only)
  app.post("/api/conversations/announcement", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const { cohortId, name } = req.body;
      
      const conversation = await storage.createConversation({
        type: "COHORT_ANNOUNCEMENT",
        name: name || "Announcements",
        cohortId,
        createdById: userId,
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  });

  // Document access validator for file downloads
  const validateDocumentAccess = async (req: Request, canonicalKey: string): Promise<boolean> => {
    const user = req.user;
    if (!user) return false;
    
    // canonicalKey is already normalized by the download handler
    // Look up document by canonical key (storage handles dual-lookup for legacy formats)
    const doc = await storage.getDocumentByFileUrl(canonicalKey);
    
    // If no document found for this path, deny access (could be orphaned file)
    if (!doc) return false;
    
    // Check document access permission
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    if (isAdmin) return true;
    
    const isOwner = doc.uploadedById === user.id;
    if (isOwner) return true;
    
    const isPublic = doc.visibility === 'PUBLIC';
    if (isPublic) return true;
    
    // Check for explicit share access
    const accessRecord = await storage.getUserDocumentAccess(doc.id, user.id);
    if (accessRecord) return true;
    
    return false;
  };

  // Register object storage routes for file uploads with authentication and ACL
  registerObjectStorageRoutes(app, requireAuth, validateDocumentAccess);

  // ============ DOCUMENT MANAGEMENT ROUTES ============

  // Get all documents with filtering
  app.get("/api/documents", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const { folderId, cohortId, trackId, matchId, visibility, category, isTemplate, search } = req.query;
      const allDocs = await storage.getDocuments({
        folderId: folderId === 'null' ? null : folderId as string | undefined,
        cohortId: cohortId as string | undefined,
        trackId: trackId as string | undefined,
        matchId: matchId as string | undefined,
        visibility: visibility as string | undefined,
        category: category as string | undefined,
        isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
        search: search as string | undefined,
      });
      
      // Filter documents based on user visibility permissions
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      
      // Get all documents user has explicit access to
      const userAccessDocs = await storage.getDocumentAccessByUser(user.id);
      const accessibleDocIds = new Set(userAccessDocs.map(a => a.documentId));
      
      const filteredDocs = allDocs.filter(doc => {
        // Admins can see all documents
        if (isAdmin) return true;
        // Owner can always see their own documents
        if (doc.uploadedById === user.id) return true;
        // PUBLIC documents visible to everyone
        if (doc.visibility === 'PUBLIC') return true;
        // Check if user has explicit share access
        if (accessibleDocIds.has(doc.id)) return true;
        // PRIVATE only visible to owner (already handled)
        if (doc.visibility === 'PRIVATE') return false;
        // COHORT/TRACK/MATCH visibility requires checking user's context
        // TODO: Implement full cohort/track/match membership checking
        return false;
      });
      
      res.json(filteredDocs);
    } catch (error) {
      next(error);
    }
  });

  // Get single document
  app.get("/api/documents/:id", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const doc = await storage.getDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check visibility permission
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      const isOwner = doc.uploadedById === user.id;
      const isPublic = doc.visibility === 'PUBLIC';
      
      // Check for explicit share access
      let hasShareAccess = false;
      if (!isAdmin && !isOwner && !isPublic) {
        const accessRecords = await storage.getDocumentAccess(req.params.id);
        hasShareAccess = accessRecords.some(a => a.userId === user.id);
      }
      
      if (!isAdmin && !isOwner && !isPublic && !hasShareAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(doc);
    } catch (error) {
      next(error);
    }
  });

  // Create document (after file upload)
  app.post("/api/documents", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        uploadedById: userId,
      });
      const doc = await storage.createDocument(validatedData);
      res.status(201).json(doc);
    } catch (error) {
      next(error);
    }
  });

  // Update document
  app.patch("/api/documents/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const doc = await storage.getDocument(req.params.id);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Only owner or admin can update
      if (doc.uploadedById !== userId && !(req.user as any).role.includes("ADMIN")) {
        return res.status(403).json({ message: "Not authorized to update this document" });
      }
      
      const updated = await storage.updateDocument(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Delete document
  app.delete("/api/documents/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const doc = await storage.getDocument(req.params.id);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Only owner or admin can delete
      if (doc.uploadedById !== userId && !(req.user as any).role.includes("ADMIN")) {
        return res.status(403).json({ message: "Not authorized to delete this document" });
      }
      
      await storage.deleteDocument(req.params.id);
      res.json({ message: "Document deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Download document (validates access and increments count)
  app.post("/api/documents/:id/download", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const doc = await storage.getDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check document access permission
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      const isOwner = doc.uploadedById === user.id;
      const isPublic = doc.visibility === 'PUBLIC';
      
      // Check for explicit share access
      let hasShareAccess = false;
      if (!isAdmin && !isOwner && !isPublic) {
        const accessRecords = await storage.getDocumentAccess(req.params.id);
        hasShareAccess = accessRecords.some(a => a.userId === user.id);
      }
      
      if (!isAdmin && !isOwner && !isPublic && !hasShareAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.incrementDownloadCount(req.params.id);
      res.json({ fileUrl: doc.fileUrl });
    } catch (error) {
      next(error);
    }
  });

  // Get document versions
  app.get("/api/documents/:id/versions", requireAuth, async (req, res, next) => {
    try {
      const versions = await storage.getDocumentVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      next(error);
    }
  });

  // Create new document version
  app.post("/api/documents/:id/versions", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const doc = await storage.getDocument(req.params.id);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Create version record
      const version = await storage.createDocumentVersion({
        documentId: req.params.id,
        version: (doc.version || 1) + 1,
        fileUrl: req.body.fileUrl,
        fileSize: req.body.fileSize,
        uploadedById: userId,
        changeNotes: req.body.changeNotes,
      });
      
      // Update document with new version
      await storage.updateDocument(req.params.id, {
        fileUrl: req.body.fileUrl,
        fileSize: req.body.fileSize,
        version: version.version,
      });
      
      res.status(201).json(version);
    } catch (error) {
      next(error);
    }
  });

  // ============ FOLDER ROUTES ============

  // Get all folders
  app.get("/api/folders", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const { parentFolderId, cohortId, trackId, matchId, visibility } = req.query;
      const allFolders = await storage.getFolders({
        parentFolderId: parentFolderId === 'null' ? null : parentFolderId as string | undefined,
        cohortId: cohortId as string | undefined,
        trackId: trackId as string | undefined,
        matchId: matchId as string | undefined,
        visibility: visibility as string | undefined,
      });
      
      // Filter folders based on user visibility permissions
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      const filteredFolders = allFolders.filter(folder => {
        if (isAdmin) return true;
        if (folder.createdById === user.id) return true;
        if (folder.visibility === 'PUBLIC') return true;
        if (folder.visibility === 'PRIVATE') return false;
        // TODO: Implement cohort/track/match membership checking
        return false;
      });
      
      res.json(filteredFolders);
    } catch (error) {
      next(error);
    }
  });

  // Get single folder
  app.get("/api/folders/:id", requireAuth, async (req, res, next) => {
    try {
      const folder = await storage.getFolder(req.params.id);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json(folder);
    } catch (error) {
      next(error);
    }
  });

  // Create folder
  app.post("/api/folders", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertFolderSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const folder = await storage.createFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      next(error);
    }
  });

  // Update folder
  app.patch("/api/folders/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const folder = await storage.getFolder(req.params.id);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.ownerId !== userId && !(req.user as any).role.includes("ADMIN")) {
        return res.status(403).json({ message: "Not authorized to update this folder" });
      }
      
      const updated = await storage.updateFolder(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Delete folder
  app.delete("/api/folders/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const folder = await storage.getFolder(req.params.id);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.ownerId !== userId && !(req.user as any).role.includes("ADMIN")) {
        return res.status(403).json({ message: "Not authorized to delete this folder" });
      }
      
      await storage.deleteFolder(req.params.id);
      res.json({ message: "Folder deleted" });
    } catch (error) {
      next(error);
    }
  });

  // ============ DOCUMENT ACCESS/SHARING ROUTES ============

  // Get document access list
  app.get("/api/documents/:id/access", requireAuth, async (req, res, next) => {
    try {
      const accessList = await storage.getDocumentAccess(req.params.id);
      res.json(accessList);
    } catch (error) {
      next(error);
    }
  });

  // Grant document access
  app.post("/api/documents/:id/access", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const doc = await storage.getDocument(req.params.id);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.uploadedById !== userId && !(req.user as any).role.includes("ADMIN")) {
        return res.status(403).json({ message: "Not authorized to share this document" });
      }
      
      const validatedData = insertDocumentAccessSchema.parse({
        documentId: req.params.id,
        userId: req.body.userId,
        accessType: req.body.accessType || "VIEW",
        grantedById: userId,
        expiresAt: req.body.expiresAt,
      });
      
      const access = await storage.grantDocumentAccess(validatedData);
      res.status(201).json(access);
    } catch (error) {
      next(error);
    }
  });

  // Revoke document access
  app.delete("/api/documents/:id/access/:userId", requireAuth, async (req, res, next) => {
    try {
      const currentUserId = (req.user as any).id;
      const doc = await storage.getDocument(req.params.id);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.uploadedById !== currentUserId && !(req.user as any).role.includes("ADMIN")) {
        return res.status(403).json({ message: "Not authorized to manage access for this document" });
      }
      
      await storage.revokeDocumentAccess(req.params.id, req.params.userId);
      res.json({ message: "Access revoked" });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all documents for management
  app.get("/api/admin/documents", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const { category, visibility, search } = req.query;
      const docs = await storage.getDocuments({
        category: category as string | undefined,
        visibility: visibility as string | undefined,
        search: search as string | undefined,
      });
      res.json(docs);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all folders for management
  app.get("/api/admin/folders", requireRole("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
    try {
      const folderList = await storage.getFolders({});
      res.json(folderList);
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
