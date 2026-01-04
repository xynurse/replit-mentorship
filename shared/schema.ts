import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cohortStatusEnum = pgEnum("cohort_status", ["DRAFT", "RECRUITING", "MATCHING", "ACTIVE", "COMPLETED", "ARCHIVED"]);
export const applicationStatusEnum = pgEnum("application_status", ["PENDING", "APPROVED", "REJECTED", "WAITLISTED"]);
export const matchStatusEnum = pgEnum("match_status", ["UNMATCHED", "MATCHED", "REMATCHED"]);
export const mentorshipMatchStatusEnum = pgEnum("mentorship_match_status", ["PROPOSED", "ACTIVE", "PAUSED", "COMPLETED", "TERMINATED"]);
export const meetingTypeEnum = pgEnum("meeting_type", ["VIRTUAL", "IN_PERSON", "PHONE"]);
export const meetingFormatEnum = pgEnum("meeting_format", ["VIRTUAL", "IN_PERSON", "PHONE", "ASYNC"]);
export const meetingPlatformEnum = pgEnum("meeting_platform", ["ZOOM", "TEAMS", "GOOGLE_MEET", "OTHER"]);
export const goalCategoryEnum = pgEnum("goal_category", ["SHORT_TERM", "LONG_TERM", "MILESTONE", "STRETCH"]);
export const goalStatusEnum = pgEnum("goal_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED", "DEFERRED"]);
export const taskPriorityEnum = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusEnum = pgEnum("task_status", ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "COMPLETED", "CANCELLED"]);
export const taskCategoryEnum = pgEnum("task_category", ["ADMIN_TASK", "MENTOR_TASK", "SELF_TASK", "GOAL_TASK"]);
export const taskRecurrenceEnum = pgEnum("task_recurrence", ["NONE", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]);
export const taskActionEnum = pgEnum("task_action", ["CREATED", "UPDATED", "ASSIGNED", "STATUS_CHANGED", "COMPLETED", "VERIFIED", "COMMENTED", "DELETED"]);
export const documentCategoryEnum = pgEnum("document_category", ["TEMPLATE", "AGREEMENT", "RESOURCE", "SUBMISSION", "OTHER"]);
export const documentVisibilityEnum = pgEnum("document_visibility", ["PUBLIC", "COHORT", "TRACK", "MATCH", "PRIVATE"]);
export const documentAccessTypeEnum = pgEnum("document_access_type", ["VIEW", "DOWNLOAD", "EDIT"]);
export const cohortRoleEnum = pgEnum("cohort_role", ["MENTOR", "MENTEE"]);
export const questionTypeEnum = pgEnum("question_type", ["TEXT", "TEXTAREA", "SELECT", "MULTISELECT", "RATING", "CHECKBOX", "DATE", "FILE"]);
export const questionForRoleEnum = pgEnum("question_for_role", ["MENTOR", "MENTEE", "BOTH"]);
export const conversationTypeEnum = pgEnum("conversation_type", ["DIRECT", "MATCH", "TRACK_COMMUNITY", "COHORT_ANNOUNCEMENT"]);
export const conversationParticipantRoleEnum = pgEnum("conversation_participant_role", ["MEMBER", "MODERATOR", "ADMIN"]);
export const messageTypeEnum = pgEnum("message_type", ["TEXT", "FILE", "SYSTEM", "ANNOUNCEMENT"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "WELCOME",
  "APPLICATION_RECEIVED",
  "APPLICATION_APPROVED",
  "APPLICATION_REJECTED",
  "MATCH_PROPOSED",
  "MATCH_CONFIRMED",
  "NEW_MESSAGE",
  "NEW_ANNOUNCEMENT",
  "TASK_ASSIGNED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
  "TASK_COMPLETED",
  "GOAL_APPROVED",
  "GOAL_FEEDBACK",
  "GOAL_MILESTONE_DUE",
  "MEETING_REMINDER",
  "MEETING_SCHEDULED",
  "DOCUMENT_SHARED",
  "MENTEE_PROGRESS_UPDATE",
  "COHORT_ENDING_SOON",
  "SYSTEM_ANNOUNCEMENT",
]);

export const notificationPriorityEnum = pgEnum("notification_priority", ["LOW", "NORMAL", "HIGH", "URGENT"]);

