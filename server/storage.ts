import { 
  users, tracks, cohorts, cohortTracks, cohortMemberships, mentorshipMatches, meetingLogs, goals, tasks, documents, documentAccess,
  applicationQuestions, applicationResponses, matchingConfigurations,
  conversations, conversationParticipants, messages, messageAttachments, messageReads,
  folders, documentVersions, taskComments, taskActivities, milestones, goalProgress,
  notifications, notificationPreferences,
  auditLogs, errorLogs, dataExportRequests, accountDeletionRequests,
  searchHistory, savedSearches, surveys, surveyResponses, onboardingProgress, certificates,
  mentorProfiles, professionalProfiles, mentorshipRoles, menteeProfiles, mentorProfilesExtended,
  type User, type InsertUser, type Track, type InsertTrack, type Cohort, type InsertCohort,
  type CohortTrack, type InsertCohortTrack, type CohortMembership, type InsertCohortMembership,
  type MentorshipMatch, type InsertMentorshipMatch, type MeetingLog, type InsertMeetingLog,
  type Goal, type InsertGoal, type Task, type InsertTask, type Document, type InsertDocument,
  type ApplicationQuestion, type InsertApplicationQuestion, type ApplicationResponse, type InsertApplicationResponse,
  type MatchingConfiguration, type InsertMatchingConfiguration,
  type Conversation, type InsertConversation, type ConversationParticipant, type InsertConversationParticipant,
  type Message, type InsertMessage, type MessageAttachment, type InsertMessageAttachment, type MessageRead, type InsertMessageRead,
  type Folder, type InsertFolder, type DocumentVersion, type InsertDocumentVersion, type DocumentAccess, type InsertDocumentAccess,
  type TaskComment, type InsertTaskComment, type TaskActivity, type InsertTaskActivity,
  type Milestone, type InsertMilestone, type GoalProgress, type InsertGoalProgress,
  type Notification, type InsertNotification, type NotificationPreference, type InsertNotificationPreference,
  type AuditLog, type InsertAuditLog, type ErrorLog, type InsertErrorLog,
  type DataExportRequest, type InsertDataExportRequest, type AccountDeletionRequest, type InsertAccountDeletionRequest,
  type SearchHistory, type InsertSearchHistory, type SavedSearch, type InsertSavedSearch,
  type Survey, type InsertSurvey, type SurveyResponse, type InsertSurveyResponse,
  type OnboardingProgress, type InsertOnboardingProgress,
  type Certificate, type InsertCertificate,
  type MentorProfile, type InsertMentorProfile,
  type ProfessionalProfile, type InsertProfessionalProfile,
  type MentorshipRole, type InsertMentorshipRole,
  type MenteeProfile, type InsertMenteeProfile,
  type MentorProfileExtended, type InsertMentorProfileExtended
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, isNull, desc, count, sql, like, or, asc, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  emailExists(email: string): Promise<boolean>;
  deleteUser(id: string): Promise<boolean>;
  createUser(user: Partial<InsertUser> & { email: string; password: string; firstName: string; lastName: string; role: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  incrementFailedLoginAttempts(id: string): Promise<void>;
  resetFailedLoginAttempts(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
  getAllUsers(filters?: { role?: string; search?: string; isActive?: boolean }): Promise<User[]>;
  getUsersCount(filters?: { role?: string; isActive?: boolean }): Promise<number>;
  getAllTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: string, data: Partial<Track>): Promise<Track | undefined>;
  getAllCohorts(): Promise<Cohort[]>;
  getCohort(id: string): Promise<Cohort | undefined>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  updateCohort(id: string, data: Partial<Cohort>): Promise<Cohort | undefined>;
  getCohortMemberships(cohortId: string): Promise<CohortMembership[]>;
  getMembershipsByStatus(status: string): Promise<CohortMembership[]>;
  updateMembership(id: string, data: Partial<CohortMembership>): Promise<CohortMembership | undefined>;
  getActiveMatches(): Promise<MentorshipMatch[]>;
  getMatchesByCohort(cohortId: string): Promise<MentorshipMatch[]>;
  getTasksByAssignee(userId: string): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
  getMeetingsThisWeek(): Promise<MeetingLog[]>;
  getMeetingsForUser(userId: string): Promise<MeetingLog[]>;
  getMeeting(id: string): Promise<MeetingLog | undefined>;
  createMeeting(meeting: InsertMeetingLog): Promise<MeetingLog>;
  updateMeeting(id: string, data: Partial<MeetingLog>): Promise<MeetingLog | undefined>;
  deleteMeeting(id: string): Promise<void>;
  getAdminDashboardStats(): Promise<{ totalMentors: number; totalMentees: number; activeMatches: number; pendingApplications: number; upcomingMeetings: number; overdueTasks: number }>;
  
  // Application Questions
  getApplicationQuestions(cohortId?: string, forRole?: string): Promise<ApplicationQuestion[]>;
  getDefaultQuestions(): Promise<ApplicationQuestion[]>;
  createApplicationQuestion(question: InsertApplicationQuestion): Promise<ApplicationQuestion>;
  updateApplicationQuestion(id: string, data: Partial<ApplicationQuestion>): Promise<ApplicationQuestion | undefined>;
  deleteApplicationQuestion(id: string): Promise<void>;
  
  // Application Responses
  getApplicationResponses(membershipId: string): Promise<ApplicationResponse[]>;
  createApplicationResponse(response: InsertApplicationResponse): Promise<ApplicationResponse>;
  updateApplicationResponse(id: string, data: Partial<ApplicationResponse>): Promise<ApplicationResponse | undefined>;
  
  // Matching Configurations
  getMatchingConfiguration(cohortId: string): Promise<MatchingConfiguration | undefined>;
  createMatchingConfiguration(config: InsertMatchingConfiguration): Promise<MatchingConfiguration>;
  updateMatchingConfiguration(cohortId: string, data: Partial<MatchingConfiguration>): Promise<MatchingConfiguration | undefined>;
  
  // Memberships - additional methods
  createMembership(membership: InsertCohortMembership): Promise<CohortMembership>;
  getMembership(id: string): Promise<CohortMembership | undefined>;
  getMembershipByUserAndCohort(userId: string, cohortId: string): Promise<CohortMembership | undefined>;
  getCohortMembershipsWithUsers(cohortId: string): Promise<(CohortMembership & { user: User })[]>;
  getUnmatchedMemberships(cohortId: string, role: string): Promise<(CohortMembership & { user: User })[]>;
  
  // Matches
  createMatch(match: InsertMentorshipMatch): Promise<MentorshipMatch>;
  updateMatch(id: string, data: Partial<MentorshipMatch>): Promise<MentorshipMatch | undefined>;
  getMatchesForUser(userId: string): Promise<(MentorshipMatch & { mentor?: Partial<User>; mentee?: Partial<User> })[]>;
  getMatch(id: string): Promise<MentorshipMatch | undefined>;
  getAllMatches(): Promise<(MentorshipMatch & { mentor: User; mentee: User; cohort?: { id: string; name: string } })[]>;
  deleteMatch(id: string): Promise<boolean>;
  
  // Simple matching (without cohort requirement)
  getAvailableMentors(): Promise<User[]>;
  getAvailableMentees(): Promise<User[]>;
  createSimpleMatch(mentorId: string, menteeId: string, matchedById: string, notes?: string): Promise<MentorshipMatch>;
  checkExistingMatch(mentorId: string, menteeId: string): Promise<MentorshipMatch | undefined>;
  
  // Messaging
  getConversation(id: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<(Conversation & { participants: (ConversationParticipant & { user: User })[], unreadCount: number, lastMessage?: Message })[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined>;
  getOrCreateDirectConversation(userId1: string, userId2: string): Promise<Conversation>;
  
  getConversationParticipants(conversationId: string): Promise<(ConversationParticipant & { user: User })[]>;
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  updateConversationParticipant(id: string, data: Partial<ConversationParticipant>): Promise<ConversationParticipant | undefined>;
  removeConversationParticipant(conversationId: string, userId: string): Promise<void>;
  
  getMessages(conversationId: string, limit?: number, before?: string): Promise<(Message & { sender: User, attachments: MessageAttachment[] })[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, data: Partial<Message>): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<void>;
  
  createMessageAttachment(attachment: InsertMessageAttachment): Promise<MessageAttachment>;
  getMessageAttachments(messageId: string): Promise<MessageAttachment[]>;
  
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
  
  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(filters?: { folderId?: string | null; cohortId?: string; trackId?: string; matchId?: string; uploadedById?: string; visibility?: string; category?: string; isTemplate?: boolean; search?: string }): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  
  // Folders
  getFolder(id: string): Promise<Folder | undefined>;
  getFolders(filters?: { parentFolderId?: string | null; ownerId?: string; cohortId?: string; trackId?: string; matchId?: string; visibility?: string }): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, data: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<void>;
  
  // Document Versions
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  
  // Document Access
  getDocumentAccess(documentId: string): Promise<(DocumentAccess & { user: User })[]>;
  getDocumentAccessByUser(userId: string): Promise<DocumentAccess[]>;
  getUserDocumentAccess(documentId: string, userId: string): Promise<DocumentAccess | undefined>;
  getDocumentByFileUrl(fileUrl: string): Promise<Document | undefined>;
  grantDocumentAccess(access: InsertDocumentAccess): Promise<DocumentAccess>;
  revokeDocumentAccess(documentId: string, userId: string): Promise<void>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(filters?: { assignedToId?: string; createdById?: string; matchId?: string; cohortId?: string; trackId?: string; goalId?: string; status?: string; priority?: string; category?: string; parentTaskId?: string | null; overdue?: boolean; search?: string }): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskActivities(taskId: string): Promise<(TaskActivity & { user: User })[]>;
  createTaskActivity(activity: InsertTaskActivity): Promise<TaskActivity>;
  getSubtasks(parentTaskId: string): Promise<Task[]>;
  
  // Goals
  getGoal(id: string): Promise<Goal | undefined>;
  getGoals(filters?: { matchId?: string; ownerId?: string; createdById?: string; trackId?: string; status?: string; category?: string; mentorApproved?: boolean; search?: string }): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, data: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<void>;
  getMilestones(goalId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<void>;
  getGoalProgressHistory(goalId: string): Promise<(GoalProgress & { user: User })[]>;
  createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress>;
  
  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotifications(userId: string, filters?: { isRead?: boolean; isArchived?: boolean; type?: string; limit?: number; offset?: number }): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  createManyNotifications(notifications: InsertNotification[]): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  archiveNotification(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<void>;
  
  // Notification Preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreference[]>;
  getNotificationPreference(userId: string, notificationType: string): Promise<NotificationPreference | undefined>;
  upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference>;
  
  // Analytics
  getAnalyticsDashboard(): Promise<{
    userMetrics: { totalUsers: number; totalMentors: number; totalMentees: number; totalAdmins: number; activeUsers: number; newUsersThisMonth: number };
    cohortMetrics: { totalCohorts: number; activeCohorts: number; totalApplications: number; pendingApplications: number; approvedApplications: number };
    matchMetrics: { totalMatches: number; activeMatches: number; completedMatches: number; averageMatchScore: number };
    meetingMetrics: { totalMeetings: number; meetingsThisMonth: number; completedMeetings: number; averageDuration: number };
    taskMetrics: { totalTasks: number; completedTasks: number; inProgressTasks: number; overdueTasks: number; completionRate: number };
    goalMetrics: { totalGoals: number; completedGoals: number; inProgressGoals: number; averageProgress: number; completionRate: number };
    engagementMetrics: { totalMessages: number; messagesThisMonth: number; totalDocuments: number; totalConversations: number };
  }>;
  getAnalyticsTrends(days: number): Promise<{
    userGrowth: { date: string; count: number }[];
    matchActivity: { date: string; count: number }[];
    taskCompletion: { date: string; completed: number; created: number }[];
    goalProgress: { date: string; completed: number; created: number }[];
    meetingActivity: { date: string; count: number }[];
  }>;
  getTrackAnalytics(): Promise<{ trackId: string; trackName: string; memberCount: number; matchCount: number; goalCount: number; taskCount: number }[]>;
  getCohortAnalytics(cohortId?: string): Promise<{ cohortId: string; cohortName: string; memberCount: number; mentorCount: number; menteeCount: number; matchCount: number; completionRate: number }[]>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { 
    actorId?: string; 
    action?: string; 
    resourceType?: string; 
    resourceId?: string; 
    success?: boolean; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
    limit?: number; 
    offset?: number;
  }): Promise<AuditLog[]>;
  getAuditLogsCount(filters?: { 
    actorId?: string; 
    action?: string; 
    resourceType?: string; 
    resourceId?: string; 
    success?: boolean; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
  }): Promise<number>;
  
  // Error Logs
  createErrorLog(log: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(filters?: { 
    resolved?: boolean; 
    errorType?: string; 
    userId?: string;
    limit?: number; 
    offset?: number;
  }): Promise<ErrorLog[]>;
  getErrorLogsCount(filters?: { resolved?: boolean; errorType?: string; userId?: string }): Promise<number>;
  resolveErrorLog(id: string, resolvedBy: string): Promise<ErrorLog | undefined>;
  
  // Data Export Requests (GDPR)
  createDataExportRequest(request: InsertDataExportRequest): Promise<DataExportRequest>;
  getDataExportRequest(id: string): Promise<DataExportRequest | undefined>;
  getDataExportRequestsByUser(userId: string): Promise<DataExportRequest[]>;
  updateDataExportRequest(id: string, data: Partial<DataExportRequest>): Promise<DataExportRequest | undefined>;
  
  // Account Deletion Requests (GDPR)
  createAccountDeletionRequest(request: InsertAccountDeletionRequest): Promise<AccountDeletionRequest>;
  getAccountDeletionRequest(id: string): Promise<AccountDeletionRequest | undefined>;
  getAccountDeletionRequestsByUser(userId: string): Promise<AccountDeletionRequest[]>;
  getPendingAccountDeletionRequests(): Promise<(AccountDeletionRequest & { user: User })[]>;
  updateAccountDeletionRequest(id: string, data: Partial<AccountDeletionRequest>): Promise<AccountDeletionRequest | undefined>;
  
  // Search
  createSearchHistory(history: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistory(userId: string, limit?: number): Promise<SearchHistory[]>;
  clearSearchHistory(userId: string): Promise<void>;
  createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch>;
  getSavedSearches(userId: string): Promise<SavedSearch[]>;
  deleteSavedSearch(id: string, userId: string): Promise<void>;
  
  // Surveys
  getSurveys(filters?: { status?: string; cohortId?: string }): Promise<Survey[]>;
  getSurvey(id: string): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, data: Partial<Survey>): Promise<Survey | undefined>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponses(surveyId: string): Promise<SurveyResponse[]>;
  
  // Onboarding
  getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  updateOnboardingProgress(userId: string, data: Partial<OnboardingProgress>): Promise<OnboardingProgress | undefined>;
  
  // Certificates
  getCertificates(filters?: { userId?: string; cohortId?: string; status?: string }): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: string, data: Partial<Certificate>): Promise<Certificate | undefined>;
  
  // Mentor Profiles
  getMentorProfile(userId: string): Promise<MentorProfile | undefined>;
  getMentorProfileById(id: string): Promise<MentorProfile | undefined>;
  getMentorProfiles(filters?: { 
    status?: string; 
    region?: string; 
    track?: string; 
    language?: string;
    cohortYear?: number;
    hasCapacity?: boolean;
    search?: string;
  }): Promise<(MentorProfile & { user: User })[]>;
  createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile>;
  updateMentorProfile(userId: string, data: Partial<MentorProfile>): Promise<MentorProfile | undefined>;
  deleteMentorProfile(userId: string): Promise<void>;
  updateMentorMenteeCount(userId: string, count: number): Promise<void>;
  getMentorsWithCapacity(cohortYear?: number): Promise<(MentorProfile & { user: User })[]>;
  
  // Professional Profiles
  getProfessionalProfile(userId: string): Promise<ProfessionalProfile | undefined>;
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  updateProfessionalProfile(userId: string, data: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined>;
  deleteProfessionalProfile(userId: string): Promise<void>;
  
  // Mentorship Roles
  getMentorshipRole(userId: string): Promise<MentorshipRole | undefined>;
  createMentorshipRole(role: InsertMentorshipRole): Promise<MentorshipRole>;
  updateMentorshipRole(userId: string, data: Partial<MentorshipRole>): Promise<MentorshipRole | undefined>;
  deleteMentorshipRole(userId: string): Promise<void>;
  
  // Mentee Profiles
  getMenteeProfile(userId: string): Promise<MenteeProfile | undefined>;
  getMenteeProfileById(id: string): Promise<MenteeProfile | undefined>;
  getMenteeProfiles(filters?: { 
    careerStage?: string;
    search?: string;
  }): Promise<(MenteeProfile & { user: User })[]>;
  createMenteeProfile(profile: InsertMenteeProfile): Promise<MenteeProfile>;
  updateMenteeProfile(userId: string, data: Partial<MenteeProfile>): Promise<MenteeProfile | undefined>;
  deleteMenteeProfile(userId: string): Promise<void>;
  
  // Extended Mentor Profiles
  getMentorProfileExtended(userId: string): Promise<MentorProfileExtended | undefined>;
  getMentorProfileExtendedById(id: string): Promise<MentorProfileExtended | undefined>;
  getMentorProfilesExtended(filters?: { 
    search?: string;
    hasCapacity?: boolean;
  }): Promise<(MentorProfileExtended & { user: User })[]>;
  createMentorProfileExtended(profile: InsertMentorProfileExtended): Promise<MentorProfileExtended>;
  updateMentorProfileExtended(userId: string, data: Partial<MentorProfileExtended>): Promise<MentorProfileExtended | undefined>;
  deleteMentorProfileExtended(userId: string): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session',
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.id, id), isNull(users.deletedAt))
    );
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt))
    );
    return user || undefined;
  }

  async emailExists(email: string): Promise<boolean> {
    const [user] = await db.select({ id: users.id }).from(users).where(
      eq(users.email, email.toLowerCase())
    );
    return !!user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return result.length > 0;
  }

  async createUser(insertUser: Partial<InsertUser> & { email: string; password: string; firstName: string; lastName: string; role: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        email: insertUser.email.toLowerCase(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.emailVerificationToken, token),
        gt(users.emailVerificationExpires, new Date()),
        isNull(users.deletedAt)
      )
    );
    return user || undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpires, new Date()),
        isNull(users.deletedAt)
      )
    );
    return user || undefined;
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      await db
        .update(users)
        .set({ failedLoginAttempts: (user.failedLoginAttempts || 0) + 1 })
        .where(eq(users.id, id));
    }
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(users.id, id));
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await db
      .update(users)
      .set({ lockedUntil: until })
      .where(eq(users.id, id));
  }

  async getAllUsers(filters?: { role?: string; search?: string; isActive?: boolean }): Promise<User[]> {
    let query = db.select().from(users).where(isNull(users.deletedAt));
    
    const conditions = [isNull(users.deletedAt)];
    
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.email, searchTerm)
        )!
      );
    }

    const result = await db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt));
    return result;
  }

  async getUsersCount(filters?: { role?: string; isActive?: boolean }): Promise<number> {
    const conditions = [isNull(users.deletedAt)];
    
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    const [result] = await db.select({ count: count() }).from(users).where(and(...conditions));
    return result?.count || 0;
  }

  async getAllTracks(): Promise<Track[]> {
    return db.select().from(tracks).orderBy(asc(tracks.sortOrder));
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const [result] = await db.insert(tracks).values(track).returning();
    return result;
  }

  async updateTrack(id: string, data: Partial<Track>): Promise<Track | undefined> {
    const [result] = await db.update(tracks).set({ ...data, updatedAt: new Date() }).where(eq(tracks.id, id)).returning();
    return result || undefined;
  }

  async getAllCohorts(): Promise<Cohort[]> {
    return db.select().from(cohorts).orderBy(desc(cohorts.createdAt));
  }

  async getCohort(id: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id));
    return cohort || undefined;
  }

  async createCohort(cohort: InsertCohort): Promise<Cohort> {
    const [result] = await db.insert(cohorts).values(cohort).returning();
    return result;
  }

  async updateCohort(id: string, data: Partial<Cohort>): Promise<Cohort | undefined> {
    const cleanData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const [result] = await db.update(cohorts).set(cleanData).where(eq(cohorts.id, id)).returning();
    return result || undefined;
  }

  async getCohortMemberships(cohortId: string): Promise<CohortMembership[]> {
    return db.select().from(cohortMemberships).where(eq(cohortMemberships.cohortId, cohortId));
  }

  async getMembershipsByStatus(status: string): Promise<CohortMembership[]> {
    return db.select().from(cohortMemberships).where(eq(cohortMemberships.applicationStatus, status as any));
  }

  async updateMembership(id: string, data: Partial<CohortMembership>): Promise<CohortMembership | undefined> {
    const cleanData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const [result] = await db.update(cohortMemberships).set(cleanData).where(eq(cohortMemberships.id, id)).returning();
    return result || undefined;
  }

  async getActiveMatches(): Promise<MentorshipMatch[]> {
    return db.select().from(mentorshipMatches).where(eq(mentorshipMatches.status, 'ACTIVE'));
  }

  async getMatchesByCohort(cohortId: string): Promise<MentorshipMatch[]> {
    return db.select().from(mentorshipMatches).where(eq(mentorshipMatches.cohortId, cohortId));
  }

  async getTasksByAssignee(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.assignedToId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getOverdueTasks(): Promise<Task[]> {
    return db.select().from(tasks).where(
      and(
        sql`${tasks.dueDate} < NOW()`,
        inArray(tasks.status, ['TODO', 'IN_PROGRESS', 'BLOCKED'])
      )
    );
  }

  async getMeetingsThisWeek(): Promise<MeetingLog[]> {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);
    
    return db.select().from(meetingLogs).where(
      and(
        sql`${meetingLogs.scheduledDate} >= NOW()`,
        sql`${meetingLogs.scheduledDate} <= ${endOfWeek}`
      )
    );
  }

  async getMeetingsForUser(userId: string): Promise<MeetingLog[]> {
    // Get matches where user is mentor or mentee, then get meetings for those matches
    const mentorMemberships = alias(cohortMemberships, 'mentor_memberships');
    const menteeMemberships = alias(cohortMemberships, 'mentee_memberships');

    const userMatches = await db.select({
      matchId: mentorshipMatches.id,
    })
      .from(mentorshipMatches)
      .innerJoin(mentorMemberships, eq(mentorshipMatches.mentorMembershipId, mentorMemberships.id))
      .innerJoin(menteeMemberships, eq(mentorshipMatches.menteeMembershipId, menteeMemberships.id))
      .where(
        or(
          eq(mentorMemberships.userId, userId),
          eq(menteeMemberships.userId, userId)
        )
      );

    const matchIds = userMatches.map(m => m.matchId);
    if (matchIds.length === 0) return [];

    return db.select().from(meetingLogs)
      .where(inArray(meetingLogs.matchId, matchIds))
      .orderBy(desc(meetingLogs.scheduledDate));
  }

  async getMeeting(id: string): Promise<MeetingLog | undefined> {
    const [meeting] = await db.select().from(meetingLogs).where(eq(meetingLogs.id, id));
    return meeting || undefined;
  }

  async createMeeting(meeting: InsertMeetingLog): Promise<MeetingLog> {
    const [result] = await db.insert(meetingLogs).values(meeting).returning();
    return result;
  }

  async updateMeeting(id: string, data: Partial<MeetingLog>): Promise<MeetingLog | undefined> {
    const [meeting] = await db.update(meetingLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(meetingLogs.id, id))
      .returning();
    return meeting || undefined;
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetingLogs).where(eq(meetingLogs.id, id));
  }

  async getAdminDashboardStats(): Promise<{ totalMentors: number; totalMentees: number; activeMatches: number; pendingApplications: number; upcomingMeetings: number; overdueTasks: number }> {
    const [mentorCount] = await db.select({ count: count() }).from(users).where(
      and(eq(users.role, 'MENTOR'), eq(users.isActive, true), isNull(users.deletedAt))
    );
    const [menteeCount] = await db.select({ count: count() }).from(users).where(
      and(eq(users.role, 'MENTEE'), eq(users.isActive, true), isNull(users.deletedAt))
    );
    const [matchCount] = await db.select({ count: count() }).from(mentorshipMatches).where(eq(mentorshipMatches.status, 'ACTIVE'));
    const [appCount] = await db.select({ count: count() }).from(cohortMemberships).where(eq(cohortMemberships.applicationStatus, 'PENDING'));
    
    const upcomingMeetings = await this.getMeetingsThisWeek();
    const overdueTasks = await this.getOverdueTasks();

    return {
      totalMentors: mentorCount?.count || 0,
      totalMentees: menteeCount?.count || 0,
      activeMatches: matchCount?.count || 0,
      pendingApplications: appCount?.count || 0,
      upcomingMeetings: upcomingMeetings.length,
      overdueTasks: overdueTasks.length,
    };
  }

  // Application Questions
  async getApplicationQuestions(cohortId?: string, forRole?: string): Promise<ApplicationQuestion[]> {
    let query = db.select().from(applicationQuestions);
    
    if (cohortId) {
      query = query.where(or(
        eq(applicationQuestions.cohortId, cohortId),
        eq(applicationQuestions.isDefault, true)
      )) as typeof query;
    }
    
    const results = await query.orderBy(asc(applicationQuestions.sortOrder));
    
    if (forRole && forRole !== 'BOTH') {
      return results.filter(q => q.forRole === forRole || q.forRole === 'BOTH');
    }
    
    return results;
  }

  async getDefaultQuestions(): Promise<ApplicationQuestion[]> {
    return db.select().from(applicationQuestions)
      .where(eq(applicationQuestions.isDefault, true))
      .orderBy(asc(applicationQuestions.sortOrder));
  }

  async createApplicationQuestion(question: InsertApplicationQuestion): Promise<ApplicationQuestion> {
    const [result] = await db.insert(applicationQuestions).values(question).returning();
    return result;
  }

  async updateApplicationQuestion(id: string, data: Partial<ApplicationQuestion>): Promise<ApplicationQuestion | undefined> {
    const cleanData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const [result] = await db.update(applicationQuestions).set(cleanData).where(eq(applicationQuestions.id, id)).returning();
    return result || undefined;
  }

  async deleteApplicationQuestion(id: string): Promise<void> {
    await db.delete(applicationQuestions).where(eq(applicationQuestions.id, id));
  }

  // Application Responses
  async getApplicationResponses(membershipId: string): Promise<ApplicationResponse[]> {
    return db.select().from(applicationResponses).where(eq(applicationResponses.membershipId, membershipId));
  }

  async createApplicationResponse(response: InsertApplicationResponse): Promise<ApplicationResponse> {
    const [result] = await db.insert(applicationResponses).values(response).returning();
    return result;
  }

  async updateApplicationResponse(id: string, data: Partial<ApplicationResponse>): Promise<ApplicationResponse | undefined> {
    const cleanData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const [result] = await db.update(applicationResponses).set(cleanData).where(eq(applicationResponses.id, id)).returning();
    return result || undefined;
  }

  // Matching Configurations
  async getMatchingConfiguration(cohortId: string): Promise<MatchingConfiguration | undefined> {
    const [result] = await db.select().from(matchingConfigurations).where(eq(matchingConfigurations.cohortId, cohortId));
    return result || undefined;
  }

  async createMatchingConfiguration(config: InsertMatchingConfiguration): Promise<MatchingConfiguration> {
    const [result] = await db.insert(matchingConfigurations).values(config).returning();
    return result;
  }

  async updateMatchingConfiguration(cohortId: string, data: Partial<MatchingConfiguration>): Promise<MatchingConfiguration | undefined> {
    const cleanData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const [result] = await db.update(matchingConfigurations).set(cleanData).where(eq(matchingConfigurations.cohortId, cohortId)).returning();
    return result || undefined;
  }

  // Memberships - additional methods
  async createMembership(membership: InsertCohortMembership): Promise<CohortMembership> {
    const [result] = await db.insert(cohortMemberships).values(membership).returning();
    return result;
  }

  async getMembership(id: string): Promise<CohortMembership | undefined> {
    const [result] = await db.select().from(cohortMemberships).where(eq(cohortMemberships.id, id));
    return result || undefined;
  }

  async getMembershipByUserAndCohort(userId: string, cohortId: string): Promise<CohortMembership | undefined> {
    const [result] = await db.select().from(cohortMemberships).where(
      and(
        eq(cohortMemberships.userId, userId),
        eq(cohortMemberships.cohortId, cohortId)
      )
    );
    return result || undefined;
  }

  async getCohortMembershipsWithUsers(cohortId: string): Promise<(CohortMembership & { user: User })[]> {
    const results = await db.select({
      membership: cohortMemberships,
      user: users
    })
    .from(cohortMemberships)
    .innerJoin(users, eq(cohortMemberships.userId, users.id))
    .where(eq(cohortMemberships.cohortId, cohortId));
    
    return results.map(r => ({ ...r.membership, user: r.user }));
  }

  async getUnmatchedMemberships(cohortId: string, role: string): Promise<(CohortMembership & { user: User })[]> {
    const results = await db.select({
      membership: cohortMemberships,
      user: users
    })
    .from(cohortMemberships)
    .innerJoin(users, eq(cohortMemberships.userId, users.id))
    .where(
      and(
        eq(cohortMemberships.cohortId, cohortId),
        eq(cohortMemberships.role, role as any),
        eq(cohortMemberships.applicationStatus, 'APPROVED'),
        eq(cohortMemberships.matchStatus, 'UNMATCHED')
      )
    );
    
    return results.map(r => ({ ...r.membership, user: r.user }));
  }

  // Matches
  async createMatch(match: InsertMentorshipMatch): Promise<MentorshipMatch> {
    const [result] = await db.insert(mentorshipMatches).values(match).returning();
    return result;
  }

  async updateMatch(id: string, data: Partial<MentorshipMatch>): Promise<MentorshipMatch | undefined> {
    const cleanData: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const [result] = await db.update(mentorshipMatches).set(cleanData).where(eq(mentorshipMatches.id, id)).returning();
    return result || undefined;
  }

  async getMatchesForUser(userId: string): Promise<(MentorshipMatch & { mentor?: Partial<User>; mentee?: Partial<User> })[]> {
    const mentorUsers = alias(users, 'mentor_users');
    const menteeUsers = alias(users, 'mentee_users');
    const mentorMemberships = alias(cohortMemberships, 'mentor_memberships');
    const menteeMemberships = alias(cohortMemberships, 'mentee_memberships');

    // Select only needed columns - no sensitive data
    const results = await db.select({
      match: mentorshipMatches,
      mentor: {
        id: mentorUsers.id,
        firstName: mentorUsers.firstName,
        lastName: mentorUsers.lastName,
        email: mentorUsers.email,
        role: mentorUsers.role,
        profileImage: mentorUsers.profileImage,
        bio: mentorUsers.bio,
        jobTitle: mentorUsers.jobTitle,
        organizationName: mentorUsers.organizationName,
        linkedInUrl: mentorUsers.linkedInUrl,
      },
      mentee: {
        id: menteeUsers.id,
        firstName: menteeUsers.firstName,
        lastName: menteeUsers.lastName,
        email: menteeUsers.email,
        role: menteeUsers.role,
        profileImage: menteeUsers.profileImage,
        bio: menteeUsers.bio,
        jobTitle: menteeUsers.jobTitle,
        organizationName: menteeUsers.organizationName,
        linkedInUrl: menteeUsers.linkedInUrl,
      },
    })
      .from(mentorshipMatches)
      .innerJoin(mentorMemberships, eq(mentorshipMatches.mentorMembershipId, mentorMemberships.id))
      .innerJoin(menteeMemberships, eq(mentorshipMatches.menteeMembershipId, menteeMemberships.id))
      .innerJoin(mentorUsers, eq(mentorMemberships.userId, mentorUsers.id))
      .innerJoin(menteeUsers, eq(menteeMemberships.userId, menteeUsers.id))
      .where(
        or(
          eq(mentorMemberships.userId, userId),
          eq(menteeMemberships.userId, userId)
        )
      )
      .orderBy(desc(mentorshipMatches.createdAt));

    return results.map(r => ({
      ...r.match,
      mentor: r.mentor,
      mentee: r.mentee,
    }));
  }

  // Additional Match methods
  async getMatch(id: string): Promise<MentorshipMatch | undefined> {
    const [result] = await db.select().from(mentorshipMatches).where(eq(mentorshipMatches.id, id));
    return result || undefined;
  }

  async getAllMatches(): Promise<(MentorshipMatch & { mentor: User; mentee: User; cohort?: { id: string; name: string } })[]> {
    const mentorUsers = alias(users, 'mentor_users');
    const menteeUsers = alias(users, 'mentee_users');
    const mentorMemberships = alias(cohortMemberships, 'mentor_memberships');
    const menteeMemberships = alias(cohortMemberships, 'mentee_memberships');

    const results = await db.select({
      match: mentorshipMatches,
      mentor: mentorUsers,
      mentee: menteeUsers,
      cohort: {
        id: cohorts.id,
        name: cohorts.name,
      },
    })
      .from(mentorshipMatches)
      .leftJoin(mentorMemberships, eq(mentorshipMatches.mentorMembershipId, mentorMemberships.id))
      .leftJoin(menteeMemberships, eq(mentorshipMatches.menteeMembershipId, menteeMemberships.id))
      .leftJoin(mentorUsers, eq(mentorMemberships.userId, mentorUsers.id))
      .leftJoin(menteeUsers, eq(menteeMemberships.userId, menteeUsers.id))
      .leftJoin(cohorts, eq(mentorshipMatches.cohortId, cohorts.id))
      .orderBy(desc(mentorshipMatches.createdAt));

    return results.map(r => ({
      ...r.match,
      mentor: r.mentor as User,
      mentee: r.mentee as User,
      cohort: r.cohort || undefined,
    }));
  }

  async deleteMatch(id: string): Promise<boolean> {
    const result = await db.delete(mentorshipMatches).where(eq(mentorshipMatches.id, id)).returning({ id: mentorshipMatches.id });
    return result.length > 0;
  }

  async getAvailableMentors(): Promise<User[]> {
    return db.select()
      .from(users)
      .where(
        and(
          eq(users.role, 'MENTOR'),
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      )
      .orderBy(asc(users.firstName), asc(users.lastName));
  }

  async getAvailableMentees(): Promise<User[]> {
    return db.select()
      .from(users)
      .where(
        and(
          eq(users.role, 'MENTEE'),
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      )
      .orderBy(asc(users.firstName), asc(users.lastName));
  }

  async createSimpleMatch(mentorId: string, menteeId: string, matchedById: string, notes?: string): Promise<MentorshipMatch> {
    // Create dummy memberships for the match (or find existing)
    let mentorMembership = await db.select().from(cohortMemberships).where(
      and(
        eq(cohortMemberships.userId, mentorId),
        eq(cohortMemberships.role, 'MENTOR')
      )
    ).then(results => results[0]);

    let menteeMembership = await db.select().from(cohortMemberships).where(
      and(
        eq(cohortMemberships.userId, menteeId),
        eq(cohortMemberships.role, 'MENTEE')
      )
    ).then(results => results[0]);

    // If no membership exists, create a default one
    // First get or create a default cohort for ad-hoc matches
    let defaultCohort = await db.select().from(cohorts).where(
      eq(cohorts.name, 'General Mentorship')
    ).then(results => results[0]);

    if (!defaultCohort) {
      const [newCohort] = await db.insert(cohorts).values({
        name: 'General Mentorship',
        description: 'Default cohort for ad-hoc mentor-mentee matches',
        status: 'ACTIVE',
      }).returning();
      defaultCohort = newCohort;
    }

    if (!mentorMembership) {
      const [newMembership] = await db.insert(cohortMemberships).values({
        cohortId: defaultCohort.id,
        userId: mentorId,
        role: 'MENTOR',
        applicationStatus: 'APPROVED',
        matchStatus: 'UNMATCHED',
        joinedAt: new Date(),
      }).returning();
      mentorMembership = newMembership;
    }

    if (!menteeMembership) {
      const [newMembership] = await db.insert(cohortMemberships).values({
        cohortId: defaultCohort.id,
        userId: menteeId,
        role: 'MENTEE',
        applicationStatus: 'APPROVED',
        matchStatus: 'UNMATCHED',
        joinedAt: new Date(),
      }).returning();
      menteeMembership = newMembership;
    }

    // Create the match
    const [match] = await db.insert(mentorshipMatches).values({
      cohortId: defaultCohort.id,
      mentorMembershipId: mentorMembership.id,
      menteeMembershipId: menteeMembership.id,
      status: 'ACTIVE',
      matchedAt: new Date(),
      matchedById,
      startDate: new Date(),
    }).returning();

    // Update membership match statuses
    await db.update(cohortMemberships).set({ matchStatus: 'MATCHED' }).where(eq(cohortMemberships.id, mentorMembership.id));
    await db.update(cohortMemberships).set({ matchStatus: 'MATCHED' }).where(eq(cohortMemberships.id, menteeMembership.id));

    return match;
  }

  async checkExistingMatch(mentorId: string, menteeId: string): Promise<MentorshipMatch | undefined> {
    const mentorMemberships = alias(cohortMemberships, 'mentor_memberships');
    const menteeMemberships = alias(cohortMemberships, 'mentee_memberships');

    const [result] = await db.select({
      match: mentorshipMatches,
    })
      .from(mentorshipMatches)
      .innerJoin(mentorMemberships, eq(mentorshipMatches.mentorMembershipId, mentorMemberships.id))
      .innerJoin(menteeMemberships, eq(mentorshipMatches.menteeMembershipId, menteeMemberships.id))
      .where(
        and(
          eq(mentorMemberships.userId, mentorId),
          eq(menteeMemberships.userId, menteeId),
          or(
            eq(mentorshipMatches.status, 'ACTIVE'),
            eq(mentorshipMatches.status, 'PROPOSED'),
            eq(mentorshipMatches.status, 'PAUSED')
          )
        )
      );

    return result?.match || undefined;
  }

  // Messaging Implementation
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [result] = await db.select().from(conversations).where(eq(conversations.id, id));
    return result || undefined;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { participants: (ConversationParticipant & { user: User })[], unreadCount: number, lastMessage?: Message })[]> {
    const participantRecords = await db.select()
      .from(conversationParticipants)
      .where(and(eq(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt)));
    
    const conversationIds = participantRecords.map(p => p.conversationId);
    if (conversationIds.length === 0) return [];

    const convs = await db.select()
      .from(conversations)
      .where(and(inArray(conversations.id, conversationIds), eq(conversations.isArchived, false)))
      .orderBy(desc(conversations.lastMessageAt));

    const results: (Conversation & { participants: (ConversationParticipant & { user: User })[], unreadCount: number, lastMessage?: Message })[] = [];

    for (const conv of convs) {
      const participants = await this.getConversationParticipants(conv.id);
      const unreadCount = await this.getUnreadCount(conv.id, userId);
      const [lastMessage] = await db.select()
        .from(messages)
        .where(and(eq(messages.conversationId, conv.id), eq(messages.isDeleted, false)))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      results.push({ ...conv, participants, unreadCount, lastMessage: lastMessage || undefined });
    }

    return results;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined> {
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) cleanData[key] = value;
    }
    const [result] = await db.update(conversations).set(cleanData).where(eq(conversations.id, id)).returning();
    return result || undefined;
  }

  async getOrCreateDirectConversation(userId1: string, userId2: string): Promise<Conversation> {
    const user1Participations = await db.select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId1));
    
    for (const p1 of user1Participations) {
      const conv = await this.getConversation(p1.conversationId);
      if (conv && conv.type === 'DIRECT') {
        const participants = await db.select()
          .from(conversationParticipants)
          .where(eq(conversationParticipants.conversationId, conv.id));
        if (participants.length === 2 && participants.some(p => p.userId === userId2)) {
          return conv;
        }
      }
    }

    const newConv = await this.createConversation({ type: 'DIRECT', createdById: userId1 });
    await this.addConversationParticipant({ conversationId: newConv.id, userId: userId1, role: 'MEMBER' });
    await this.addConversationParticipant({ conversationId: newConv.id, userId: userId2, role: 'MEMBER' });
    return newConv;
  }

  async getConversationParticipants(conversationId: string): Promise<(ConversationParticipant & { user: User })[]> {
    const results = await db.select({ participant: conversationParticipants, user: users })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(and(eq(conversationParticipants.conversationId, conversationId), isNull(conversationParticipants.leftAt)));
    return results.map(r => ({ ...r.participant, user: r.user }));
  }

  async addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const [result] = await db.insert(conversationParticipants).values(participant).returning();
    return result;
  }

  async updateConversationParticipant(id: string, data: Partial<ConversationParticipant>): Promise<ConversationParticipant | undefined> {
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) cleanData[key] = value;
    }
    const [result] = await db.update(conversationParticipants).set(cleanData).where(eq(conversationParticipants.id, id)).returning();
    return result || undefined;
  }

  async removeConversationParticipant(conversationId: string, userId: string): Promise<void> {
    await db.update(conversationParticipants)
      .set({ leftAt: new Date() })
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)));
  }

  async getMessages(conversationId: string, limit = 50, before?: string): Promise<(Message & { sender: User, attachments: MessageAttachment[] })[]> {
    let query = db.select({ message: messages, sender: users })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.conversationId, conversationId), eq(messages.isDeleted, false)));

    if (before) {
      const beforeMsg = await this.getMessage(before);
      if (beforeMsg && beforeMsg.createdAt) {
        query = db.select({ message: messages, sender: users })
          .from(messages)
          .innerJoin(users, eq(messages.senderId, users.id))
          .where(and(
            eq(messages.conversationId, conversationId),
            eq(messages.isDeleted, false),
            sql`${messages.createdAt} < ${beforeMsg.createdAt}`
          ));
      }
    }

    const results = await query.orderBy(desc(messages.createdAt)).limit(limit);
    
    const messagesWithAttachments: (Message & { sender: User, attachments: MessageAttachment[] })[] = [];
    for (const r of results) {
      const attachments = await this.getMessageAttachments(r.message.id);
      messagesWithAttachments.push({ ...r.message, sender: r.sender, attachments });
    }
    
    return messagesWithAttachments.reverse();
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [result] = await db.select().from(messages).where(eq(messages.id, id));
    return result || undefined;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, message.conversationId));
    return result;
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<Message | undefined> {
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) cleanData[key] = value;
    }
    if (data.content !== undefined) {
      cleanData.isEdited = true;
      cleanData.editedAt = new Date();
    }
    const [result] = await db.update(messages).set(cleanData).where(eq(messages.id, id)).returning();
    return result || undefined;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.update(messages).set({ isDeleted: true, deletedAt: new Date() }).where(eq(messages.id, id));
  }

  async createMessageAttachment(attachment: InsertMessageAttachment): Promise<MessageAttachment> {
    const [result] = await db.insert(messageAttachments).values(attachment).returning();
    return result;
  }

  async getMessageAttachments(messageId: string): Promise<MessageAttachment[]> {
    return db.select().from(messageAttachments).where(eq(messageAttachments.messageId, messageId));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)));
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const [participant] = await db.select()
      .from(conversationParticipants)
      .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)));
    
    if (!participant || !participant.lastReadAt) {
      const [result] = await db.select({ count: count() })
        .from(messages)
        .where(and(eq(messages.conversationId, conversationId), eq(messages.isDeleted, false)));
      return result?.count || 0;
    }

    const [result] = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false),
        gt(messages.createdAt, participant.lastReadAt)
      ));
    return result?.count || 0;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc || undefined;
  }

  async getDocuments(filters?: { folderId?: string | null; cohortId?: string; trackId?: string; matchId?: string; uploadedById?: string; visibility?: string; category?: string; isTemplate?: boolean; search?: string }): Promise<Document[]> {
    const conditions = [];
    if (filters?.folderId !== undefined) {
      if (filters.folderId === null) {
        conditions.push(isNull(documents.folderId));
      } else {
        conditions.push(eq(documents.folderId, filters.folderId));
      }
    }
    if (filters?.cohortId) conditions.push(eq(documents.cohortId, filters.cohortId));
    if (filters?.trackId) conditions.push(eq(documents.trackId, filters.trackId));
    if (filters?.matchId) conditions.push(eq(documents.matchId, filters.matchId));
    if (filters?.uploadedById) conditions.push(eq(documents.uploadedById, filters.uploadedById));
    if (filters?.visibility) conditions.push(eq(documents.visibility, filters.visibility as any));
    if (filters?.category) conditions.push(eq(documents.category, filters.category as any));
    if (filters?.isTemplate !== undefined) conditions.push(eq(documents.isTemplate, filters.isTemplate));
    if (filters?.search) conditions.push(or(like(documents.name, `%${filters.search}%`), like(documents.description, `%${filters.search}%`)));
    
    return db.select().from(documents).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(documents.createdAt));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(doc).returning();
    return result;
  }

  async updateDocument(id: string, data: Partial<Document>): Promise<Document | undefined> {
    const [result] = await db.update(documents).set({ ...data, updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return result || undefined;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await db.update(documents).set({ downloadCount: sql`${documents.downloadCount} + 1` }).where(eq(documents.id, id));
  }

  // Folder methods
  async getFolder(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getFolders(filters?: { parentFolderId?: string | null; ownerId?: string; cohortId?: string; trackId?: string; matchId?: string; visibility?: string }): Promise<Folder[]> {
    const conditions = [];
    if (filters?.parentFolderId !== undefined) {
      if (filters.parentFolderId === null) {
        conditions.push(isNull(folders.parentFolderId));
      } else {
        conditions.push(eq(folders.parentFolderId, filters.parentFolderId));
      }
    }
    if (filters?.ownerId) conditions.push(eq(folders.ownerId, filters.ownerId));
    if (filters?.cohortId) conditions.push(eq(folders.cohortId, filters.cohortId));
    if (filters?.trackId) conditions.push(eq(folders.trackId, filters.trackId));
    if (filters?.matchId) conditions.push(eq(folders.matchId, filters.matchId));
    if (filters?.visibility) conditions.push(eq(folders.visibility, filters.visibility as any));
    
    return db.select().from(folders).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(asc(folders.sortOrder), asc(folders.name));
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [result] = await db.insert(folders).values(folder).returning();
    return result;
  }

  async updateFolder(id: string, data: Partial<Folder>): Promise<Folder | undefined> {
    const [result] = await db.update(folders).set({ ...data, updatedAt: new Date() }).where(eq(folders.id, id)).returning();
    return result || undefined;
  }

  async deleteFolder(id: string): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  }

  // Document Version methods
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(desc(documentVersions.version));
  }

  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [result] = await db.insert(documentVersions).values(version).returning();
    return result;
  }

  // Document Access methods
  async getDocumentAccess(documentId: string): Promise<(DocumentAccess & { user: User })[]> {
    return db.select({
      id: documentAccess.id,
      documentId: documentAccess.documentId,
      userId: documentAccess.userId,
      accessType: documentAccess.accessType,
      grantedById: documentAccess.grantedById,
      grantedAt: documentAccess.grantedAt,
      expiresAt: documentAccess.expiresAt,
      user: users,
    }).from(documentAccess)
      .innerJoin(users, eq(documentAccess.userId, users.id))
      .where(and(
        eq(documentAccess.documentId, documentId),
        or(
          isNull(documentAccess.expiresAt),
          gt(documentAccess.expiresAt, new Date())
        )
      ));
  }

  async getDocumentAccessByUser(userId: string): Promise<DocumentAccess[]> {
    return db.select().from(documentAccess)
      .where(and(
        eq(documentAccess.userId, userId),
        or(
          isNull(documentAccess.expiresAt),
          gt(documentAccess.expiresAt, new Date())
        )
      ));
  }

  async getUserDocumentAccess(documentId: string, userId: string): Promise<DocumentAccess | undefined> {
    const [access] = await db.select().from(documentAccess)
      .where(and(
        eq(documentAccess.documentId, documentId),
        eq(documentAccess.userId, userId),
        or(
          isNull(documentAccess.expiresAt),
          gt(documentAccess.expiresAt, new Date())
        )
      ));
    return access || undefined;
  }

  async getDocumentByFileUrl(fileUrl: string): Promise<Document | undefined> {
    // Normalize the path - strip leading slash if present
    const normalizedUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    
    // Try exact equality matching first (canonical format)
    const [doc] = await db.select().from(documents)
      .where(eq(documents.fileUrl, normalizedUrl));
    if (doc) return doc;
    
    // Dual-lookup for legacy formats: try without "objects/" prefix
    if (normalizedUrl.startsWith('objects/')) {
      const legacyUrl = normalizedUrl.substring(8); // Remove "objects/"
      const [legacyDoc] = await db.select().from(documents)
        .where(eq(documents.fileUrl, legacyUrl));
      return legacyDoc || undefined;
    }
    
    return undefined;
  }

  async grantDocumentAccess(access: InsertDocumentAccess): Promise<DocumentAccess> {
    const [result] = await db.insert(documentAccess).values(access).returning();
    return result;
  }

  async revokeDocumentAccess(documentId: string, userId: string): Promise<void> {
    await db.delete(documentAccess).where(and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, userId)));
  }

  // Task Methods
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasks(filters?: { assignedToId?: string; createdById?: string; matchId?: string; cohortId?: string; trackId?: string; goalId?: string; status?: string; priority?: string; category?: string; parentTaskId?: string | null; overdue?: boolean; search?: string }): Promise<Task[]> {
    const conditions = [];
    if (filters?.assignedToId) conditions.push(eq(tasks.assignedToId, filters.assignedToId));
    if (filters?.createdById) conditions.push(eq(tasks.createdById, filters.createdById));
    if (filters?.matchId) conditions.push(eq(tasks.matchId, filters.matchId));
    if (filters?.cohortId) conditions.push(eq(tasks.cohortId, filters.cohortId));
    if (filters?.trackId) conditions.push(eq(tasks.trackId, filters.trackId));
    if (filters?.goalId) conditions.push(eq(tasks.goalId, filters.goalId));
    if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));
    if (filters?.priority) conditions.push(eq(tasks.priority, filters.priority as any));
    if (filters?.category) conditions.push(eq(tasks.category, filters.category as any));
    if (filters?.parentTaskId !== undefined) {
      if (filters.parentTaskId === null) {
        conditions.push(isNull(tasks.parentTaskId));
      } else {
        conditions.push(eq(tasks.parentTaskId, filters.parentTaskId));
      }
    }
    if (filters?.overdue) {
      conditions.push(and(
        sql`${tasks.dueDate} < NOW()`,
        sql`${tasks.status} NOT IN ('COMPLETED', 'CANCELLED')`
      ));
    }
    if (filters?.search) {
      conditions.push(or(
        like(tasks.title, `%${filters.search}%`),
        like(tasks.description, `%${filters.search}%`)
      ));
    }
    
    return db.select().from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(task).returning();
    return result;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]> {
    return db.select({
      id: taskComments.id,
      taskId: taskComments.taskId,
      userId: taskComments.userId,
      content: taskComments.content,
      createdAt: taskComments.createdAt,
      user: users,
    }).from(taskComments)
      .innerJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [result] = await db.insert(taskComments).values(comment).returning();
    return result;
  }

  async getTaskActivities(taskId: string): Promise<(TaskActivity & { user: User })[]> {
    return db.select({
      id: taskActivities.id,
      taskId: taskActivities.taskId,
      userId: taskActivities.userId,
      action: taskActivities.action,
      details: taskActivities.details,
      createdAt: taskActivities.createdAt,
      user: users,
    }).from(taskActivities)
      .innerJoin(users, eq(taskActivities.userId, users.id))
      .where(eq(taskActivities.taskId, taskId))
      .orderBy(desc(taskActivities.createdAt));
  }

  async createTaskActivity(activity: InsertTaskActivity): Promise<TaskActivity> {
    const [result] = await db.insert(taskActivities).values(activity).returning();
    return result;
  }

  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    return db.select().from(tasks)
      .where(eq(tasks.parentTaskId, parentTaskId))
      .orderBy(asc(tasks.createdAt));
  }

  // Goal Methods
  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async getGoals(filters?: { matchId?: string; ownerId?: string; createdById?: string; trackId?: string; status?: string; category?: string; mentorApproved?: boolean; search?: string }): Promise<Goal[]> {
    const conditions = [];
    if (filters?.matchId) conditions.push(eq(goals.matchId, filters.matchId));
    if (filters?.ownerId) conditions.push(eq(goals.ownerId, filters.ownerId));
    if (filters?.createdById) conditions.push(eq(goals.createdById, filters.createdById));
    if (filters?.trackId) conditions.push(eq(goals.trackId, filters.trackId));
    if (filters?.status) conditions.push(eq(goals.status, filters.status as any));
    if (filters?.category) conditions.push(eq(goals.category, filters.category as any));
    if (filters?.mentorApproved !== undefined) conditions.push(eq(goals.mentorApproved, filters.mentorApproved));
    if (filters?.search) {
      conditions.push(or(
        like(goals.title, `%${filters.search}%`),
        like(goals.description, `%${filters.search}%`)
      ));
    }
    
    return db.select().from(goals)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [result] = await db.insert(goals).values(goal).returning();
    return result;
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal | undefined> {
    const [goal] = await db.update(goals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return goal || undefined;
  }

  async deleteGoal(id: string): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async getMilestones(goalId: string): Promise<Milestone[]> {
    return db.select().from(milestones)
      .where(eq(milestones.goalId, goalId))
      .orderBy(asc(milestones.sortOrder));
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [result] = await db.insert(milestones).values(milestone).returning();
    return result;
  }

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone | undefined> {
    const [milestone] = await db.update(milestones)
      .set(data)
      .where(eq(milestones.id, id))
      .returning();
    return milestone || undefined;
  }

  async deleteMilestone(id: string): Promise<void> {
    await db.delete(milestones).where(eq(milestones.id, id));
  }

  async getGoalProgressHistory(goalId: string): Promise<(GoalProgress & { user: User })[]> {
    return db.select({
      id: goalProgress.id,
      goalId: goalProgress.goalId,
      previousProgress: goalProgress.previousProgress,
      newProgress: goalProgress.newProgress,
      notes: goalProgress.notes,
      updatedById: goalProgress.updatedById,
      createdAt: goalProgress.createdAt,
      user: users,
    }).from(goalProgress)
      .innerJoin(users, eq(goalProgress.updatedById, users.id))
      .where(eq(goalProgress.goalId, goalId))
      .orderBy(desc(goalProgress.createdAt));
  }

  async createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress> {
    const [result] = await db.insert(goalProgress).values(progress).returning();
    return result;
  }

  // Notification methods
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async getNotifications(userId: string, filters?: { isRead?: boolean; isArchived?: boolean; type?: string; limit?: number; offset?: number }): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    
    if (filters?.isRead !== undefined) conditions.push(eq(notifications.isRead, filters.isRead));
    if (filters?.isArchived !== undefined) conditions.push(eq(notifications.isArchived, filters.isArchived));
    if (filters?.type) conditions.push(eq(notifications.type, filters.type as any));
    
    let query = db.select().from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
    
    if (filters?.limit) query = query.limit(filters.limit) as typeof query;
    if (filters?.offset) query = query.offset(filters.offset) as typeof query;
    
    return query;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        eq(notifications.isArchived, false)
      ));
    return result?.count || 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async createManyNotifications(notifs: InsertNotification[]): Promise<Notification[]> {
    if (notifs.length === 0) return [];
    return db.insert(notifications).values(notifs).returning();
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async archiveNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isArchived: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    return db.select().from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  async getNotificationPreference(userId: string, notificationType: string): Promise<NotificationPreference | undefined> {
    const [pref] = await db.select().from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.notificationType, notificationType as any)
      ));
    return pref || undefined;
  }

  async upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    const existing = await this.getNotificationPreference(preference.userId, preference.notificationType);
    if (existing) {
      const [updated] = await db.update(notificationPreferences)
        .set({ ...preference, updatedAt: new Date() })
        .where(eq(notificationPreferences.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(notificationPreferences).values(preference).returning();
    return created;
  }

  // Analytics Methods
  async getAnalyticsDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [userStats] = await db.select({
      totalUsers: count(),
      totalMentors: sql<number>`count(*) filter (where ${users.role} = 'MENTOR')`,
      totalMentees: sql<number>`count(*) filter (where ${users.role} = 'MENTEE')`,
      totalAdmins: sql<number>`count(*) filter (where ${users.role} in ('ADMIN', 'SUPER_ADMIN'))`,
      activeUsers: sql<number>`count(*) filter (where ${users.isActive} = true)`,
      newUsersThisMonth: sql<number>`count(*) filter (where ${users.createdAt} >= ${startOfMonth})`,
    }).from(users).where(isNull(users.deletedAt));

    const [cohortStats] = await db.select({
      totalCohorts: count(),
      activeCohorts: sql<number>`count(*) filter (where ${cohorts.status} = 'ACTIVE')`,
    }).from(cohorts);

    const [membershipStats] = await db.select({
      totalApplications: count(),
      pendingApplications: sql<number>`count(*) filter (where ${cohortMemberships.applicationStatus} = 'PENDING')`,
      approvedApplications: sql<number>`count(*) filter (where ${cohortMemberships.applicationStatus} = 'APPROVED')`,
    }).from(cohortMemberships);

    const [matchStats] = await db.select({
      totalMatches: count(),
      activeMatches: sql<number>`count(*) filter (where ${mentorshipMatches.status} = 'ACTIVE')`,
      completedMatches: sql<number>`count(*) filter (where ${mentorshipMatches.status} = 'COMPLETED')`,
      averageMatchScore: sql<number>`coalesce(avg(${mentorshipMatches.matchScore}), 0)`,
    }).from(mentorshipMatches);

    const [meetingStats] = await db.select({
      totalMeetings: count(),
      meetingsThisMonth: sql<number>`count(*) filter (where ${meetingLogs.scheduledDate} >= ${startOfMonth})`,
      completedMeetings: sql<number>`count(*) filter (where ${meetingLogs.actualDate} is not null)`,
      averageDuration: sql<number>`coalesce(avg(${meetingLogs.duration}), 0)`,
    }).from(meetingLogs);

    const [taskStats] = await db.select({
      totalTasks: count(),
      completedTasks: sql<number>`count(*) filter (where ${tasks.status} = 'COMPLETED')`,
      inProgressTasks: sql<number>`count(*) filter (where ${tasks.status} = 'IN_PROGRESS')`,
      overdueTasks: sql<number>`count(*) filter (where ${tasks.status} != 'COMPLETED' and ${tasks.dueDate} < ${now})`,
    }).from(tasks);

    const totalTasksNum = Number(taskStats?.totalTasks) || 0;
    const completedTasksNum = Number(taskStats?.completedTasks) || 0;
    const taskCompletionRate = totalTasksNum > 0 ? Math.round((completedTasksNum / totalTasksNum) * 100) : 0;

    const [goalStats] = await db.select({
      totalGoals: count(),
      completedGoals: sql<number>`count(*) filter (where ${goals.status} = 'COMPLETED')`,
      inProgressGoals: sql<number>`count(*) filter (where ${goals.status} = 'IN_PROGRESS')`,
      averageProgress: sql<number>`coalesce(avg(${goals.progress}), 0)`,
    }).from(goals);

    const totalGoalsNum = Number(goalStats?.totalGoals) || 0;
    const completedGoalsNum = Number(goalStats?.completedGoals) || 0;
    const goalCompletionRate = totalGoalsNum > 0 ? Math.round((completedGoalsNum / totalGoalsNum) * 100) : 0;

    const [messageStats] = await db.select({
      totalMessages: count(),
      messagesThisMonth: sql<number>`count(*) filter (where ${messages.createdAt} >= ${startOfMonth})`,
    }).from(messages);

    const [documentStats] = await db.select({
      totalDocuments: count(),
    }).from(documents);

    const [conversationStats] = await db.select({
      totalConversations: count(),
    }).from(conversations);

    return {
      userMetrics: {
        totalUsers: Number(userStats?.totalUsers) || 0,
        totalMentors: Number(userStats?.totalMentors) || 0,
        totalMentees: Number(userStats?.totalMentees) || 0,
        totalAdmins: Number(userStats?.totalAdmins) || 0,
        activeUsers: Number(userStats?.activeUsers) || 0,
        newUsersThisMonth: Number(userStats?.newUsersThisMonth) || 0,
      },
      cohortMetrics: {
        totalCohorts: Number(cohortStats?.totalCohorts) || 0,
        activeCohorts: Number(cohortStats?.activeCohorts) || 0,
        totalApplications: Number(membershipStats?.totalApplications) || 0,
        pendingApplications: Number(membershipStats?.pendingApplications) || 0,
        approvedApplications: Number(membershipStats?.approvedApplications) || 0,
      },
      matchMetrics: {
        totalMatches: Number(matchStats?.totalMatches) || 0,
        activeMatches: Number(matchStats?.activeMatches) || 0,
        completedMatches: Number(matchStats?.completedMatches) || 0,
        averageMatchScore: Math.round(Number(matchStats?.averageMatchScore) || 0),
      },
      meetingMetrics: {
        totalMeetings: Number(meetingStats?.totalMeetings) || 0,
        meetingsThisMonth: Number(meetingStats?.meetingsThisMonth) || 0,
        completedMeetings: Number(meetingStats?.completedMeetings) || 0,
        averageDuration: Math.round(Number(meetingStats?.averageDuration) || 0),
      },
      taskMetrics: {
        totalTasks: totalTasksNum,
        completedTasks: completedTasksNum,
        inProgressTasks: Number(taskStats?.inProgressTasks) || 0,
        overdueTasks: Number(taskStats?.overdueTasks) || 0,
        completionRate: taskCompletionRate,
      },
      goalMetrics: {
        totalGoals: totalGoalsNum,
        completedGoals: completedGoalsNum,
        inProgressGoals: Number(goalStats?.inProgressGoals) || 0,
        averageProgress: Math.round(Number(goalStats?.averageProgress) || 0),
        completionRate: goalCompletionRate,
      },
      engagementMetrics: {
        totalMessages: Number(messageStats?.totalMessages) || 0,
        messagesThisMonth: Number(messageStats?.messagesThisMonth) || 0,
        totalDocuments: Number(documentStats?.totalDocuments) || 0,
        totalConversations: Number(conversationStats?.totalConversations) || 0,
      },
    };
  }

  async getAnalyticsTrends(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userGrowthRaw = await db.select({
      date: sql<string>`date(${users.createdAt})`,
      count: count(),
    }).from(users)
      .where(and(gt(users.createdAt, startDate), isNull(users.deletedAt)))
      .groupBy(sql`date(${users.createdAt})`)
      .orderBy(sql`date(${users.createdAt})`);

    const matchActivityRaw = await db.select({
      date: sql<string>`date(${mentorshipMatches.createdAt})`,
      count: count(),
    }).from(mentorshipMatches)
      .where(gt(mentorshipMatches.createdAt, startDate))
      .groupBy(sql`date(${mentorshipMatches.createdAt})`)
      .orderBy(sql`date(${mentorshipMatches.createdAt})`);

    const taskCreatedRaw = await db.select({
      date: sql<string>`date(${tasks.createdAt})`,
      created: count(),
    }).from(tasks)
      .where(gt(tasks.createdAt, startDate))
      .groupBy(sql`date(${tasks.createdAt})`)
      .orderBy(sql`date(${tasks.createdAt})`);

    const taskCompletedRaw = await db.select({
      date: sql<string>`date(${tasks.completedAt})`,
      completed: count(),
    }).from(tasks)
      .where(gt(tasks.completedAt, startDate))
      .groupBy(sql`date(${tasks.completedAt})`)
      .orderBy(sql`date(${tasks.completedAt})`);

    const goalCreatedRaw = await db.select({
      date: sql<string>`date(${goals.createdAt})`,
      created: count(),
    }).from(goals)
      .where(gt(goals.createdAt, startDate))
      .groupBy(sql`date(${goals.createdAt})`)
      .orderBy(sql`date(${goals.createdAt})`);

    const goalCompletedRaw = await db.select({
      date: sql<string>`date(${goals.completedAt})`,
      completed: count(),
    }).from(goals)
      .where(gt(goals.completedAt, startDate))
      .groupBy(sql`date(${goals.completedAt})`)
      .orderBy(sql`date(${goals.completedAt})`);

    const meetingActivityRaw = await db.select({
      date: sql<string>`date(${meetingLogs.scheduledDate})`,
      count: count(),
    }).from(meetingLogs)
      .where(gt(meetingLogs.scheduledDate, startDate))
      .groupBy(sql`date(${meetingLogs.scheduledDate})`)
      .orderBy(sql`date(${meetingLogs.scheduledDate})`);

    const taskCompletionMap = new Map<string, { completed: number; created: number }>();
    taskCreatedRaw.forEach(t => {
      const existing = taskCompletionMap.get(t.date) || { completed: 0, created: 0 };
      taskCompletionMap.set(t.date, { ...existing, created: Number(t.created) });
    });
    taskCompletedRaw.forEach(t => {
      const existing = taskCompletionMap.get(t.date) || { completed: 0, created: 0 };
      taskCompletionMap.set(t.date, { ...existing, completed: Number(t.completed) });
    });

    const goalProgressMap = new Map<string, { completed: number; created: number }>();
    goalCreatedRaw.forEach(g => {
      const existing = goalProgressMap.get(g.date) || { completed: 0, created: 0 };
      goalProgressMap.set(g.date, { ...existing, created: Number(g.created) });
    });
    goalCompletedRaw.forEach(g => {
      const existing = goalProgressMap.get(g.date) || { completed: 0, created: 0 };
      goalProgressMap.set(g.date, { ...existing, completed: Number(g.completed) });
    });

    return {
      userGrowth: userGrowthRaw.map(u => ({ date: u.date, count: Number(u.count) })),
      matchActivity: matchActivityRaw.map(m => ({ date: m.date, count: Number(m.count) })),
      taskCompletion: Array.from(taskCompletionMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
      goalProgress: Array.from(goalProgressMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
      meetingActivity: meetingActivityRaw.map(m => ({ date: m.date, count: Number(m.count) })),
    };
  }

  async getTrackAnalytics() {
    const trackList = await db.select().from(tracks).where(eq(tracks.isActive, true));
    
    const results = await Promise.all(trackList.map(async (track) => {
      const [memberCount] = await db.select({ count: count() }).from(cohortMemberships).where(eq(cohortMemberships.trackId, track.id));
      const [matchCount] = await db.select({ count: count() }).from(mentorshipMatches).where(eq(mentorshipMatches.trackId, track.id));
      const [goalCount] = await db.select({ count: count() }).from(goals).where(eq(goals.trackId, track.id));
      const [taskCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.trackId, track.id));
      
      return {
        trackId: track.id,
        trackName: track.name,
        memberCount: Number(memberCount?.count) || 0,
        matchCount: Number(matchCount?.count) || 0,
        goalCount: Number(goalCount?.count) || 0,
        taskCount: Number(taskCount?.count) || 0,
      };
    }));
    
    return results;
  }

  async getCohortAnalytics(cohortId?: string) {
    let cohortList = await db.select().from(cohorts);
    if (cohortId) {
      cohortList = cohortList.filter(c => c.id === cohortId);
    }
    
    const results = await Promise.all(cohortList.map(async (cohort) => {
      const memberships = await db.select().from(cohortMemberships).where(eq(cohortMemberships.cohortId, cohort.id));
      const mentorCount = memberships.filter(m => m.role === 'MENTOR').length;
      const menteeCount = memberships.filter(m => m.role === 'MENTEE').length;
      const completedCount = memberships.filter(m => m.completedAt !== null).length;
      
      const [matchCount] = await db.select({ count: count() }).from(mentorshipMatches).where(eq(mentorshipMatches.cohortId, cohort.id));
      
      return {
        cohortId: cohort.id,
        cohortName: cohort.name,
        memberCount: memberships.length,
        mentorCount,
        menteeCount,
        matchCount: Number(matchCount?.count) || 0,
        completionRate: memberships.length > 0 ? Math.round((completedCount / memberships.length) * 100) : 0,
      };
    }));
    
    return results;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(filters?: { 
    actorId?: string; 
    action?: string; 
    resourceType?: string; 
    resourceId?: string; 
    success?: boolean; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
    limit?: number; 
    offset?: number;
  }): Promise<AuditLog[]> {
    const conditions = [];
    
    if (filters?.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
    if (filters?.action) conditions.push(eq(auditLogs.action, filters.action as any));
    if (filters?.resourceType) conditions.push(eq(auditLogs.resourceType, filters.resourceType as any));
    if (filters?.resourceId) conditions.push(eq(auditLogs.resourceId, filters.resourceId));
    if (filters?.success !== undefined) conditions.push(eq(auditLogs.success, filters.success));
    if (filters?.startDate) conditions.push(gt(auditLogs.timestamp, filters.startDate));
    if (filters?.endDate) conditions.push(sql`${auditLogs.timestamp} <= ${filters.endDate}`);
    if (filters?.search) {
      conditions.push(or(
        like(auditLogs.actorEmail, `%${filters.search}%`),
        like(auditLogs.resourceName, `%${filters.search}%`)
      ));
    }
    
    let query = db.select().from(auditLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query
      .orderBy(desc(auditLogs.timestamp))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async getAuditLogsCount(filters?: { 
    actorId?: string; 
    action?: string; 
    resourceType?: string; 
    resourceId?: string; 
    success?: boolean; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
  }): Promise<number> {
    const conditions = [];
    
    if (filters?.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
    if (filters?.action) conditions.push(eq(auditLogs.action, filters.action as any));
    if (filters?.resourceType) conditions.push(eq(auditLogs.resourceType, filters.resourceType as any));
    if (filters?.resourceId) conditions.push(eq(auditLogs.resourceId, filters.resourceId));
    if (filters?.success !== undefined) conditions.push(eq(auditLogs.success, filters.success));
    if (filters?.startDate) conditions.push(gt(auditLogs.timestamp, filters.startDate));
    if (filters?.endDate) conditions.push(sql`${auditLogs.timestamp} <= ${filters.endDate}`);
    if (filters?.search) {
      conditions.push(or(
        like(auditLogs.actorEmail, `%${filters.search}%`),
        like(auditLogs.resourceName, `%${filters.search}%`)
      ));
    }
    
    let query = db.select({ count: count() }).from(auditLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const [result] = await query;
    return Number(result?.count) || 0;
  }

  // Error Logs
  async createErrorLog(log: InsertErrorLog): Promise<ErrorLog> {
    const [errorLog] = await db.insert(errorLogs).values(log).returning();
    return errorLog;
  }

  async getErrorLogs(filters?: { 
    resolved?: boolean; 
    errorType?: string; 
    userId?: string;
    limit?: number; 
    offset?: number;
  }): Promise<ErrorLog[]> {
    const conditions = [];
    
    if (filters?.resolved !== undefined) conditions.push(eq(errorLogs.resolved, filters.resolved));
    if (filters?.errorType) conditions.push(eq(errorLogs.errorType, filters.errorType));
    if (filters?.userId) conditions.push(eq(errorLogs.userId, filters.userId));
    
    let query = db.select().from(errorLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query
      .orderBy(desc(errorLogs.timestamp))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async getErrorLogsCount(filters?: { resolved?: boolean; errorType?: string; userId?: string }): Promise<number> {
    const conditions = [];
    
    if (filters?.resolved !== undefined) conditions.push(eq(errorLogs.resolved, filters.resolved));
    if (filters?.errorType) conditions.push(eq(errorLogs.errorType, filters.errorType));
    if (filters?.userId) conditions.push(eq(errorLogs.userId, filters.userId));
    
    let query = db.select({ count: count() }).from(errorLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const [result] = await query;
    return Number(result?.count) || 0;
  }

  async resolveErrorLog(id: string, resolvedBy: string): Promise<ErrorLog | undefined> {
    const [errorLog] = await db.update(errorLogs)
      .set({ resolved: true, resolvedAt: new Date(), resolvedBy })
      .where(eq(errorLogs.id, id))
      .returning();
    return errorLog || undefined;
  }

  // Data Export Requests (GDPR)
  async createDataExportRequest(request: InsertDataExportRequest): Promise<DataExportRequest> {
    const [exportRequest] = await db.insert(dataExportRequests).values(request).returning();
    return exportRequest;
  }

  async getDataExportRequest(id: string): Promise<DataExportRequest | undefined> {
    const [request] = await db.select().from(dataExportRequests).where(eq(dataExportRequests.id, id));
    return request || undefined;
  }

  async getDataExportRequestsByUser(userId: string): Promise<DataExportRequest[]> {
    return db.select().from(dataExportRequests)
      .where(eq(dataExportRequests.userId, userId))
      .orderBy(desc(dataExportRequests.createdAt));
  }

  async updateDataExportRequest(id: string, data: Partial<DataExportRequest>): Promise<DataExportRequest | undefined> {
    const [request] = await db.update(dataExportRequests)
      .set(data)
      .where(eq(dataExportRequests.id, id))
      .returning();
    return request || undefined;
  }

  // Account Deletion Requests (GDPR)
  async createAccountDeletionRequest(request: InsertAccountDeletionRequest): Promise<AccountDeletionRequest> {
    const [deletionRequest] = await db.insert(accountDeletionRequests).values(request).returning();
    return deletionRequest;
  }

  async getAccountDeletionRequest(id: string): Promise<AccountDeletionRequest | undefined> {
    const [request] = await db.select().from(accountDeletionRequests).where(eq(accountDeletionRequests.id, id));
    return request || undefined;
  }

  async getAccountDeletionRequestsByUser(userId: string): Promise<AccountDeletionRequest[]> {
    return db.select().from(accountDeletionRequests)
      .where(eq(accountDeletionRequests.userId, userId))
      .orderBy(desc(accountDeletionRequests.createdAt));
  }

  async getPendingAccountDeletionRequests(): Promise<(AccountDeletionRequest & { user: User })[]> {
    const requests = await db.select().from(accountDeletionRequests)
      .where(eq(accountDeletionRequests.status, 'PENDING'))
      .orderBy(desc(accountDeletionRequests.createdAt));
    
    const result = await Promise.all(requests.map(async (req) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.userId));
      return { ...req, user };
    }));
    
    return result;
  }

  async updateAccountDeletionRequest(id: string, data: Partial<AccountDeletionRequest>): Promise<AccountDeletionRequest | undefined> {
    const [request] = await db.update(accountDeletionRequests)
      .set(data)
      .where(eq(accountDeletionRequests.id, id))
      .returning();
    return request || undefined;
  }

  // Search History
  async createSearchHistory(history: InsertSearchHistory): Promise<SearchHistory> {
    const [result] = await db.insert(searchHistory).values(history).returning();
    return result;
  }

  async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    return db.select().from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);
  }

  async clearSearchHistory(userId: string): Promise<void> {
    await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
  }

  async createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch> {
    const [result] = await db.insert(savedSearches).values(search).returning();
    return result;
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return db.select().from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt));
  }

  async deleteSavedSearch(id: string, userId: string): Promise<void> {
    await db.delete(savedSearches).where(
      and(eq(savedSearches.id, id), eq(savedSearches.userId, userId))
    );
  }

  // Surveys
  async getSurveys(filters?: { status?: string; cohortId?: string }): Promise<Survey[]> {
    let query = db.select().from(surveys);
    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(surveys.status, filters.status as any));
    }
    if (filters?.cohortId) {
      conditions.push(eq(surveys.cohortId, filters.cohortId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(surveys.createdAt));
  }

  async getSurvey(id: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey || undefined;
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const [result] = await db.insert(surveys).values(survey).returning();
    return result;
  }

  async updateSurvey(id: string, data: Partial<Survey>): Promise<Survey | undefined> {
    const [survey] = await db.update(surveys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return survey || undefined;
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [result] = await db.insert(surveyResponses).values(response).returning();
    return result;
  }

  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    return db.select().from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId))
      .orderBy(desc(surveyResponses.submittedAt));
  }

  // Onboarding
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db.select().from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId));
    return progress || undefined;
  }

  async createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [result] = await db.insert(onboardingProgress).values(progress).returning();
    return result;
  }

  async updateOnboardingProgress(userId: string, data: Partial<OnboardingProgress>): Promise<OnboardingProgress | undefined> {
    const [progress] = await db.update(onboardingProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, userId))
      .returning();
    return progress || undefined;
  }

  // Certificates
  async getCertificates(filters?: { userId?: string; cohortId?: string; status?: string }): Promise<Certificate[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(certificates.userId, filters.userId));
    if (filters?.cohortId) conditions.push(eq(certificates.cohortId, filters.cohortId));
    if (filters?.status) conditions.push(eq(certificates.status, filters.status as any));
    
    const query = conditions.length > 0 
      ? db.select().from(certificates).where(and(...conditions))
      : db.select().from(certificates);
    
    return query.orderBy(desc(certificates.createdAt));
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.id, id));
    return cert || undefined;
  }

  async getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.certificateNumber, certificateNumber));
    return cert || undefined;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [result] = await db.insert(certificates).values(certificate).returning();
    return result;
  }

  async updateCertificate(id: string, data: Partial<Certificate>): Promise<Certificate | undefined> {
    const [cert] = await db.update(certificates)
      .set(data)
      .where(eq(certificates.id, id))
      .returning();
    return cert || undefined;
  }

  // Mentor Profiles
  async getMentorProfile(userId: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.userId, userId));
    return profile || undefined;
  }

  async getMentorProfileById(id: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.id, id));
    return profile || undefined;
  }

  async getMentorProfiles(filters?: { 
    status?: string; 
    region?: string; 
    track?: string; 
    language?: string;
    cohortYear?: number;
    hasCapacity?: boolean;
    search?: string;
  }): Promise<(MentorProfile & { user: User })[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(mentorProfiles.status, filters.status as any));
    }
    if (filters?.region) {
      conditions.push(eq(mentorProfiles.region, filters.region as any));
    }
    if (filters?.track) {
      conditions.push(sql`${filters.track} = ANY(${mentorProfiles.mentoringTracks})`);
    }
    if (filters?.language) {
      conditions.push(sql`${filters.language} = ANY(${mentorProfiles.languages})`);
    }
    if (filters?.cohortYear) {
      conditions.push(eq(mentorProfiles.cohortYear, filters.cohortYear));
    }
    if (filters?.hasCapacity) {
      conditions.push(sql`${mentorProfiles.currentMenteeCount} < ${mentorProfiles.maxMentees}`);
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.email, searchTerm),
          like(mentorProfiles.preferredName, searchTerm),
          like(mentorProfiles.expertiseDescription, searchTerm)
        )
      );
    }

    const query = db
      .select()
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id));

    const results = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(mentorProfiles.createdAt))
      : await query.orderBy(desc(mentorProfiles.createdAt));

    return results.map(r => ({
      ...r.mentor_profiles,
      user: r.users
    }));
  }

  async createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile> {
    const [result] = await db.insert(mentorProfiles).values(profile).returning();
    return result;
  }

  async updateMentorProfile(userId: string, data: Partial<MentorProfile>): Promise<MentorProfile | undefined> {
    const [profile] = await db.update(mentorProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mentorProfiles.userId, userId))
      .returning();
    return profile || undefined;
  }

  async deleteMentorProfile(userId: string): Promise<void> {
    await db.delete(mentorProfiles).where(eq(mentorProfiles.userId, userId));
  }

  async updateMentorMenteeCount(userId: string, count: number): Promise<void> {
    await db.update(mentorProfiles)
      .set({ currentMenteeCount: count, updatedAt: new Date() })
      .where(eq(mentorProfiles.userId, userId));
  }

  async getMentorsWithCapacity(cohortYear?: number): Promise<(MentorProfile & { user: User })[]> {
    const conditions = [
      sql`${mentorProfiles.currentMenteeCount} < ${mentorProfiles.maxMentees}`,
      eq(mentorProfiles.status, 'ACTIVE')
    ];
    
    if (cohortYear) {
      conditions.push(eq(mentorProfiles.cohortYear, cohortYear));
    }

    const results = await db
      .select()
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(mentorProfiles.currentMenteeCount));

    return results.map(r => ({
      ...r.mentor_profiles,
      user: r.users
    }));
  }

  // Professional Profiles
  async getProfessionalProfile(userId: string): Promise<ProfessionalProfile | undefined> {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId));
    return profile || undefined;
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const [result] = await db.insert(professionalProfiles).values(profile).returning();
    return result;
  }

  async updateProfessionalProfile(userId: string, data: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined> {
    const [profile] = await db.update(professionalProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(professionalProfiles.userId, userId))
      .returning();
    return profile || undefined;
  }

  async deleteProfessionalProfile(userId: string): Promise<void> {
    await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, userId));
  }

  // Mentorship Roles
  async getMentorshipRole(userId: string): Promise<MentorshipRole | undefined> {
    const [role] = await db.select().from(mentorshipRoles).where(eq(mentorshipRoles.userId, userId));
    return role || undefined;
  }

  async createMentorshipRole(role: InsertMentorshipRole): Promise<MentorshipRole> {
    const [result] = await db.insert(mentorshipRoles).values(role).returning();
    return result;
  }

  async updateMentorshipRole(userId: string, data: Partial<MentorshipRole>): Promise<MentorshipRole | undefined> {
    const [role] = await db.update(mentorshipRoles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mentorshipRoles.userId, userId))
      .returning();
    return role || undefined;
  }

  async deleteMentorshipRole(userId: string): Promise<void> {
    await db.delete(mentorshipRoles).where(eq(mentorshipRoles.userId, userId));
  }

  // Mentee Profiles
  async getMenteeProfile(userId: string): Promise<MenteeProfile | undefined> {
    const [profile] = await db.select().from(menteeProfiles).where(eq(menteeProfiles.userId, userId));
    return profile || undefined;
  }

  async getMenteeProfileById(id: string): Promise<MenteeProfile | undefined> {
    const [profile] = await db.select().from(menteeProfiles).where(eq(menteeProfiles.id, id));
    return profile || undefined;
  }

  async getMenteeProfiles(filters?: { 
    careerStage?: string;
    search?: string;
  }): Promise<(MenteeProfile & { user: User })[]> {
    const conditions = [];
    
    if (filters?.careerStage) {
      conditions.push(eq(menteeProfiles.careerStage, filters.careerStage as any));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.email, searchTerm),
          like(menteeProfiles.shortTermGoals, searchTerm),
          like(menteeProfiles.longTermVision, searchTerm)
        )
      );
    }

    const query = db
      .select()
      .from(menteeProfiles)
      .innerJoin(users, eq(menteeProfiles.userId, users.id));

    const results = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(menteeProfiles.createdAt))
      : await query.orderBy(desc(menteeProfiles.createdAt));

    return results.map(r => ({
      ...r.mentee_profiles,
      user: r.users
    }));
  }

  async createMenteeProfile(profile: InsertMenteeProfile): Promise<MenteeProfile> {
    const [result] = await db.insert(menteeProfiles).values(profile).returning();
    return result;
  }

  async updateMenteeProfile(userId: string, data: Partial<MenteeProfile>): Promise<MenteeProfile | undefined> {
    const [profile] = await db.update(menteeProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(menteeProfiles.userId, userId))
      .returning();
    return profile || undefined;
  }

  async deleteMenteeProfile(userId: string): Promise<void> {
    await db.delete(menteeProfiles).where(eq(menteeProfiles.userId, userId));
  }

  // Extended Mentor Profiles
  async getMentorProfileExtended(userId: string): Promise<MentorProfileExtended | undefined> {
    const [profile] = await db.select().from(mentorProfilesExtended).where(eq(mentorProfilesExtended.userId, userId));
    return profile || undefined;
  }

  async getMentorProfileExtendedById(id: string): Promise<MentorProfileExtended | undefined> {
    const [profile] = await db.select().from(mentorProfilesExtended).where(eq(mentorProfilesExtended.id, id));
    return profile || undefined;
  }

  async getMentorProfilesExtended(filters?: { 
    search?: string;
    hasCapacity?: boolean;
  }): Promise<(MentorProfileExtended & { user: User })[]> {
    const conditions = [];
    
    if (filters?.hasCapacity) {
      conditions.push(sql`${mentorProfilesExtended.maxMentees} > 0`);
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.email, searchTerm),
          like(mentorProfilesExtended.skillsToShare, searchTerm),
          like(mentorProfilesExtended.mentorshipExperienceDescription, searchTerm)
        )
      );
    }

    const query = db
      .select()
      .from(mentorProfilesExtended)
      .innerJoin(users, eq(mentorProfilesExtended.userId, users.id));

    const results = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(mentorProfilesExtended.createdAt))
      : await query.orderBy(desc(mentorProfilesExtended.createdAt));

    return results.map(r => ({
      ...r.mentor_profiles_extended,
      user: r.users
    }));
  }

  async createMentorProfileExtended(profile: InsertMentorProfileExtended): Promise<MentorProfileExtended> {
    const [result] = await db.insert(mentorProfilesExtended).values(profile).returning();
    return result;
  }

  async updateMentorProfileExtended(userId: string, data: Partial<MentorProfileExtended>): Promise<MentorProfileExtended | undefined> {
    const [profile] = await db.update(mentorProfilesExtended)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mentorProfilesExtended.userId, userId))
      .returning();
    return profile || undefined;
  }

  async deleteMentorProfileExtended(userId: string): Promise<void> {
    await db.delete(mentorProfilesExtended).where(eq(mentorProfilesExtended.userId, userId));
  }
}

export const storage = new DatabaseStorage();
