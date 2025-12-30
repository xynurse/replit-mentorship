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

async function resetPassword() {
  const email = "xyrn@outlook.com";
  const newPassword = "Admin123!";
  
  const hashedPassword = await hashPassword(newPassword);
  
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));
  
  console.log("Password reset successfully for", email);
  console.log("New password: Admin123!");
  process.exit(0);
}

resetPassword().catch(err => {
  console.error(err);
  process.exit(1);
});
