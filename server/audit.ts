import { Request } from "express";
import { storage } from "./storage";
import { type InsertAuditLog, type AuditAction, type AuditActorType, type AuditResourceType } from "@shared/schema";

interface AuditContext {
  actorId?: string | null;
  actorType?: AuditActorType;
  actorEmail?: string | null;
  actorRole?: string | null;
  impersonatorId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string;
  sessionId?: string;
}

interface AuditLogParams {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

function calculateChangedFields(before?: Record<string, any>, after?: Record<string, any>): string[] {
  if (!before || !after) return [];
  
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

function extractContextFromRequest(req: Request): AuditContext {
  const user = req.user as any;
  return {
    actorId: user?.id || null,
    actorType: user ? 'USER' : 'SYSTEM',
    actorEmail: user?.email || null,
    actorRole: user?.role || null,
    impersonatorId: (req.session as any)?.impersonatorId || null,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    requestId: (req as any).requestId,
    sessionId: req.sessionID,
  };
}

export class AuditService {
  private context: AuditContext;

  constructor(contextOrRequest?: AuditContext | Request) {
    if (!contextOrRequest) {
      this.context = { actorType: 'SYSTEM' };
    } else if ('headers' in contextOrRequest) {
      this.context = extractContextFromRequest(contextOrRequest as Request);
    } else {
      this.context = contextOrRequest as AuditContext;
    }
  }

  async log(params: AuditLogParams): Promise<void> {
    try {
      const changedFields = calculateChangedFields(params.previousState, params.newState);
      
      const auditLog: InsertAuditLog = {
        actorId: this.context.actorId,
        actorType: this.context.actorType || 'USER',
        actorEmail: this.context.actorEmail,
        actorRole: this.context.actorRole,
        impersonatorId: this.context.impersonatorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        previousState: params.previousState,
        newState: params.newState,
        changedFields: changedFields.length > 0 ? changedFields : null,
        ipAddress: this.context.ipAddress,
        userAgent: this.context.userAgent,
        requestId: this.context.requestId,
        sessionId: this.context.sessionId,
        success: params.success !== false,
        errorMessage: params.errorMessage,
        metadata: params.metadata,
      };

      await storage.createAuditLog(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async logWithDiff(params: {
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId: string;
    resourceName?: string;
    before: Record<string, any>;
    after: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    return this.log({
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      previousState: params.before,
      newState: params.after,
      metadata: params.metadata,
    });
  }

  static fromRequest(req: Request): AuditService {
    return new AuditService(req);
  }

  static system(): AuditService {
    return new AuditService({ actorType: 'SYSTEM' });
  }

  static api(): AuditService {
    return new AuditService({ actorType: 'API' });
  }

  static scheduledJob(): AuditService {
    return new AuditService({ actorType: 'SCHEDULED_JOB' });
  }
}

export function createAuditMiddleware() {
  return (req: Request, res: any, next: any) => {
    (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (req as any).audit = AuditService.fromRequest(req);
    next();
  };
}

export function maskSensitiveData(data: Record<string, any>, fieldsToMask: string[] = ['password', 'token', 'secret', 'key']): Record<string, any> {
  const masked = { ...data };
  for (const field of fieldsToMask) {
    if (masked[field]) {
      masked[field] = '[REDACTED]';
    }
  }
  return masked;
}
