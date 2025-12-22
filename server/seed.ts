import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const superAdminPassword = await hashPassword("SuperAdmin123!");
  const adminPassword = await hashPassword("Admin123!");
  const mentorPassword = await hashPassword("Mentor123!");
  const menteePassword = await hashPassword("Mentee123!");

  const seedUsers = [
    {
      email: "superadmin@sonsiel.org",
      password: superAdminPassword,
      firstName: "System",
      lastName: "Administrator",
      role: "SUPER_ADMIN" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "SONSIEL",
      jobTitle: "Platform Administrator",
      bio: "Platform administrator for SONSIEL Mentorship Hub.",
      yearsOfExperience: 10,
      timezone: "America/New_York",
      preferredLanguage: "en",
      languagesSpoken: ["English"],
    },
    {
      email: "admin1@sonsiel.org",
      password: adminPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      role: "ADMIN" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "SONSIEL",
      jobTitle: "Program Coordinator",
      bio: "Program coordinator managing mentorship cohorts and user relationships.",
      yearsOfExperience: 8,
      timezone: "America/New_York",
      preferredLanguage: "en",
      languagesSpoken: ["English", "Spanish"],
    },
    {
      email: "admin2@sonsiel.org",
      password: adminPassword,
      firstName: "Michael",
      lastName: "Chen",
      role: "ADMIN" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "SONSIEL",
      jobTitle: "Community Manager",
      bio: "Community manager supporting mentors and mentees in their journey.",
      yearsOfExperience: 6,
      timezone: "America/Los_Angeles",
      preferredLanguage: "en",
      languagesSpoken: ["English", "Mandarin"],
    },
    {
      email: "mentor1@example.com",
      password: mentorPassword,
      firstName: "Dr. James",
      lastName: "Wilson",
      role: "MENTOR" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "Memorial Healthcare System",
      jobTitle: "Nurse Practitioner",
      bio: "Experienced nurse practitioner with 15 years in critical care. Passionate about mentoring the next generation of healthcare professionals.",
      yearsOfExperience: 15,
      timezone: "America/New_York",
      preferredLanguage: "en",
      languagesSpoken: ["English"],
      linkedInUrl: "https://linkedin.com/in/jameswilson",
    },
    {
      email: "mentor2@example.com",
      password: mentorPassword,
      firstName: "Dr. Ana",
      lastName: "Rodriguez",
      role: "MENTOR" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "Community Health Center",
      jobTitle: "Clinical Nurse Specialist",
      bio: "Bilingual healthcare leader specializing in community health. Dedicated to supporting nurses from diverse backgrounds.",
      yearsOfExperience: 12,
      timezone: "America/Chicago",
      preferredLanguage: "es",
      languagesSpoken: ["English", "Spanish", "Portuguese"],
      linkedInUrl: "https://linkedin.com/in/anarodriguez",
    },
    {
      email: "mentee1@example.com",
      password: menteePassword,
      firstName: "Maria",
      lastName: "Santos",
      role: "MENTEE" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "City General Hospital",
      jobTitle: "Registered Nurse",
      bio: "Recent nursing graduate eager to grow in pediatric care. Looking for guidance on career development and clinical skills.",
      yearsOfExperience: 2,
      timezone: "America/New_York",
      preferredLanguage: "pt",
      languagesSpoken: ["English", "Portuguese"],
    },
    {
      email: "mentee2@example.com",
      password: menteePassword,
      firstName: "Carlos",
      lastName: "Hernandez",
      role: "MENTEE" as const,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      organizationName: "Regional Medical Center",
      jobTitle: "Emergency Room Nurse",
      bio: "ER nurse with 3 years experience. Seeking mentorship to transition into nurse management.",
      yearsOfExperience: 3,
      timezone: "America/Denver",
      preferredLanguage: "es",
      languagesSpoken: ["English", "Spanish"],
    },
  ];

  for (const user of seedUsers) {
    try {
      const existing = await db.select().from(users).where(
        eq(users.email, user.email)
      );
      
      if (existing.length === 0) {
        await db.insert(users).values(user);
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }

  console.log("\nSeed completed!");
  console.log("\nTest Accounts:");
  console.log("==============");
  console.log("Super Admin: superadmin@sonsiel.org / SuperAdmin123!");
  console.log("Admin 1: admin1@sonsiel.org / Admin123!");
  console.log("Admin 2: admin2@sonsiel.org / Admin123!");
  console.log("Mentor 1: mentor1@example.com / Mentor123!");
  console.log("Mentor 2: mentor2@example.com / Mentor123!");
  console.log("Mentee 1: mentee1@example.com / Mentee123!");
  console.log("Mentee 2: mentee2@example.com / Mentee123!");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
