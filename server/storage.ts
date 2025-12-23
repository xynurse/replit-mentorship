import { 
  users, tracks, cohorts, cohortTracks, cohortMemberships, mentorshipMatches, meetingLogs, goals, tasks, documents, documentAccess,
  type User, type InsertUser, type Track, type InsertTrack, type Cohort, type InsertCohort,
  type CohortTrack, type InsertCohortTrack, type CohortMembership, type InsertCohortMembership,
  type MentorshipMatch, type InsertMentorshipMatch, type MeetingLog, type InsertMeetingLog,
  type Goal, type InsertGoal, type Task, type InsertTask, type Document, type InsertDocument
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
}

export const storage = new DatabaseStorage();
