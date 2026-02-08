import { db } from "./db";
import { users, applicationQuestions, threadCategories, menteeThreadCategories, programs, programMemberships, documents, folders } from "@shared/schema";
import { hashPassword } from "./auth";
import { count, eq, inArray, and, isNull } from "drizzle-orm";

function seedLog(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [seed] ${message}`);
}

export async function autoSeedIfEmpty() {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    
    if (userCount.count > 0) {
      seedLog("Database already has users, skipping seed");
      return;
    }

    seedLog("Empty database detected, seeding initial data...");

    const superAdminPassword = await hashPassword("SuperAdmin123!");
    const adminPassword = await hashPassword("Admin123!");

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
        email: "admin@sonsiel.org",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
        isActive: true,
        isVerified: true,
        isProfileComplete: true,
        organizationName: "SONSIEL",
        jobTitle: "Program Coordinator",
        bio: "Program coordinator managing mentorship cohorts.",
        yearsOfExperience: 5,
        timezone: "America/New_York",
        preferredLanguage: "en",
        languagesSpoken: ["English"],
      },
    ];

    for (const user of seedUsers) {
      try {
        await db.insert(users).values(user);
        seedLog(`Created user: ${user.email} (${user.role})`);
      } catch (error) {
        seedLog(`Error creating user ${user.email}: ${error}`);
      }
    }

    await seedApplicationQuestions();

    seedLog("Database seeding completed!");
    seedLog("=== Default Login Credentials ===");
    seedLog("Super Admin: superadmin@sonsiel.org / SuperAdmin123!");
    seedLog("Admin: admin@sonsiel.org / Admin123!");

  } catch (error) {
    seedLog(`Auto-seed error: ${error}`);
  }
}

async function seedApplicationQuestions() {
  const [questionCount] = await db.select({ count: count() }).from(applicationQuestions);
  
  if (questionCount.count > 0) {
    seedLog("Application questions already exist, skipping");
    return;
  }

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
    { questionText: "Please provide a brief professional background and bio.", questionType: "TEXTAREA", forRole: "BOTH", section: "General Information", sortOrder: 1, isRequired: true, helpText: "Share your professional journey and current role" },
    { questionText: "How many years of nursing experience do you have?", questionType: "SELECT", forRole: "BOTH", section: "General Information", sortOrder: 2, isRequired: true, options: ["0-2 years", "3-5 years", "6-10 years", "11-15 years", "16-20 years", "20+ years"] },
    { questionText: "What is your current organization and role?", questionType: "TEXT", forRole: "BOTH", section: "General Information", sortOrder: 3, isRequired: true },
    { questionText: "Which languages do you speak fluently?", questionType: "MULTISELECT", forRole: "BOTH", section: "General Information", sortOrder: 4, isRequired: true, options: ["English", "Spanish", "Portuguese", "French", "Mandarin", "Other"], helpText: "Language matching is critical for effective mentorship" },
    { questionText: "What are your preferred meeting times?", questionType: "MULTISELECT", forRole: "BOTH", section: "Availability", sortOrder: 5, isRequired: true, options: ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekend mornings", "Weekend afternoons", "Weekend evenings"] },
    { questionText: "What is your preferred communication method?", questionType: "SELECT", forRole: "BOTH", section: "Availability", sortOrder: 6, isRequired: true, options: ["Video call", "Phone call", "In-person", "Email", "Messaging"] },
    { questionText: "Which track interests you most?", questionType: "SELECT", forRole: "BOTH", section: "Track Selection", sortOrder: 7, isRequired: true, options: ["Scientist - Research & Evidence", "Innovator - Technology & Change", "Entrepreneur - Starting Ventures", "Intrapreneur - Innovating Within Organizations", "Leader - Management & Influence"], helpText: "Select the track that best aligns with your goals" },
    { questionText: "Briefly describe your goals for this mentorship program.", questionType: "TEXTAREA", forRole: "BOTH", section: "Goals", sortOrder: 8, isRequired: true, helpText: "What do you hope to achieve through this mentorship?" },
    { questionText: "Rate your expertise in each competency area (1-5):", questionType: "RATING", forRole: "MENTOR", section: "Expertise", sortOrder: 10, isRequired: true, options: competencyAreas, helpText: "1 = Beginner, 5 = Expert" },
    { questionText: "Describe your previous mentoring experience.", questionType: "TEXTAREA", forRole: "MENTOR", section: "Experience", sortOrder: 11, isRequired: false, helpText: "Include formal and informal mentoring relationships" },
    { questionText: "How many mentees can you support in this cohort?", questionType: "SELECT", forRole: "MENTOR", section: "Capacity", sortOrder: 12, isRequired: true, options: ["1 mentee", "2 mentees", "3 mentees"] },
    { questionText: "What mentoring style best describes you?", questionType: "SELECT", forRole: "MENTOR", section: "Style", sortOrder: 13, isRequired: true, options: ["Directive - Provides specific guidance and direction", "Collaborative - Works alongside mentee as partner", "Facilitative - Asks questions to guide self-discovery", "Supportive - Provides encouragement and emotional support", "Mixed - Adapts style to mentee needs"] },
    { questionText: "What areas are you most excited to mentor in?", questionType: "MULTISELECT", forRole: "MENTOR", section: "Focus Areas", sortOrder: 14, isRequired: true, options: competencyAreas },
    { questionText: "What is your current career stage?", questionType: "SELECT", forRole: "MENTEE", section: "Career Stage", sortOrder: 20, isRequired: true, options: ["Pre-licensure (Student)", "Early-career (0-3 years)", "Mid-career (4-10 years)", "Experienced (11-20 years)", "Late-career (20+ years)", "Career transition"] },
    { questionText: "Rate your interest in developing each competency area (1-5):", questionType: "RATING", forRole: "MENTEE", section: "Development Interests", sortOrder: 21, isRequired: true, options: competencyAreas, helpText: "1 = Low interest, 5 = High interest" },
    { questionText: "What specific challenges are you currently facing in your career?", questionType: "TEXTAREA", forRole: "MENTEE", section: "Challenges", sortOrder: 22, isRequired: true },
    { questionText: "What do you hope to gain from this mentorship?", questionType: "TEXTAREA", forRole: "MENTEE", section: "Expectations", sortOrder: 23, isRequired: true },
    { questionText: "What characteristics are you looking for in a mentor?", questionType: "MULTISELECT", forRole: "MENTEE", section: "Preferences", sortOrder: 24, isRequired: true, options: ["Similar professional background", "Different professional background (for new perspectives)", "Same language/culture", "Industry connections", "Research experience", "Leadership experience", "Entrepreneurial experience", "Strong listener", "Direct communicator"] },
    { questionText: "I agree to commit to regular meetings and active participation in the mentorship program.", questionType: "CHECKBOX", forRole: "BOTH", section: "Agreement", sortOrder: 30, isRequired: true },
    { questionText: "I agree to maintain confidentiality regarding discussions with my mentor/mentee.", questionType: "CHECKBOX", forRole: "BOTH", section: "Agreement", sortOrder: 31, isRequired: true },
    { questionText: "Please upload your resume or CV (optional).", questionType: "FILE", forRole: "BOTH", section: "Documents", sortOrder: 32, isRequired: false, helpText: "Accepted formats: PDF, DOC, DOCX" },
  ];

  for (const question of defaultQuestions) {
    try {
      await db.insert(applicationQuestions).values({
        ...question,
        isDefault: true,
        questionType: question.questionType as any,
        forRole: question.forRole as any,
        options: question.options ? question.options : null,
      });
    } catch (error) {
      seedLog(`Error creating question: ${error}`);
    }
  }

  seedLog("Application questions seeded");
}

export async function ensureCommunityCategories() {
  try {
    const [mentorCatCount] = await db.select({ count: count() }).from(threadCategories);
    if (mentorCatCount.count === 0) {
      seedLog("Seeding mentor community categories...");
      const mentorCategories = [
        { name: "Best Practices", slug: "best-practices", description: "Share and discuss best practices in healthcare mentorship", color: "#0D9488", icon: "lightbulb", sortOrder: 1, isActive: true },
        { name: "Questions", slug: "questions", description: "Ask questions and get answers from the community", color: "#3B82F6", icon: "help-circle", sortOrder: 2, isActive: true },
        { name: "Resources", slug: "resources", description: "Share useful resources, articles, and tools", color: "#8B5CF6", icon: "book-open", sortOrder: 3, isActive: true },
        { name: "Track: Scientist", slug: "track-scientist", description: "Discussions specific to the Scientist track", color: "#10B981", icon: "flask-conical", sortOrder: 4, isActive: true },
        { name: "Track: Innovator", slug: "track-innovator", description: "Discussions specific to the Innovator track", color: "#F59E0B", icon: "sparkles", sortOrder: 5, isActive: true },
        { name: "Track: Entrepreneur", slug: "track-entrepreneur", description: "Discussions specific to the Entrepreneur track", color: "#EF4444", icon: "rocket", sortOrder: 6, isActive: true },
        { name: "Track: Intrapreneur", slug: "track-intrapreneur", description: "Discussions specific to the Intrapreneur track", color: "#6366F1", icon: "building", sortOrder: 7, isActive: true },
        { name: "Track: Leader", slug: "track-leader", description: "Discussions specific to the Leader track", color: "#EC4899", icon: "crown", sortOrder: 8, isActive: true },
        { name: "Mentoring Strategies", slug: "mentoring-strategies", description: "Discuss effective mentoring techniques and approaches", color: "#059669", icon: "compass", sortOrder: 9, isActive: true },
        { name: "Success Stories", slug: "success-stories", description: "Share mentoring success stories and outcomes", color: "#D97706", icon: "award", sortOrder: 10, isActive: true },
        { name: "Professional Development", slug: "professional-development", description: "Discuss continuing education and career growth topics", color: "#7C3AED", icon: "graduation-cap", sortOrder: 11, isActive: true },
        { name: "General Discussion", slug: "general", description: "General conversations and community building", color: "#6B7280", icon: "message-square", sortOrder: 12, isActive: true },
      ];
      for (const cat of mentorCategories) {
        try {
          await db.insert(threadCategories).values(cat);
        } catch (e) {}
      }
      seedLog(`Seeded ${mentorCategories.length} mentor community categories`);
    }

    const [menteeCatCount] = await db.select({ count: count() }).from(menteeThreadCategories);
    if (menteeCatCount.count === 0) {
      seedLog("Seeding mentee community categories...");
      const menteeCategories = [
        { name: "Introductions", slug: "introductions", description: "Introduce yourself to fellow mentees", color: "#6366F1", icon: "UserPlus", sortOrder: 1, isActive: true },
        { name: "Goal Setting & SMART Goals", slug: "goal-setting", description: "Discuss goal setting strategies and SMART goals", color: "#8B5CF6", icon: "Target", sortOrder: 2, isActive: true },
        { name: "Scientist Track", slug: "scientist-track", description: "Discussions for mentees on the Scientist track", color: "#10B981", icon: "Microscope", sortOrder: 3, isActive: true },
        { name: "Innovator Track", slug: "innovator-track", description: "Discussions for mentees on the Innovator track", color: "#F59E0B", icon: "Lightbulb", sortOrder: 4, isActive: true },
        { name: "Entrepreneur Track", slug: "entrepreneur-track", description: "Discussions for mentees on the Entrepreneur track", color: "#EF4444", icon: "Rocket", sortOrder: 5, isActive: true },
        { name: "Intrapreneur Track", slug: "intrapreneur-track", description: "Discussions for mentees on the Intrapreneur track", color: "#3B82F6", icon: "Building", sortOrder: 6, isActive: true },
        { name: "Leader Track", slug: "leader-track", description: "Discussions for mentees on the Leader track", color: "#EC4899", icon: "Crown", sortOrder: 7, isActive: true },
        { name: "Career Questions", slug: "career-questions", description: "Ask and answer career-related questions", color: "#14B8A6", icon: "Briefcase", sortOrder: 8, isActive: true },
        { name: "Resources & Recommendations", slug: "resources", description: "Share helpful resources and recommendations", color: "#0EA5E9", icon: "BookOpen", sortOrder: 9, isActive: true },
        { name: "Study Groups", slug: "study-groups", description: "Find and organize study groups with fellow mentees", color: "#A855F7", icon: "Users", sortOrder: 10, isActive: true },
        { name: "Wins & Celebrations", slug: "wins-celebrations", description: "Celebrate your achievements and milestones", color: "#F97316", icon: "Trophy", sortOrder: 11, isActive: true },
        { name: "General Discussion", slug: "general", description: "General discussions and off-topic conversations", color: "#6B7280", icon: "MessageCircle", sortOrder: 12, isActive: true },
      ];
      for (const cat of menteeCategories) {
        try {
          await db.insert(menteeThreadCategories).values(cat);
        } catch (e) {}
      }
      seedLog(`Seeded ${menteeCategories.length} mentee community categories`);
    }
  } catch (error) {
    seedLog(`Error seeding community categories: ${error}`);
  }
}

// Ensure specific required users exist (runs even when database has users)
export async function ensureRequiredUsers() {
  try {
    // Check if mentor@sonsiel.org exists
    const existingUser = await db.select().from(users).where(eq(users.email, "mentor@sonsiel.org")).limit(1);
    
    if (existingUser.length === 0) {
      const password = await hashPassword("SuperAdmin123!");
      await db.insert(users).values({
        email: "mentor@sonsiel.org",
        password,
        firstName: "Mentor",
        lastName: "Admin",
        role: "SUPER_ADMIN" as const,
        isActive: true,
        isVerified: true,
        isProfileComplete: true,
        mustChangePassword: true,
        organizationName: "SONSIEL",
        jobTitle: "Program Lead",
        bio: "SONSIEL Mentorship Program Lead.",
        yearsOfExperience: 10,
        timezone: "America/New_York",
        preferredLanguage: "en",
        languagesSpoken: ["English"],
      });
      seedLog("Created required user: mentor@sonsiel.org (SUPER_ADMIN)");
    } else {
      // Fix password if it's in wrong format (missing dot separator)
      const currentPassword = existingUser[0].password;
      if (currentPassword && !currentPassword.includes('.')) {
        const password = await hashPassword("SuperAdmin123!");
        await db.update(users)
          .set({ password, mustChangePassword: true })
          .where(eq(users.email, "mentor@sonsiel.org"));
        seedLog("Fixed password format for: mentor@sonsiel.org");
      }
    }
  } catch (error) {
    seedLog(`Error ensuring required users: ${error}`);
  }
}

export async function ensurePrograms() {
  try {
    const requiredPrograms = [
      {
        id: "prog_sonsiel_mentorship",
        name: "SONSIEL Mentorship Program",
        slug: "sonsiel-mentorship",
        description: "The flagship SONSIEL mentorship program connecting healthcare professionals for career development and growth.",
        isActive: true,
      },
      {
        id: "prog_nursehack4health",
        name: "SONSIEL NurseHack4Health",
        slug: "nursehack4health",
        description: "NurseHack4Health program fostering innovation and technology adoption in nursing practice.",
        isActive: true,
      },
    ];

    for (const prog of requiredPrograms) {
      const existing = await db.select().from(programs).where(eq(programs.id, prog.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(programs).values(prog);
        seedLog(`Created program: ${prog.name} (${prog.id})`);
      }
    }

    const adminUsers = await db.select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.role, ["SUPER_ADMIN", "ADMIN"]));

    const allPrograms = await db.select().from(programs);
    const allMemberships = await db.select().from(programMemberships);

    for (const user of adminUsers) {
      const userMemberships = allMemberships.filter(m => m.userId === user.id);
      for (const prog of allPrograms) {
        const alreadyEnrolled = userMemberships.some(m => m.programId === prog.id);
        if (!alreadyEnrolled) {
          const isFirst = userMemberships.length === 0;
          await db.insert(programMemberships).values({
            programId: prog.id,
            userId: user.id,
            role: "ADMIN",
            isDefault: isFirst,
          });
          seedLog(`Enrolled ${user.email} in program: ${prog.name}`);
        }
      }
    }

    seedLog("Programs ensured successfully");
  } catch (error) {
    seedLog(`Error ensuring programs: ${error}`);
  }
}

export async function ensurePublicDocumentsInSystemFolder() {
  try {
    const [systemFolder] = await db.select().from(folders).where(
      and(
        eq(folders.scope, "SYSTEM"),
        eq(folders.isSystemFolder, true),
        isNull(folders.parentFolderId)
      )
    );

    if (!systemFolder) {
      seedLog("No system folder found, skipping public document migration");
      return;
    }

    const subfolderConfigs = [
      { name: "Track Guides", description: "Guides for each mentorship track", icon: "book-open" },
      { name: "Mentorship Documents", description: "Handbooks, guides, and resources for the mentorship program", icon: "file-text" },
    ];

    const subfolderMap: Record<string, string> = {};
    for (const config of subfolderConfigs) {
      const [existing] = await db.select().from(folders).where(
        and(
          eq(folders.name, config.name),
          eq(folders.parentFolderId, systemFolder.id),
          eq(folders.scope, "SYSTEM")
        )
      );

      if (existing) {
        subfolderMap[config.name] = existing.id;
      } else {
        const [created] = await db.insert(folders).values({
          name: config.name,
          description: config.description,
          parentFolderId: systemFolder.id,
          scope: "SYSTEM",
          visibility: "PUBLIC",
          isSystemFolder: false,
          icon: config.icon,
        }).returning();
        subfolderMap[config.name] = created.id;
        seedLog(`Created system sub-folder: ${config.name}`);
      }
    }

    const publicDocs = await db.select().from(documents).where(eq(documents.visibility, "PUBLIC"));

    let movedCount = 0;
    for (const doc of publicDocs) {
      const currentFolder = doc.folderId
        ? await db.select().from(folders).where(eq(folders.id, doc.folderId)).then(r => r[0])
        : null;

      const isAlreadyInSystem = currentFolder?.scope === "SYSTEM";
      if (isAlreadyInSystem) continue;

      const isTrackGuide = doc.name.toLowerCase().includes("track") && doc.name.toLowerCase().includes("guide");
      const targetFolderName = isTrackGuide ? "Track Guides" : "Mentorship Documents";
      const targetFolderId = subfolderMap[targetFolderName];

      if (targetFolderId && doc.folderId !== targetFolderId) {
        await db.update(documents)
          .set({ folderId: targetFolderId })
          .where(eq(documents.id, doc.id));
        movedCount++;
        seedLog(`Moved public document "${doc.name}" to system folder "${targetFolderName}"`);
      }
    }

    if (movedCount > 0) {
      seedLog(`Moved ${movedCount} public documents to system folders`);
    } else {
      seedLog("All public documents already in system folders");
    }
  } catch (error) {
    seedLog(`Error ensuring public documents in system folder: ${error}`);
  }
}
