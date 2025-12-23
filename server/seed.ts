import { db } from "./db";
import { users, applicationQuestions } from "@shared/schema";
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

  // Seed default application questions
  console.log("\nSeeding default application questions...");
  
  const competencyAreas = [
    "Clinical Practice & Patient Care",
    "Research & Evidence-Based Practice",
    "Leadership & Management",
    "Education & Teaching",
    "Technology & Innovation",
    "Healthcare Policy & Advocacy",
    "Quality Improvement",
    "Cultural Competency",
    "Communication & Collaboration",
    "Professional Development",
    "Entrepreneurship & Business"
  ];

  const defaultQuestions = [
    // BOTH roles - General Information
    { questionText: "Please provide a brief professional background and bio.", questionType: "TEXTAREA", forRole: "BOTH", section: "General Information", sortOrder: 1, isRequired: true, helpText: "Share your professional journey and current role" },
    { questionText: "How many years of nursing experience do you have?", questionType: "SELECT", forRole: "BOTH", section: "General Information", sortOrder: 2, isRequired: true, options: ["0-2 years", "3-5 years", "6-10 years", "11-15 years", "16-20 years", "20+ years"] },
    { questionText: "What is your current organization and role?", questionType: "TEXT", forRole: "BOTH", section: "General Information", sortOrder: 3, isRequired: true },
    { questionText: "Which languages do you speak fluently?", questionType: "MULTISELECT", forRole: "BOTH", section: "General Information", sortOrder: 4, isRequired: true, options: ["English", "Spanish", "Portuguese", "French", "Mandarin", "Other"], helpText: "Language matching is critical for effective mentorship" },
    { questionText: "What are your preferred meeting times?", questionType: "MULTISELECT", forRole: "BOTH", section: "Availability", sortOrder: 5, isRequired: true, options: ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekend mornings", "Weekend afternoons", "Weekend evenings"] },
    { questionText: "What is your preferred communication method?", questionType: "SELECT", forRole: "BOTH", section: "Availability", sortOrder: 6, isRequired: true, options: ["Video call", "Phone call", "In-person", "Email", "Messaging"] },
    { questionText: "Which track interests you most?", questionType: "SELECT", forRole: "BOTH", section: "Track Selection", sortOrder: 7, isRequired: true, options: ["Scientist - Research & Evidence", "Innovator - Technology & Change", "Entrepreneur - Starting Ventures", "Intrapreneur - Innovating Within Organizations", "Leader - Management & Influence"], helpText: "Select the track that best aligns with your goals" },
    { questionText: "Briefly describe your goals for this mentorship program.", questionType: "TEXTAREA", forRole: "BOTH", section: "Goals", sortOrder: 8, isRequired: true, helpText: "What do you hope to achieve through this mentorship?" },

    // MENTOR-specific questions
    { questionText: "Rate your expertise in each competency area (1-5):", questionType: "RATING", forRole: "MENTOR", section: "Expertise", sortOrder: 10, isRequired: true, options: competencyAreas, helpText: "1 = Beginner, 5 = Expert" },
    { questionText: "Describe your previous mentoring experience.", questionType: "TEXTAREA", forRole: "MENTOR", section: "Experience", sortOrder: 11, isRequired: false, helpText: "Include formal and informal mentoring relationships" },
    { questionText: "How many mentees can you support in this cohort?", questionType: "SELECT", forRole: "MENTOR", section: "Capacity", sortOrder: 12, isRequired: true, options: ["1 mentee", "2 mentees", "3 mentees"] },
    { questionText: "What mentoring style best describes you?", questionType: "SELECT", forRole: "MENTOR", section: "Style", sortOrder: 13, isRequired: true, options: ["Directive - Provides specific guidance and direction", "Collaborative - Works alongside mentee as partner", "Facilitative - Asks questions to guide self-discovery", "Supportive - Provides encouragement and emotional support", "Mixed - Adapts style to mentee needs"] },
    { questionText: "What areas are you most excited to mentor in?", questionType: "MULTISELECT", forRole: "MENTOR", section: "Focus Areas", sortOrder: 14, isRequired: true, options: competencyAreas },

    // MENTEE-specific questions
    { questionText: "What is your current career stage?", questionType: "SELECT", forRole: "MENTEE", section: "Career Stage", sortOrder: 20, isRequired: true, options: ["Pre-licensure (Student)", "Early-career (0-3 years)", "Mid-career (4-10 years)", "Experienced (11-20 years)", "Late-career (20+ years)", "Career transition"] },
    { questionText: "Rate your interest in developing each competency area (1-5):", questionType: "RATING", forRole: "MENTEE", section: "Development Interests", sortOrder: 21, isRequired: true, options: competencyAreas, helpText: "1 = Low interest, 5 = High interest" },
    { questionText: "What specific challenges are you currently facing in your career?", questionType: "TEXTAREA", forRole: "MENTEE", section: "Challenges", sortOrder: 22, isRequired: true },
    { questionText: "What do you hope to gain from this mentorship?", questionType: "TEXTAREA", forRole: "MENTEE", section: "Expectations", sortOrder: 23, isRequired: true },
    { questionText: "What characteristics are you looking for in a mentor?", questionType: "MULTISELECT", forRole: "MENTEE", section: "Preferences", sortOrder: 24, isRequired: true, options: ["Similar professional background", "Different professional background (for new perspectives)", "Same language/culture", "Industry connections", "Research experience", "Leadership experience", "Entrepreneurial experience", "Strong listener", "Direct communicator"] },

    // Terms and conditions
    { questionText: "I agree to commit to regular meetings and active participation in the mentorship program.", questionType: "CHECKBOX", forRole: "BOTH", section: "Agreement", sortOrder: 30, isRequired: true },
    { questionText: "I agree to maintain confidentiality regarding discussions with my mentor/mentee.", questionType: "CHECKBOX", forRole: "BOTH", section: "Agreement", sortOrder: 31, isRequired: true },
    { questionText: "Please upload your resume or CV (optional).", questionType: "FILE", forRole: "BOTH", section: "Documents", sortOrder: 32, isRequired: false, helpText: "Accepted formats: PDF, DOC, DOCX" },
  ];

  for (const question of defaultQuestions) {
    try {
      const existing = await db.select().from(applicationQuestions).where(
        eq(applicationQuestions.questionText, question.questionText)
      );
      
      if (existing.length === 0) {
        await db.insert(applicationQuestions).values({
          ...question,
          isDefault: true,
          questionType: question.questionType as any,
          forRole: question.forRole as any,
          options: question.options ? question.options : null,
        });
        console.log(`Created question: ${question.questionText.substring(0, 50)}...`);
      } else {
        console.log(`Question already exists: ${question.questionText.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`Error creating question:`, error);
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
