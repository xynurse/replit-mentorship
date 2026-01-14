import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole, registerSchema, completeProfileSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many password reset attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user!.role as UserRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

let sessionMiddleware: ReturnType<typeof session> | null = null;

export function getSessionMiddleware() {
  return sessionMiddleware;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "sonsiel-mentorship-hub-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  };

  sessionMiddleware = session(sessionSettings);

  app.set("trust proxy", 1);
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const normalizedEmail = email.toLowerCase().trim();
          console.log(`[LOGIN DEBUG] Attempting login for email: "${normalizedEmail}" (original: "${email}")`);
          
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`[LOGIN DEBUG] FAILED - User not found for email: "${normalizedEmail}"`);
            return done(null, false, { message: "Invalid email or password" });
          }
          
          console.log(`[LOGIN DEBUG] User found: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
          console.log(`[LOGIN DEBUG] Account status - isActive: ${user.isActive}, lockedUntil: ${user.lockedUntil}, failedAttempts: ${user.failedLoginAttempts}`);
          console.log(`[LOGIN DEBUG] Password hash exists: ${!!user.password}, hash length: ${user.password?.length || 0}`);

          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesRemaining = Math.ceil(
              (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
            );
            console.log(`[LOGIN DEBUG] FAILED - Account locked for ${minutesRemaining} more minutes`);
            return done(null, false, { 
              message: `Account locked. Try again in ${minutesRemaining} minutes.` 
            });
          }

          if (!user.isActive) {
            console.log(`[LOGIN DEBUG] FAILED - Account is deactivated`);
            return done(null, false, { message: "Account is deactivated" });
          }

          const isValid = await comparePasswords(password, user.password);
          console.log(`[LOGIN DEBUG] Password comparison result: ${isValid}`);
          
          if (!isValid) {
            console.log(`[LOGIN DEBUG] FAILED - Invalid password for user: ${user.email}`);
            await storage.incrementFailedLoginAttempts(user.id);
            
            const updatedUser = await storage.getUser(user.id);
            if (updatedUser && updatedUser.failedLoginAttempts && updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
              const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
              await storage.lockAccount(user.id, lockUntil);
              console.log(`[LOGIN DEBUG] Account locked due to too many failed attempts`);
              return done(null, false, { 
                message: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.` 
              });
            }
            
            return done(null, false, { message: "Invalid email or password" });
          }

          console.log(`[LOGIN DEBUG] SUCCESS - Login successful for: ${user.email}`);
          await storage.resetFailedLoginAttempts(user.id);
          await storage.updateUser(user.id, { lastLoginAt: new Date() });

          return done(null, user);
        } catch (error) {
          console.error(`[LOGIN DEBUG] ERROR - Exception during login:`, error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", authRateLimiter, async (req, res, next) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: validation.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password, firstName, lastName, role } = validation.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      if (role !== "MENTOR" && role !== "MENTEE") {
        return res.status(400).json({ message: "Invalid role selection" });
      }

      const hashedPassword = await hashPassword(password);
      const verificationToken = generateToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isVerified: true,
        isActive: true,
        isProfileComplete: false,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        const { password: _, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", authRateLimiter, (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      const maxAge = req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      req.session.cookie.maxAge = maxAge;

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const { password: _, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  app.post("/api/forgot-password", passwordResetRateLimiter, async (req, res, next) => {
    try {
      const { email } = req.body;
      console.log(`[PASSWORD RESET DEBUG] Reset requested for email: "${email}"`);
      
      if (!email) {
        console.log(`[PASSWORD RESET DEBUG] FAILED - No email provided`);
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      console.log(`[PASSWORD RESET DEBUG] User found: ${!!user}`);
      
      // Always return success to prevent email enumeration attacks
      res.json({ message: "If an account exists, a password reset email has been sent." });

      if (user) {
        console.log(`[PASSWORD RESET DEBUG] Processing reset for user: ${user.firstName} ${user.lastName} (${user.email})`);
        
        const resetToken = generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

        await storage.updateUser(user.id, {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        });
        console.log(`[PASSWORD RESET DEBUG] Reset token saved to database, expires: ${resetExpires.toISOString()}`);

        // Use production URL for password reset emails
        const resetUrl = `https://mentorship.sonsiel.org/reset-password/${resetToken}`;
        console.log(`[PASSWORD RESET DEBUG] Reset URL generated: ${resetUrl}`);

        // Send the password reset email
        const emailResult = await sendPasswordResetEmail({
          email: user.email,
          firstName: user.firstName,
          resetUrl,
        });

        if (!emailResult.success) {
          console.error(`[PASSWORD RESET DEBUG] FAILED - Email send error for ${email}:`, emailResult.error);
        } else {
          console.log(`[PASSWORD RESET DEBUG] SUCCESS - Password reset email sent to ${email}`);
        }
      } else {
        console.log(`[PASSWORD RESET DEBUG] No user found for email: "${email}" - no email sent`);
      }
    } catch (error) {
      console.error(`[PASSWORD RESET DEBUG] ERROR - Exception:`, error);
      next(error);
    }
  });

  app.post("/api/reset-password", passwordResetRateLimiter, async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(password);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/verify-email/:token", async (req, res, next) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      await storage.updateUser(user.id, {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/complete-profile", requireAuth, async (req, res, next) => {
    try {
      const validation = completeProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: validation.error.errors[0]?.message || "Invalid input" 
        });
      }

      const updatedUser = await storage.updateUser(req.user!.id, {
        ...validation.data,
        isProfileComplete: true,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });
}
