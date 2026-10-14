import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import AuditLog, {
  AuditActorRole,
  AuditActorType,
  AuditCategory,
  AuditChannel,
  AuditError,
  AuditEventStatus,
  AuditMetadata,
  AuditNavigation,
  AuditResource,
  AuditSeverity,
} from "../models/AuditLog";
import logger from "../config/logger";
import env from "../config/env";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(req: Request): string | null {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

function detectChannel(req: Request): AuditChannel {
  const ua = (req.headers["user-agent"] ?? "").toLowerCase();
  const ch = (req.headers["x-channel"] ?? "").toString().toUpperCase() as AuditChannel;
  if (["WEB", "MOBILE", "API", "INTERNAL", "WEBHOOK", "SCHEDULER"].includes(ch)) return ch;
  if (/mobile|android|iphone|ipad/.test(ua)) return "MOBILE";
  if (!ua || ua.includes("curl") || ua.includes("postman") || ua.includes("httpie")) return "API";
  return "WEB";
}

function severityFromStatus(status: AuditEventStatus, httpCode?: number | null): AuditSeverity {
  if (status === "FAILED" || status === "REJECTED" || status === "DENIED") {
    if (httpCode && httpCode >= 500) return "ERROR";
    return "WARNING";
  }
  return "INFO";
}

// ─── Public params interface ───────────────────────────────────────────────────

export interface WriteAuditLogParams {
  req: Request;

  // Event
  category:    AuditCategory;
  action:      string;          // e.g. "LOGIN", "KYC_APPROVED", "LOAN_DISBURSED"
  eventType:   string;          // e.g. "USER_ACTIVITY", "ADMIN_ACTION", "SYSTEM_ERROR"
  status:      AuditEventStatus;
  severity?:   AuditSeverity;   // auto-derived from status if omitted
  message:     string;

  // Actor overrides (auto-read from req.user if omitted)
  actorType?:  AuditActorType;
  actorName?:  string;
  actorEmail?: string;

  // Resource / entity
  entityType?:  string;
  entityId?:    string;
  resource?:    AuditResource;

  // Navigation
  navigation?: AuditNavigation;

  // Response (auto-read from res.locals if omitted)
  httpStatusCode?: number;
  durationMs?:     number;

  // Error details (only for failed/error events)
  error?: Partial<AuditError>;

  // Free-form metadata
  metadata?: AuditMetadata;
}

// ─── Core writer ───────────────────────────────────────────────────────────────

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const {
      req,
      category, action, eventType, status, message,
      actorType, actorName, actorEmail,
      entityType, entityId, resource, navigation,
      httpStatusCode, durationMs,
      error: errorInfo,
      metadata,
    } = params;

    const severity = params.severity ?? severityFromStatus(status, httpStatusCode);

    // ── Actor ──────────────────────────────────────────────────────────────────
    const actorId   = req.user?.userId ?? null;
    const actorRole = (req.user?.roles?.[0]?.toLowerCase() ?? "system") as AuditActorRole;
    const resolvedActorType: AuditActorType = actorType ?? (actorId ? "USER" : "SYSTEM");

    // ── Request ────────────────────────────────────────────────────────────────
    const ip        = getClientIp(req);
    const channel   = detectChannel(req);
    const requestId = req.requestId ?? uuidv4();
    const correlationId = (req.headers["x-correlation-id"] as string | undefined) ?? null;
    const traceId       = (req.headers["x-trace-id"]       as string | undefined) ?? null;

    // ── Response ───────────────────────────────────────────────────────────────
    const statusCode = httpStatusCode ?? null;
    const duration   = durationMs ?? null;

    // ── Error ──────────────────────────────────────────────────────────────────
    const errorObj = errorInfo
      ? {
          code:       errorInfo.code       ?? null,
          type:       errorInfo.type       ?? null,
          message:    errorInfo.message    ?? null,
          exception:  errorInfo.exception  ?? null,
          stackTrace: errorInfo.stackTrace ?? null,
          retryable:  errorInfo.retryable  ?? false,
        }
      : null;

    await AuditLog.create({
      // Denormalised indexed columns
      category,
      action,
      eventStatus:   status,
      severity,
      actorId,
      actorRole,
      method:        req.method ?? null,
      path:          req.originalUrl ?? req.path ?? null,
      statusCode,
      ipAddress:     ip,
      requestId,
      correlationId,
      traceId,
      entityType:    entityType ?? null,
      entityId:      entityId   ?? null,

      // JSONB columns
      event: {
        category,
        action,
        type:     eventType,
        status,
        severity,
        message,
      },
      actor: {
        type:  resolvedActorType,
        id:    actorId,
        name:  actorName  ?? null,
        email: actorEmail ?? null,
        role:  actorRole,
      },
      request: {
        requestId,
        correlationId,
        traceId,
        method:    req.method,
        path:      req.originalUrl ?? req.path,
        ipAddress: ip,
        userAgent: req.headers["user-agent"]?.slice(0, 500) ?? null,
        channel,
      },
      location:    req.geoLocation ?? null,
      application: {
        service:     process.env.SERVICE_NAME ?? "skulcredit-api",
        module:      category,
        version:     process.env.npm_package_version ?? "1.0.0",
        environment: env.nodeEnv.toUpperCase(),
        server:      process.env.HOSTNAME ?? null,
      },
      resource: resource ?? (entityType ? { type: entityType, id: entityId ?? null } : null),
      navigation: navigation ?? null,
      response: {
        statusCode: statusCode ?? 0,
        status,
        durationMs: duration,
      },
      error:    errorObj,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // Audit logging must never crash the main request flow
    logger.warn("auditLogger: failed to write audit log", { err, action: params.action });
  }
}

// ─── Convenience helpers ───────────────────────────────────────────────────────

/** Quick success log — shorthand for common admin actions */
export async function auditSuccess(
  req: Request,
  category: AuditCategory,
  action: string,
  message: string,
  extras?: Partial<WriteAuditLogParams>,
): Promise<void> {
  return writeAuditLog({
    req,
    category,
    action,
    eventType: "ADMIN_ACTION",
    status: "SUCCESS",
    severity: "INFO",
    message,
    ...extras,
  });
}

/** Quick failure log */
export async function auditFailure(
  req: Request,
  category: AuditCategory,
  action: string,
  message: string,
  error?: Partial<AuditError>,
  extras?: Partial<WriteAuditLogParams>,
): Promise<void> {
  return writeAuditLog({
    req,
    category,
    action,
    eventType: "SYSTEM_ERROR",
    status: "FAILED",
    severity: "ERROR",
    message,
    error,
    ...extras,
  });
}