export const notificationResourceTypeEnum = pgEnum("notification_resource_type", [
  "USER",
  "MATCH",
  "TASK",
  "GOAL",
  "MESSAGE",
  "DOCUMENT",
  "COHORT",
  "APPLICATION",
  "MEETING",
  "SYSTEM",
]);

export const emailFrequencyEnum = pgEnum("email_frequency", ["INSTANT", "DAILY_DIGEST", "WEEKLY_DIGEST", "NEVER"]);

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "MENTOR", "MENTEE"]);

// Mentorship role choice enum
export const mentorshipRoleChoiceEnum = pgEnum("mentorship_role_choice", ["seeking_mentor", "providing_mentorship", "both"]);

// Career stage enum for mentee profiles
export const careerStageEnum = pgEnum("career_stage", ["student", "early_career", "mid_career", "senior"]);

// Monthly hours available enum
export const monthlyHoursEnum = pgEnum("monthly_hours", ["1-2", "3-4", "5-10", "10-15"]);

// Preferred duration enum
export const preferredDurationEnum = pgEnum("preferred_duration", ["3_months", "6_months", "1_year", "1_year_plus", "reevaluate", "ongoing"]);

// Willing to pay enum
export const willingToPayEnum = pgEnum("willing_to_pay", ["yes", "no", "maybe"]);

// Expertise areas enum
export const expertiseAreaEnum = pgEnum("expertise_area", ["Science", "Innovation", "Entrepreneurship", "Leadership"]);

// Education level enum  
export const educationLevelEnum = pgEnum("education_level", ["Bachelor", "Master", "DNP", "PhD"]);

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
  isSonsielMember: boolean("is_sonsiel_member").default(false),
  interestedInMembership: boolean("interested_in_membership"),
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

// Mentor Profile Enums
export const mentorRegionEnum = pgEnum("mentor_region", [
  "NORTH_AMERICA",
  "SOUTH_AMERICA",
  "EUROPE",
  "ASIA",
  "AFRICA",
  "OCEANIA",
  "OTHER"
]);

export const mentoringTrackEnum = pgEnum("mentoring_track", [
  "SCIENTIST",
  "INNOVATOR",
  "ENTREPRENEUR",
  "INTRAPRENEUR",
  "LEADER"
]);

export const meetingFrequencyEnum = pgEnum("meeting_frequency", [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "FLEXIBLE"
]);

export const mentorMeetingFormatEnum = pgEnum("mentor_meeting_format", [
  "VIRTUAL",
  "IN_PERSON",
  "HYBRID",
  "FLEXIBLE"
]);

export const mentorStatusEnum = pgEnum("mentor_status", [
  "PENDING",
  "APPROVED",
  "ACTIVE",
  "INACTIVE",
  "COMPLETED"
]);

// Mentor Profiles Table
export const mentorProfiles = pgTable("mentor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  // Core Identity
  preferredName: text("preferred_name"),
  pronouns: text("pronouns"),
  
  // Professional & Geographic
  region: mentorRegionEnum("region"),
  languages: text("languages").array().default(sql`ARRAY['English']::text[]`),
  
  // Mentorship Track & Expertise
  mentoringTracks: text("mentoring_tracks").array().default(sql`ARRAY[]::text[]`),
  expertiseDescription: text("expertise_description"),
  skillsToShare: text("skills_to_share"),
  
  // Goals & Preferences
  mentoringGoals: text("mentoring_goals"),
  preferredMeetingFrequency: meetingFrequencyEnum("preferred_meeting_frequency"),
  preferredMeetingFormat: mentorMeetingFormatEnum("preferred_meeting_format"),
  additionalNotes: text("additional_notes"),
  
  // Admin/System Fields
  status: mentorStatusEnum("status").default("PENDING"),
  cohortYear: integer("cohort_year"),
  maxMentees: integer("max_mentees").default(2),
  currentMenteeCount: integer("current_mentee_count").default(0),
  applicationTimestamp: timestamp("application_timestamp"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentMenteeCount: true,
});

export const updateMentorProfileSchema = insertMentorProfileSchema.partial().omit({
  userId: true,
});

