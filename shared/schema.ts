import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cohortStatusEnum = pgEnum("cohort_status", ["DRAFT", "RECRUITING", "MATCHING", "ACTIVE", "COMPLETED", "ARCHIVED"]);
export const applicationStatusEnum = pgEnum("application_status", ["PENDING", "APPROVED", "REJECTED", "WAITLISTED"]);
export const matchStatusEnum = pgEnum("match_status", ["UNMATCHED", "MATCHED", "REMATCHED"]);
export const mentorshipMatchStatusEnum = pgEnum("mentorship_match_status", ["PROPOSED", "ACTIVE", "PAUSED", "COMPLETED", "TERMINATED"]);
export const meetingTypeEnum = pgEnum("meeting_type", ["VIRTUAL", "IN_PERSON", "PHONE"]);
export const goalCategoryEnum = pgEnum("goal_category", ["SHORT_TERM", "LONG_TERM", "MILESTONE"]);
export const goalStatusEnum = pgEnum("goal_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED"]);
export const taskPriorityEnum = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusEnum = pgEnum("task_status", ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]);
export const documentCategoryEnum = pgEnum("document_category", ["TEMPLATE", "AGREEMENT", "RESOURCE", "SUBMISSION", "OTHER"]);
export const documentVisibilityEnum = pgEnum("document_visibility", ["PUBLIC", "COHORT", "TRACK", "MATCH", "PRIVATE"]);
export const documentAccessTypeEnum = pgEnum("document_access_type", ["VIEW", "DOWNLOAD", "EDIT"]);
export const cohortRoleEnum = pgEnum("cohort_role", ["MENTOR", "MENTEE"]);
export const questionTypeEnum = pgEnum("question_type", ["TEXT", "TEXTAREA", "SELECT", "MULTISELECT", "RATING", "CHECKBOX", "DATE", "FILE"]);
export const questionForRoleEnum = pgEnum("question_for_role", ["MENTOR", "MENTEE", "BOTH"]);

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "MENTOR", "MENTEE"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("MENTEE"),
  profileImage: text("profile_image"),
  phone: text("phone"),
  timezone: text("timezone").default("America/New_York"),
  preferredLanguage: text("preferred_language").default("en"),
  languagesSpoken: text("languages_spoken").array().default(sql`ARRAY['English']::text[]`),
  bio: text("bio"),
  linkedInUrl: text("linkedin_url"),
  organizationName: text("organization_name"),
  jobTitle: text("job_title"),
  yearsOfExperience: integer("years_of_experience"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  isProfileComplete: boolean("is_profile_complete").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  lastLoginAt: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
  passwordResetToken: true,
  passwordResetExpires: true,
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["MENTOR", "MENTEE"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const completeProfileSchema = z.object({
  phone: z.string().optional(),
  timezone: z.string(),
  preferredLanguage: z.string(),
  languagesSpoken: z.array(z.string()).min(1, "Select at least one language"),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be less than 500 characters"),
  linkedInUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  organizationName: z.string().min(1, "Organization is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  yearsOfExperience: z.number().min(0).max(50),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MENTOR" | "MENTEE";
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cohorts = pgTable("cohorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  applicationDeadline: timestamp("application_deadline"),
  status: cohortStatusEnum("status").default("DRAFT"),
  maxMentors: integer("max_mentors"),
  maxMentees: integer("max_mentees"),
  isPublic: boolean("is_public").default(false),
  settings: jsonb("settings"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cohortTracks = pgTable("cohort_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id),
  trackId: varchar("track_id").notNull().references(() => tracks.id),
  isActive: boolean("is_active").default(true),
  mentorCapacity: integer("mentor_capacity"),
  menteeCapacity: integer("mentee_capacity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cohortMemberships = pgTable("cohort_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: cohortRoleEnum("role").notNull(),
  trackId: varchar("track_id").references(() => tracks.id),
  applicationStatus: applicationStatusEnum("application_status").default("PENDING"),
  applicationData: jsonb("application_data"),
  matchStatus: matchStatusEnum("match_status").default("UNMATCHED"),
  joinedAt: timestamp("joined_at"),
  completedAt: timestamp("completed_at"),
  certificateIssuedAt: timestamp("certificate_issued_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mentorshipMatches = pgTable("mentorship_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id),
  mentorMembershipId: varchar("mentor_membership_id").notNull().references(() => cohortMemberships.id),
  menteeMembershipId: varchar("mentee_membership_id").notNull().references(() => cohortMemberships.id),
  trackId: varchar("track_id").references(() => tracks.id),
  status: mentorshipMatchStatusEnum("status").default("PROPOSED"),
  matchScore: integer("match_score"),
  matchReason: jsonb("match_reason"),
  matchedAt: timestamp("matched_at"),
  matchedById: varchar("matched_by_id").references(() => users.id),
  startDate: timestamp("start_date"),
  expectedEndDate: timestamp("expected_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  terminationReason: text("termination_reason"),
  mentorFeedback: jsonb("mentor_feedback"),
  menteeFeedback: jsonb("mentee_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const meetingLogs = pgTable("meeting_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => mentorshipMatches.id),
  scheduledAt: timestamp("scheduled_at"),
  occurredAt: timestamp("occurred_at"),
  duration: integer("duration"),
  meetingType: meetingTypeEnum("meeting_type"),
  agenda: text("agenda"),
  notes: text("notes"),
  actionItems: text("action_items"),
  mentorAttended: boolean("mentor_attended"),
  menteeAttended: boolean("mentee_attended"),
  nextMeetingDate: timestamp("next_meeting_date"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => mentorshipMatches.id),
  title: text("title").notNull(),
  description: text("description"),
  category: goalCategoryEnum("category").default("SHORT_TERM"),
  targetDate: timestamp("target_date"),
  status: goalStatusEnum("status").default("NOT_STARTED"),
  progress: integer("progress").default(0),
  createdById: varchar("created_by_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  completedAt: timestamp("completed_at"),
  reflectionNotes: text("reflection_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignedById: varchar("assigned_by_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  priority: taskPriorityEnum("priority").default("MEDIUM"),
  status: taskStatusEnum("status").default("TODO"),
  dueDate: timestamp("due_date"),
  reminderDate: timestamp("reminder_date"),
  completedAt: timestamp("completed_at"),
  tags: text("tags").array(),
  parentTaskId: varchar("parent_task_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  category: documentCategoryEnum("category").default("OTHER"),
  visibility: documentVisibilityEnum("visibility").default("PRIVATE"),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  trackId: varchar("track_id").references(() => tracks.id),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  version: integer("version").default(1),
  isTemplate: boolean("is_template").default(false),
  tags: text("tags").array(),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentAccess = pgTable("document_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  accessType: documentAccessTypeEnum("access_type").default("VIEW"),
  grantedById: varchar("granted_by_id").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const applicationQuestions = pgTable("application_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull().default("TEXT"),
  options: jsonb("options"),
  isRequired: boolean("is_required").default(true),
  forRole: questionForRoleEnum("for_role").default("BOTH"),
  section: text("section"),
  helpText: text("help_text"),
  validationRules: jsonb("validation_rules"),
  sortOrder: integer("sort_order").default(0),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applicationResponses = pgTable("application_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  membershipId: varchar("membership_id").notNull().references(() => cohortMemberships.id),
  questionId: varchar("question_id").notNull().references(() => applicationQuestions.id),
  response: jsonb("response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const matchingConfigurations = pgTable("matching_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id).unique(),
  languageWeight: integer("language_weight").default(25),
  trackWeight: integer("track_weight").default(20),
  expertiseWeight: integer("expertise_weight").default(25),
  availabilityWeight: integer("availability_weight").default(15),
  experienceWeight: integer("experience_weight").default(10),
  communicationWeight: integer("communication_weight").default(5),
  minimumScore: integer("minimum_score").default(50),
  requireLanguageMatch: boolean("require_language_match").default(true),
  maxMenteesPerMentor: integer("max_mentees_per_mentor").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCohortSchema = createInsertSchema(cohorts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCohortTrackSchema = createInsertSchema(cohortTracks).omit({ id: true, createdAt: true });
export const insertCohortMembershipSchema = createInsertSchema(cohortMemberships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMentorshipMatchSchema = createInsertSchema(mentorshipMatches).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMeetingLogSchema = createInsertSchema(meetingLogs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentAccessSchema = createInsertSchema(documentAccess).omit({ id: true, grantedAt: true });
export const insertApplicationQuestionSchema = createInsertSchema(applicationQuestions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationResponseSchema = createInsertSchema(applicationResponses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatchingConfigurationSchema = createInsertSchema(matchingConfigurations).omit({ id: true, createdAt: true, updatedAt: true });

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type CohortTrack = typeof cohortTracks.$inferSelect;
export type InsertCohortTrack = z.infer<typeof insertCohortTrackSchema>;
export type CohortMembership = typeof cohortMemberships.$inferSelect;
export type InsertCohortMembership = z.infer<typeof insertCohortMembershipSchema>;
export type MentorshipMatch = typeof mentorshipMatches.$inferSelect;
export type InsertMentorshipMatch = z.infer<typeof insertMentorshipMatchSchema>;
export type MeetingLog = typeof meetingLogs.$inferSelect;
export type InsertMeetingLog = z.infer<typeof insertMeetingLogSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentAccess = typeof documentAccess.$inferSelect;
export type InsertDocumentAccess = z.infer<typeof insertDocumentAccessSchema>;

export type CohortStatus = "DRAFT" | "RECRUITING" | "MATCHING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";
export type MatchStatus = "UNMATCHED" | "MATCHED" | "REMATCHED";
export type MentorshipMatchStatus = "PROPOSED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "TERMINATED";
export type MeetingType = "VIRTUAL" | "IN_PERSON" | "PHONE";
export type GoalCategory = "SHORT_TERM" | "LONG_TERM" | "MILESTONE";
export type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
export type DocumentCategory = "TEMPLATE" | "AGREEMENT" | "RESOURCE" | "SUBMISSION" | "OTHER";
export type DocumentVisibility = "PUBLIC" | "COHORT" | "TRACK" | "MATCH" | "PRIVATE";
export type DocumentAccessType = "VIEW" | "DOWNLOAD" | "EDIT";
export type CohortRole = "MENTOR" | "MENTEE";
export type QuestionType = "TEXT" | "TEXTAREA" | "SELECT" | "MULTISELECT" | "RATING" | "CHECKBOX" | "DATE" | "FILE";
export type QuestionForRole = "MENTOR" | "MENTEE" | "BOTH";

export type ApplicationQuestion = typeof applicationQuestions.$inferSelect;
export type InsertApplicationQuestion = z.infer<typeof insertApplicationQuestionSchema>;
export type ApplicationResponse = typeof applicationResponses.$inferSelect;
export type InsertApplicationResponse = z.infer<typeof insertApplicationResponseSchema>;
export type MatchingConfiguration = typeof matchingConfigurations.$inferSelect;
export type InsertMatchingConfiguration = z.infer<typeof insertMatchingConfigurationSchema>;
