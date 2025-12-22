import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