export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;
export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type MentorRegion = "NORTH_AMERICA" | "SOUTH_AMERICA" | "EUROPE" | "ASIA" | "AFRICA" | "OCEANIA" | "OTHER";
export type MentoringTrack = "SCIENTIST" | "INNOVATOR" | "ENTREPRENEUR" | "INTRAPRENEUR" | "LEADER";
export type MeetingFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "FLEXIBLE";
export type MentorMeetingFormat = "VIRTUAL" | "IN_PERSON" | "HYBRID" | "FLEXIBLE";
export type MentorStatus = "PENDING" | "APPROVED" | "ACTIVE" | "INACTIVE" | "COMPLETED";

// Professional Profile Table (shared between mentors and mentees)
export const professionalProfiles = pgTable("professional_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  positionTitle: text("position_title"),
  organization: text("organization"),
  expertiseAreas: text("expertise_areas").array().default(sql`ARRAY[]::text[]`),
  highestEducation: text("highest_education").array().default(sql`ARRAY[]::text[]`),
  yearsInHealthcare: text("years_in_healthcare"),
  yearsInInnovation: text("years_in_innovation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfessionalProfileSchema = createInsertSchema(professionalProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProfessionalProfile = z.infer<typeof insertProfessionalProfileSchema>;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;

// Mentorship Role Selection Table
export const mentorshipRoles = pgTable("mentorship_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  mentorshipRole: mentorshipRoleChoiceEnum("mentorship_role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorshipRoleSchema = createInsertSchema(mentorshipRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMentorshipRole = z.infer<typeof insertMentorshipRoleSchema>;
export type MentorshipRole = typeof mentorshipRoles.$inferSelect;

// Mentee Profile Table
export const menteeProfiles = pgTable("mentee_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  // Career Context
  careerStage: careerStageEnum("career_stage"),
  shortTermGoals: text("short_term_goals"),
  longTermVision: text("long_term_vision"),
  currentProjectOrIdea: text("current_project_or_idea"),
  
  // Mentorship History
  previouslyBeenMentored: boolean("previously_been_mentored"),
  pastSuccesses: text("past_successes"),
  pastChallenges: text("past_challenges"),
  
  // What They're Seeking
  hopingToGain: text("hoping_to_gain").array().default(sql`ARRAY[]::text[]`),
  specificSkillsSeeking: text("specific_skills_seeking"),
  primaryMotivations: text("primary_motivations"),
  preferredMentorCharacteristics: text("preferred_mentor_characteristics"),
  
  // 11 Interest Ratings (0 = not interested, 1 = somewhat, 2 = very interested)
  interestScienceResearch: integer("interest_science_research").default(0),
  interestProductDevelopment: integer("interest_product_development").default(0),
  interestInnovation: integer("interest_innovation").default(0),
  interestBusinessStrategy: integer("interest_business_strategy").default(0),
  interestEntrepreneurship: integer("interest_entrepreneurship").default(0),
  interestIntrapreneurship: integer("interest_intrapreneurship").default(0),
  interestLeadership: integer("interest_leadership").default(0),
  interestNetworking: integer("interest_networking").default(0),
  interestProfessionalDevelopment: integer("interest_professional_development").default(0),
  interestDigitalTech: integer("interest_digital_tech").default(0),
  interestEthicalSocial: integer("interest_ethical_social").default(0),
  
  // Logistics
  monthlyHoursAvailable: monthlyHoursEnum("monthly_hours_available"),
  availabilityNotes: text("availability_notes"),
  timezone: text("timezone"),
  preferredDuration: preferredDurationEnum("preferred_duration"),
  preferredMethods: text("preferred_methods").array().default(sql`ARRAY[]::text[]`),
  preferredCommunicationTools: text("preferred_communication_tools").array().default(sql`ARRAY[]::text[]`),
  
  // Resources & Structure
  resourcesNeeded: text("resources_needed"),
  programSuggestions: text("program_suggestions"),
  effectiveStructures: text("effective_structures"),
  willingToPay: willingToPayEnum("willing_to_pay"),
  
  // Optional
  linkedinUrl: text("linkedin_url"),
  referralSource: text("referral_source"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMenteeProfileSchema = createInsertSchema(menteeProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMenteeProfileSchema = insertMenteeProfileSchema.partial().omit({
  userId: true,
});

export type InsertMenteeProfile = z.infer<typeof insertMenteeProfileSchema>;
export type MenteeProfile = typeof menteeProfiles.$inferSelect;

// Extended Mentor Profile Table (new fields based on design)
export const mentorProfilesExtended = pgTable("mentor_profiles_extended", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  // Capacity & Preferences
  maxMentees: integer("max_mentees").default(2),
  preferredMenteeStages: text("preferred_mentee_stages").array().default(sql`ARRAY[]::text[]`),
  openToMentoringOutsideExpertise: boolean("open_to_mentoring_outside_expertise").default(false),
  
  // Experience & Credentials
  previouslyServedAsMentor: boolean("previously_served_as_mentor"),
  mentorshipExperienceDescription: text("mentorship_experience_description"),
  certificationsTraining: text("certifications_training"),
  notableAchievements: text("notable_achievements"),
  industriesExperience: text("industries_experience").array().default(sql`ARRAY[]::text[]`),
  
  // What They Offer
  skillsToShare: text("skills_to_share"),
  primaryMotivations: text("primary_motivations"),
  
  // Past Experience
  pastSuccesses: text("past_successes"),
  pastChallenges: text("past_challenges"),
  
  // 11 Comfort Ratings (0 = not comfortable, 1 = somewhat, 2 = very comfortable)
  comfortScienceResearch: integer("comfort_science_research").default(0),
  comfortProductDevelopment: integer("comfort_product_development").default(0),
  comfortInnovation: integer("comfort_innovation").default(0),
  comfortBusinessStrategy: integer("comfort_business_strategy").default(0),
  comfortEntrepreneurship: integer("comfort_entrepreneurship").default(0),
  comfortIntrapreneurship: integer("comfort_intrapreneurship").default(0),
  comfortLeadership: integer("comfort_leadership").default(0),
  comfortNetworking: integer("comfort_networking").default(0),
  comfortProfessionalDevelopment: integer("comfort_professional_development").default(0),
  comfortDigitalTech: integer("comfort_digital_tech").default(0),
  comfortEthicalSocial: integer("comfort_ethical_social").default(0),
  
  // Logistics
  monthlyHoursAvailable: monthlyHoursEnum("monthly_hours_available"),
  preferredMethods: text("preferred_methods").array().default(sql`ARRAY[]::text[]`),
  availabilityNotes: text("availability_notes"),
  timezone: text("timezone"),
  preferredDuration: preferredDurationEnum("preferred_duration"),
  preferredCommunicationTools: text("preferred_communication_tools").array().default(sql`ARRAY[]::text[]`),
  languagesSpoken: text("languages_spoken").array().default(sql`ARRAY['english']::text[]`),
  
  // Resources & Structure
  resourcesNeeded: text("resources_needed"),
  programSuggestions: text("program_suggestions"),
  effectiveStructures: text("effective_structures"),
  
  // Optional
  linkedinUrl: text("linkedin_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorProfileExtendedSchema = createInsertSchema(mentorProfilesExtended).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMentorProfileExtendedSchema = insertMentorProfileExtendedSchema.partial().omit({
  userId: true,
});

export type InsertMentorProfileExtended = z.infer<typeof insertMentorProfileExtendedSchema>;
export type MentorProfileExtended = typeof mentorProfilesExtended.$inferSelect;

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
  meetingNumber: integer("meeting_number"),
  scheduledDate: timestamp("scheduled_date"),
  actualDate: timestamp("actual_date"),
  duration: integer("duration"),
  format: meetingFormatEnum("format"),
  platform: meetingPlatformEnum("platform"),
  location: text("location"),
  meetingType: meetingTypeEnum("meeting_type"),
  agenda: text("agenda"),
  discussionNotes: text("discussion_notes"),
  actionItemIds: text("action_item_ids").array(),
  goalsDiscussedIds: text("goals_discussed_ids").array(),
  mentorAttended: boolean("mentor_attended"),
  menteeAttended: boolean("mentee_attended"),
  mentorMoodRating: integer("mentor_mood_rating"),
  menteeMoodRating: integer("mentee_mood_rating"),
  nextMeetingDate: timestamp("next_meeting_date"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  createdById: varchar("created_by_id").references(() => users.id),
  ownerId: varchar("owner_id").references(() => users.id),
  trackId: varchar("track_id").references(() => tracks.id),
  title: text("title").notNull(),
  description: text("description"),
  category: goalCategoryEnum("category").default("SHORT_TERM"),
  specificDetails: text("specific_details"),
  measurableMetrics: jsonb("measurable_metrics"),
  achievabilityNotes: text("achievability_notes"),
  relevanceExplanation: text("relevance_explanation"),
  targetDate: timestamp("target_date"),
  status: goalStatusEnum("status").default("NOT_STARTED"),
  progress: integer("progress").default(0),
  progressNotes: jsonb("progress_notes"),
  reflectionNotes: text("reflection_notes"),
  mentorApproved: boolean("mentor_approved").default(false),
  mentorFeedback: text("mentor_feedback"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => goals.id),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  evidenceDocumentIds: text("evidence_document_ids").array(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalProgress = pgTable("goal_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => goals.id),
  previousProgress: integer("previous_progress").default(0),
  newProgress: integer("new_progress").notNull(),
  notes: text("notes"),
  updatedById: varchar("updated_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  trackId: varchar("track_id").references(() => tracks.id),
  goalId: varchar("goal_id"),
  category: taskCategoryEnum("category").default("SELF_TASK"),
  priority: taskPriorityEnum("priority").default("MEDIUM"),
  status: taskStatusEnum("status").default("TODO"),
  dueDate: timestamp("due_date"),
  reminderDate: timestamp("reminder_date"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  recurrence: taskRecurrenceEnum("recurrence").default("NONE"),
  parentTaskId: varchar("parent_task_id"),
  dependencies: text("dependencies").array(),
  tags: text("tags").array(),
  completedAt: timestamp("completed_at"),
  completedById: varchar("completed_by_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verifiedById: varchar("verified_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskActivities = pgTable("task_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: taskActionEnum("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  category: documentCategoryEnum("category").default("OTHER"),
  visibility: documentVisibilityEnum("visibility").default("PRIVATE"),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  folderId: varchar("folder_id"),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  trackId: varchar("track_id").references(() => tracks.id),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  version: integer("version").default(1),
  isTemplate: boolean("is_template").default(false),
  tags: text("tags").array(),
  downloadCount: integer("download_count").default(0),
  expiresAt: timestamp("expires_at"),
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

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  parentFolderId: varchar("parent_folder_id"),
  ownerId: varchar("owner_id").references(() => users.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  trackId: varchar("track_id").references(() => tracks.id),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  visibility: documentVisibilityEnum("visibility").default("PRIVATE"),
  color: text("color"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  version: integer("version").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  changeNotes: text("change_notes"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: conversationTypeEnum("type").notNull().default("DIRECT"),
  name: text("name"),
  matchId: varchar("match_id").references(() => mentorshipMatches.id),
  trackId: varchar("track_id").references(() => tracks.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  isArchived: boolean("is_archived").default(false),
  settings: jsonb("settings").default({}),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: conversationParticipantRoleEnum("role").notNull().default("MEMBER"),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  lastReadAt: timestamp("last_read_at"),
  isMuted: boolean("is_muted").default(false),
  notificationPreference: text("notification_preference").default("all"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").notNull().default("TEXT"),
  replyToId: varchar("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  isPinned: boolean("is_pinned").default(false),
  reactions: jsonb("reactions").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageAttachments = pgTable("message_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id).notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at").defaultNow(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCohortSchema = createInsertSchema(cohorts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCohortTrackSchema = createInsertSchema(cohortTracks).omit({ id: true, createdAt: true });
export const insertCohortMembershipSchema = createInsertSchema(cohortMemberships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMentorshipMatchSchema = createInsertSchema(mentorshipMatches).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMeetingLogSchema = createInsertSchema(meetingLogs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
export const insertTaskActivitySchema = createInsertSchema(taskActivities).omit({ id: true, createdAt: true });
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true, createdAt: true });
export const insertGoalProgressSchema = createInsertSchema(goalProgress).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentAccessSchema = createInsertSchema(documentAccess).omit({ id: true, grantedAt: true });
export const insertFolderSchema = createInsertSchema(folders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({ id: true, createdAt: true });
export const insertApplicationQuestionSchema = createInsertSchema(applicationQuestions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationResponseSchema = createInsertSchema(applicationResponses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatchingConfigurationSchema = createInsertSchema(matchingConfigurations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({ id: true, joinedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertMessageAttachmentSchema = createInsertSchema(messageAttachments).omit({ id: true, createdAt: true });
export const insertMessageReadSchema = createInsertSchema(messageReads).omit({ id: true, readAt: true });

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
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskActivity = typeof taskActivities.$inferSelect;
export type InsertTaskActivity = z.infer<typeof insertTaskActivitySchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type GoalProgress = typeof goalProgress.$inferSelect;
export type InsertGoalProgress = z.infer<typeof insertGoalProgressSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentAccess = typeof documentAccess.$inferSelect;
export type InsertDocumentAccess = z.infer<typeof insertDocumentAccessSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type CohortStatus = "DRAFT" | "RECRUITING" | "MATCHING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";
export type MatchStatus = "UNMATCHED" | "MATCHED" | "REMATCHED";
export type MentorshipMatchStatus = "PROPOSED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "TERMINATED";
export type MeetingType = "VIRTUAL" | "IN_PERSON" | "PHONE";
export type MeetingFormat = "VIRTUAL" | "IN_PERSON" | "PHONE" | "ASYNC";
export type MeetingPlatform = "ZOOM" | "TEAMS" | "GOOGLE_MEET" | "OTHER";
export type GoalCategory = "SHORT_TERM" | "LONG_TERM" | "MILESTONE" | "STRETCH";
export type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "DEFERRED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
export type TaskCategory = "ADMIN_TASK" | "MENTOR_TASK" | "SELF_TASK" | "GOAL_TASK";
export type TaskRecurrence = "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type TaskAction = "CREATED" | "UPDATED" | "ASSIGNED" | "STATUS_CHANGED" | "COMPLETED" | "VERIFIED" | "COMMENTED" | "DELETED";
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

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type InsertMessageAttachment = z.infer<typeof insertMessageAttachmentSchema>;
export type MessageRead = typeof messageReads.$inferSelect;
export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;

export type ConversationType = "DIRECT" | "MATCH" | "TRACK_COMMUNITY" | "COHORT_ANNOUNCEMENT";
export type ConversationParticipantRole = "MEMBER" | "MODERATOR" | "ADMIN";
export type MessageType = "TEXT" | "FILE" | "SYSTEM" | "ANNOUNCEMENT";

// Notification tables
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  resourceType: notificationResourceTypeEnum("resource_type"),
  resourceId: varchar("resource_id"),
  priority: notificationPriorityEnum("priority").default("NORMAL"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isArchived: boolean("is_archived").default(false),
  actionUrl: text("action_url"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true),
  emailEnabled: boolean("email_enabled").default(true),
  emailFrequency: emailFrequencyEnum("email_frequency").default("INSTANT"),
  pushEnabled: boolean("push_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationType = "WELCOME" | "APPLICATION_RECEIVED" | "APPLICATION_APPROVED" | "APPLICATION_REJECTED" | "MATCH_PROPOSED" | "MATCH_CONFIRMED" | "NEW_MESSAGE" | "NEW_ANNOUNCEMENT" | "TASK_ASSIGNED" | "TASK_DUE_SOON" | "TASK_OVERDUE" | "TASK_COMPLETED" | "GOAL_APPROVED" | "GOAL_FEEDBACK" | "GOAL_MILESTONE_DUE" | "MEETING_REMINDER" | "MEETING_SCHEDULED" | "DOCUMENT_SHARED" | "MENTEE_PROGRESS_UPDATE" | "COHORT_ENDING_SOON" | "SYSTEM_ANNOUNCEMENT";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type NotificationResourceType = "USER" | "MATCH" | "TASK" | "GOAL" | "MESSAGE" | "DOCUMENT" | "COHORT" | "APPLICATION" | "MEETING" | "SYSTEM";
export type EmailFrequency = "INSTANT" | "DAILY_DIGEST" | "WEEKLY_DIGEST" | "NEVER";

// Audit Log System
export const auditActorTypeEnum = pgEnum("audit_actor_type", ["USER", "SYSTEM", "API", "SCHEDULED_JOB"]);

export const auditActionEnum = pgEnum("audit_action", [
  "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT",
  "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_COMPLETED",
  "EMAIL_VERIFICATION", "EMAIL_CHANGE",
  "ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED",
  "SESSION_EXPIRED", "SESSION_INVALIDATED",
  "USER_CREATED", "USER_UPDATED", "USER_DELETED",
  "USER_ROLE_CHANGED", "USER_ACTIVATED", "USER_DEACTIVATED",
  "PROFILE_UPDATED", "PREFERENCES_CHANGED",
  "USER_IMPERSONATION_STARTED", "USER_IMPERSONATION_ENDED",
  "COHORT_CREATED", "COHORT_UPDATED", "COHORT_DELETED", "COHORT_STATUS_CHANGED",
  "APPLICATION_SUBMITTED", "APPLICATION_REVIEWED", "APPLICATION_APPROVED", "APPLICATION_REJECTED",
  "MATCH_CREATED", "MATCH_UPDATED", "MATCH_ACTIVATED", "MATCH_TERMINATED",
  "DOCUMENT_UPLOADED", "DOCUMENT_UPDATED", "DOCUMENT_DELETED",
  "DOCUMENT_SHARED", "DOCUMENT_ACCESS_REVOKED", "DOCUMENT_DOWNLOADED", "DOCUMENT_VIEWED",
  "MESSAGE_SENT", "MESSAGE_EDITED", "MESSAGE_DELETED",
  "TASK_CREATED", "TASK_UPDATED", "TASK_COMPLETED",
  "GOAL_CREATED", "GOAL_UPDATED", "GOAL_COMPLETED",
  "SETTINGS_CHANGED", "BULK_OPERATION_PERFORMED", "DATA_EXPORTED", "REPORT_GENERATED",
  "SCHEDULED_JOB_EXECUTED", "NOTIFICATION_SENT", "EMAIL_SENT", "ERROR_OCCURRED",
]);

export const auditResourceTypeEnum = pgEnum("audit_resource_type", [
  "USER", "SESSION", "COHORT", "TRACK", "APPLICATION", "MATCH", "MEETING",
  "DOCUMENT", "FOLDER", "MESSAGE", "CONVERSATION", "TASK", "GOAL", "MILESTONE",
  "NOTIFICATION", "SETTINGS", "SYSTEM",
]);

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  actorId: varchar("actor_id").references(() => users.id),
  actorType: auditActorTypeEnum("actor_type").notNull().default("USER"),
  actorEmail: text("actor_email"),
  actorRole: text("actor_role"),
  impersonatorId: varchar("impersonator_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  resourceType: auditResourceTypeEnum("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  resourceName: text("resource_name"),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  changedFields: text("changed_fields").array(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestId: varchar("request_id"),
  sessionId: varchar("session_id"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditAction = "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_COMPLETED" | "EMAIL_VERIFICATION" | "EMAIL_CHANGE" | "ACCOUNT_LOCKED" | "ACCOUNT_UNLOCKED" | "SESSION_EXPIRED" | "SESSION_INVALIDATED" | "USER_CREATED" | "USER_UPDATED" | "USER_DELETED" | "USER_ROLE_CHANGED" | "USER_ACTIVATED" | "USER_DEACTIVATED" | "PROFILE_UPDATED" | "PREFERENCES_CHANGED" | "USER_IMPERSONATION_STARTED" | "USER_IMPERSONATION_ENDED" | "COHORT_CREATED" | "COHORT_UPDATED" | "COHORT_DELETED" | "COHORT_STATUS_CHANGED" | "APPLICATION_SUBMITTED" | "APPLICATION_REVIEWED" | "APPLICATION_APPROVED" | "APPLICATION_REJECTED" | "MATCH_CREATED" | "MATCH_UPDATED" | "MATCH_ACTIVATED" | "MATCH_TERMINATED" | "DOCUMENT_UPLOADED" | "DOCUMENT_UPDATED" | "DOCUMENT_DELETED" | "DOCUMENT_SHARED" | "DOCUMENT_ACCESS_REVOKED" | "DOCUMENT_DOWNLOADED" | "DOCUMENT_VIEWED" | "MESSAGE_SENT" | "MESSAGE_EDITED" | "MESSAGE_DELETED" | "TASK_CREATED" | "TASK_UPDATED" | "TASK_COMPLETED" | "GOAL_CREATED" | "GOAL_UPDATED" | "GOAL_COMPLETED" | "SETTINGS_CHANGED" | "BULK_OPERATION_PERFORMED" | "DATA_EXPORTED" | "REPORT_GENERATED" | "SCHEDULED_JOB_EXECUTED" | "NOTIFICATION_SENT" | "EMAIL_SENT" | "ERROR_OCCURRED";
export type AuditActorType = "USER" | "SYSTEM" | "API" | "SCHEDULED_JOB";
export type AuditResourceType = "USER" | "SESSION" | "COHORT" | "TRACK" | "APPLICATION" | "MATCH" | "MEETING" | "DOCUMENT" | "FOLDER" | "MESSAGE" | "CONVERSATION" | "TASK" | "GOAL" | "MILESTONE" | "NOTIFICATION" | "SETTINGS" | "SYSTEM";

// Error Tracking
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id"),
  userId: varchar("user_id").references(() => users.id),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  context: jsonb("context"),
  path: text("path"),
  method: text("method"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  timestamp: true,
  resolvedAt: true,
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;

// Data Export Requests (GDPR)
export const dataExportRequestStatusEnum = pgEnum("data_export_request_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "EXPIRED"]);

export const dataExportRequests = pgTable("data_export_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: dataExportRequestStatusEnum("status").default("PENDING"),
  downloadUrl: text("download_url"),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDataExportRequestSchema = createInsertSchema(dataExportRequests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type InsertDataExportRequest = z.infer<typeof insertDataExportRequestSchema>;

// Account Deletion Requests (GDPR)
export const accountDeletionRequestStatusEnum = pgEnum("account_deletion_request_status", ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"]);

export const accountDeletionRequests = pgTable("account_deletion_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: accountDeletionRequestStatusEnum("status").default("PENDING"),
  reason: text("reason"),
  scheduledDeletionAt: timestamp("scheduled_deletion_at"),
  cancelledAt: timestamp("cancelled_at"),
  completedAt: timestamp("completed_at"),
  adminApprovedBy: varchar("admin_approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountDeletionRequestSchema = createInsertSchema(accountDeletionRequests).omit({
  id: true,
  createdAt: true,
  cancelledAt: true,
  completedAt: true,
});

export type AccountDeletionRequest = typeof accountDeletionRequests.$inferSelect;
export type InsertAccountDeletionRequest = z.infer<typeof insertAccountDeletionRequestSchema>;

// Search History
export const searchTypeEnum = pgEnum("search_type", ["USERS", "MESSAGES", "DOCUMENTS", "TASKS", "GOALS", "ALL"]);

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  query: text("query").notNull(),
  searchType: searchTypeEnum("search_type").default("ALL"),
  resultCount: integer("result_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  createdAt: true,
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

// Saved Searches
export const savedSearches = pgTable("saved_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  query: text("query").notNull(),
  searchType: searchTypeEnum("search_type").default("ALL"),
  filters: jsonb("filters"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;

// Surveys
export const surveyTypeEnum = pgEnum("survey_type", ["MID_PROGRAM", "END_PROGRAM", "MATCH_FEEDBACK", "CUSTOM"]);
export const surveyStatusEnum = pgEnum("survey_status", ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]);

export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: surveyTypeEnum("type").default("CUSTOM"),
  status: surveyStatusEnum("status").default("DRAFT"),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  questions: jsonb("questions").$type<SurveyQuestion[]>().default([]),
  isAnonymous: boolean("is_anonymous").default(false),
  dueDate: timestamp("due_date"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "MULTISELECT" | "RATING" | "CHECKBOX" | "DATE";
  required: boolean;
  options?: string[];
}

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

// Survey Responses
export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id),
  userId: varchar("user_id").references(() => users.id),
  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  submittedAt: true,
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

// Certificates
export const certificateStatusEnum = pgEnum("certificate_status", ["PENDING", "GENERATED", "DELIVERED", "REVOKED"]);

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  certificateNumber: text("certificate_number").notNull().unique(),
  status: certificateStatusEnum("status").default("PENDING"),
  templateData: jsonb("template_data"),
  pdfUrl: text("pdf_url"),
  verificationUrl: text("verification_url"),
  issuedAt: timestamp("issued_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

// Onboarding Progress
export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  completedSteps: text("completed_steps").array().default(sql`ARRAY[]::text[]`),
  hasSeenWelcome: boolean("has_seen_welcome").default(false),
  hasCompletedTour: boolean("has_completed_tour").default(false),
  hasSetupProfile: boolean("has_setup_profile").default(false),
  hasViewedFirstMatch: boolean("has_viewed_first_match").default(false),
  hasCreatedFirstGoal: boolean("has_created_first_goal").default(false),
  hasSentFirstMessage: boolean("has_sent_first_message").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
