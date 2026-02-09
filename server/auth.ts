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
import { AuditService } from "./audit";

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
            const systemAudit = AuditService.system();
            await systemAudit.log({
              action: 'LOGIN_FAILED',
              resourceType: 'USER',
              resourceName: normalizedEmail,
              success: false,
              errorMessage: 'User not found',
              metadata: { attemptedEmail: normalizedEmail },
            });
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
            const lockAudit = new AuditService({ actorId: user.id, actorType: 'USER', actorEmail: user.email, actorRole: user.role });
            await lockAudit.log({
              action: 'LOGIN_FAILED',
              resourceType: 'USER',
              resourceId: user.id,
              resourceName: user.email,
              success: false,
              errorMessage: `Account locked for ${minutesRemaining} more minutes`,
            });
            return done(null, false, { 
              message: `Account locked. Try again in ${minutesRemaining} minutes.` 
            });
          }

          if (!user.isActive) {
            console.log(`[LOGIN DEBUG] FAILED - Account is deactivated`);
            const inactiveAudit = new AuditService({ actorId: user.id, actorType: 'USER', actorEmail: user.email, actorRole: user.role });
            await inactiveAudit.log({
              action: 'LOGIN_FAILED',
              resourceType: 'USER',
              resourceId: user.id,
              resourceName: user.email,
              success: false,
              errorMessage: 'Account is deactivated',
            });
            return done(null, false, { message: "Account is deactivated" });
          }

          const isValid = await comparePasswords(password, user.password);
          console.log(`[LOGIN DEBUG] Password comparison result: ${isValid}`);
          
          if (!isValid) {
            console.log(`[LOGIN DEBUG] FAILED - Invalid password for user: ${user.email}`);
            await storage.incrementFailedLoginAttempts(user.id);
            
            const userAudit = new AuditService({ actorId: user.id, actorType: 'USER', actorEmail: user.email, actorRole: user.role });
            
            const updatedUser = await storage.getUser(user.id);
            if (updatedUser && updatedUser.failedLoginAttempts && updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
              const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
              await storage.lockAccount(user.id, lockUntil);
              console.log(`[LOGIN DEBUG] Account locked due to too many failed attempts`);
              await userAudit.log({
                action: 'ACCOUNT_LOCKED',
                resourceType: 'USER',
                resourceId: user.id,
                resourceName: user.email,
                metadata: { reason: 'Too many failed login attempts', lockedUntil: lockUntil.toISOString(), failedAttempts: updatedUser.failedLoginAttempts },
              });
              return done(null, false, { 
                message: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.` 
              });
            }
            
            await userAudit.log({
              action: 'LOGIN_FAILED',
              resourceType: 'USER',
              resourceId: user.id,
              resourceName: user.email,
              success: false,
              errorMessage: 'Invalid password',
              metadata: { failedAttempts: updatedUser?.failedLoginAttempts || 1 },
            });
            
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

      req.login(user, async (err) => {
        if (err) return next(err);
        
        const audit = AuditService.fromRequest(req);
        await audit.log({
          action: 'USER_CREATED',
          resourceType: 'USER',
          resourceId: user.id,
          resourceName: user.email,
          metadata: { role, firstName, lastName, registrationMethod: 'self' },
        });
        
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

      req.login(user, async (err) => {
        if (err) return next(err);
        const audit = AuditService.fromRequest(req);
        await audit.log({
          action: 'LOGIN_SUCCESS',
          resourceType: 'USER',
          resourceId: user.id,
          resourceName: user.email,
          metadata: { rememberMe: !!req.body.rememberMe },
        });
        const { password: _, ...safeUser } = user;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const user = req.user;
    if (user) {
      const audit = AuditService.fromRequest(req);
      await audit.log({
        action: 'LOGOUT',
        resourceType: 'USER',
        resourceId: user.id,
        resourceName: user.email,
      });
    }
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
      
      if (user) {
        console.log(`[PASSWORD RESET DEBUG] Processing reset for user: ${user.firstName} ${user.lastName} (${user.email})`);
        
        const resetToken = generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

        await storage.updateUser(user.id, {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        });
        console.log(`[PASSWORD RESET DEBUG] Reset token saved to database, expires: ${resetExpires.toISOString()}`);

        const resetUrl = `https://mentorship.sonsiel.org/reset-password/${resetToken}`;
        console.log(`[PASSWORD RESET DEBUG] Reset URL generated: ${resetUrl}`);

        const audit = new AuditService({ actorId: user.id, actorType: 'USER', actorEmail: user.email, actorRole: user.role, ipAddress: req.headers['x-forwarded-for']?.toString()?.split(',')[0]?.trim() || req.socket?.remoteAddress || null, userAgent: req.headers['user-agent'] || null });
        await audit.log({
          action: 'PASSWORD_RESET_REQUESTED',
          resourceType: 'USER',
          resourceId: user.id,
          resourceName: user.email,
        });

        try {
          const emailResult = await sendPasswordResetEmail({
            email: user.email,
            firstName: user.firstName,
            resetUrl,
          });

          if (!emailResult.success) {
            console.error(`[PASSWORD RESET DEBUG] FAILED - Email send error for ${email}:`, emailResult.error);
            return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
          }
          
          await audit.log({
            action: 'EMAIL_SENT',
            resourceType: 'USER',
            resourceId: user.id,
            resourceName: user.email,
            metadata: { emailType: 'password_reset', recipient: user.email },
          });
          
          console.log(`[PASSWORD RESET DEBUG] SUCCESS - Password reset email sent to ${email}`);
        } catch (emailError: any) {
          console.error(`[PASSWORD RESET DEBUG] EXCEPTION - Email send error for ${email}:`, emailError.message);
          return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
        }
      } else {
        console.log(`[PASSWORD RESET DEBUG] No user found for email: "${email}" - no email sent`);
      }
      
      // Always return success message to prevent email enumeration
      // But we've already handled real errors above
      res.json({ message: "If an account exists, a password reset email has been sent." });
    } catch (error) {
      console.error(`[PASSWORD RESET DEBUG] ERROR - Exception:`, error);
      next(error);
    }
  });

  app.post("/api/reset-password", passwordResetRateLimiter, async (req, res, next) => {
    try {
      const { token, password } = req.body;
      console.log(`[RESET PASSWORD DEBUG] Attempting to reset password with token: ${token ? token.substring(0, 10) + '...' : 'missing'}`);
      
      if (!token || !password) {
        console.log(`[RESET PASSWORD DEBUG] FAILED - Token or password missing. Token: ${!!token}, Password: ${!!password}`);
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        console.log(`[RESET PASSWORD DEBUG] FAILED - Password too short (${password.length} chars)`);
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByPasswordResetToken(token);
      console.log(`[RESET PASSWORD DEBUG] User found by token: ${!!user}`);
      
      if (!user) {
        console.log(`[RESET PASSWORD DEBUG] FAILED - Invalid or expired reset token`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log(`[RESET PASSWORD DEBUG] Resetting password for user: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`[RESET PASSWORD DEBUG] Token expires: ${user.passwordResetExpires}, Current time: ${new Date().toISOString()}`);

      const hashedPassword = await hashPassword(password);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const audit = new AuditService({ actorId: user.id, actorType: 'USER', actorEmail: user.email, actorRole: user.role, ipAddress: req.headers['x-forwarded-for']?.toString()?.split(',')[0]?.trim() || req.socket?.remoteAddress || null, userAgent: req.headers['user-agent'] || null });
      await audit.log({
        action: 'PASSWORD_RESET_COMPLETED',
        resourceType: 'USER',
        resourceId: user.id,
        resourceName: user.email,
      });

      console.log(`[RESET PASSWORD DEBUG] SUCCESS - Password reset completed for ${user.email}`);
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error(`[RESET PASSWORD DEBUG] ERROR - Exception:`, error);
      next(error);
    }
  });

  // Endpoint for forced password change (first login with temporary password)
  app.post("/api/change-password", requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        mustChangePassword: false,
      });

      const audit = AuditService.fromRequest(req);
      await audit.log({
        action: 'PASSWORD_CHANGED',
        resourceType: 'USER',
        resourceId: user.id,
        resourceName: user.email,
        metadata: { mustChangePassword: !!user.mustChangePassword },
      });

      console.log(`[CHANGE PASSWORD] SUCCESS - Password changed for ${user.email}`);
      
      // Log the user out so they can log in fresh with their new password
      req.logout((err) => {
        if (err) {
          console.error(`[CHANGE PASSWORD] Logout error:`, err);
        }
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error(`[CHANGE PASSWORD] Session destroy error:`, sessionErr);
          }
          res.clearCookie("connect.sid");
          res.json({ message: "Password changed successfully. Please log in with your new password." });
        });
      });
    } catch (error) {
      console.error(`[CHANGE PASSWORD] ERROR:`, error);
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

      const audit = new AuditService({ actorId: user.id, actorType: 'USER', actorEmail: user.email, actorRole: user.role });
      await audit.log({
        action: 'EMAIL_VERIFICATION',
        resourceType: 'USER',
        resourceId: user.id,
        resourceName: user.email,
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
