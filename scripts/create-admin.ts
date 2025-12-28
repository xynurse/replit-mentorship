import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

function generateSecurePassword(): string {
  return randomBytes(16).toString("base64").replace(/[^a-zA-Z0-9]/g, "") + "!Aa1";
}

async function createAdminAccount() {
  const email = process.env.ADMIN_EMAIL || "xyrn@outlook.com";
  const password = process.env.ADMIN_PASSWORD || generateSecurePassword();
  
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating to ADMIN role...`);
      await db.update(users)
        .set({ 
          role: "ADMIN",
          isVerified: true,
          isActive: true,
        })
        .where(eq(users.email, email));
      console.log("User updated to ADMIN role successfully.");
    } else {
      const hashedPassword = await hashPassword(password);
      
      await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName: "SONSIEL",
        lastName: "Admin",
        role: "ADMIN",
        isVerified: true,
        isActive: true,
        isProfileComplete: false,
      });
      
      console.log(`Admin account created successfully for ${email}`);
      console.log("IMPORTANT: Use the 'Forgot Password' flow to set your password securely.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error);
    process.exit(1);
  }
}

createAdminAccount();
