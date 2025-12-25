import { 
  users, tracks, cohorts, cohortTracks, cohortMemberships, mentorshipMatches, meetingLogs, goals, tasks, documents, documentAccess,
  applicationQuestions, applicationResponses, matchingConfigurations,
  conversations, conversationParticipants, messages, messageAttachments, messageReads,
  folders, documentVersions, taskComments, taskActivities, milestones, goalProgress,
  notifications, notificationPreferences,
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
  type Notification, type InsertNotification, type NotificationPreference, type InsertNotificationPreference
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, isNull, desc, count, sql, like, or, asc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
}

export const storage = new DatabaseStorage();
