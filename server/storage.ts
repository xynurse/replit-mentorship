import { 
  users, tracks, cohorts, cohortTracks, cohortMemberships, mentorshipMatches, meetingLogs, goals, tasks, documents, documentAccess,
  applicationQuestions, applicationResponses, matchingConfigurations,
  conversations, conversationParticipants, messages, messageAttachments, messageReads,
  type User, type InsertUser, type Track, type InsertTrack, type Cohort, type InsertCohort,
  type CohortTrack, type InsertCohortTrack, type CohortMembership, type InsertCohortMembership,
  type MentorshipMatch, type InsertMentorshipMatch, type MeetingLog, type InsertMeetingLog,
  type Goal, type InsertGoal, type Task, type InsertTask, type Document, type InsertDocument,
  type ApplicationQuestion, type InsertApplicationQuestion, type ApplicationResponse, type InsertApplicationResponse,
  type MatchingConfiguration, type InsertMatchingConfiguration,
  type Conversation, type InsertConversation, type ConversationParticipant, type InsertConversationParticipant,
  type Message, type InsertMessage, type MessageAttachment, type InsertMessageAttachment, type MessageRead, type InsertMessageRead
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
        sql`${meetingLogs.scheduledAt} >= NOW()`,
        sql`${meetingLogs.scheduledAt} <= ${endOfWeek}`
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
}

export const storage = new DatabaseStorage();
