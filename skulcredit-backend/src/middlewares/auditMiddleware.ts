import { Request, Response, NextFunction } from "express";
import AuditLog, {
  AuditActorRole,
  AuditActorType,
  AuditCategory,
  AuditChannel,
  AuditEventStatus,
  AuditSeverity,
} from "../models/AuditLog";
import logger from "../config/logger";

const SKIP_PREFIXES = ["/metrics", "/api/v1/health", "/api/v1/docs", "/uploads", "/favicon.ico"];

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some(p => path.startsWith(p));
}

function classifyCategory(method: string, path: string): AuditCategory {
  const p = path.toLowerCase();
  if (p.includes("/auth/"))          return "AUTHENTICATION";
  if (p.includes("/admin/audit"))    return "SYSTEM";
  if (p.includes("/admin/support"))  return "SYSTEM";
  if (p.includes("/admin/kyc") || p.includes("/kyc") || p.includes("/parents") && p.includes("kyc")) return "KYC";
  if (p.includes("/admin/"))         return "ADMIN";
  if (p.includes("/payments") || p.includes("/pay")) return "PAYMENT";
  if (p.includes("/disbursements"))  return "TRANSACTION";
  if (p.includes("/repayments"))     return "TRANSACTION";
  if (p.includes("/loans") || p.includes("/loan-applications")) return "TRANSACTION";
  if (p.includes("/transfers"))      return "TRANSFER";
  if (p.includes("/notifications"))  return "NOTIFICATION";
  if (p.includes("/documents") || p.includes("/uploads")) return "FILE";
  if (p.includes("/users") || p.includes("/parents") || p.includes("/schools")) return "USER";
  if (p.includes("/reports"))        return "REPORT";
  return "API";
}

function classifyAction(method: string, path: string): string {
  const p = path.toLowerCase();

  // Auth
  if (p.includes("/auth/login"))           return "LOGIN";
  if (p.includes("/auth/logout"))          return "LOGOUT";
  if (p.includes("/auth/register"))        return "REGISTER";
  if (p.includes("/auth/refresh"))         return "TOKEN_REFRESH";
  if (p.includes("/auth/forgot"))          return "PASSWORD_RESET_REQUEST";
  if (p.includes("/auth/reset"))           return "PASSWORD_RESET";
  if (p.includes("/auth/verify"))          return "EMAIL_VERIFY";

  // KYC
  if (p.includes("/kyc") && method === "PATCH") return "KYC_UPDATE";
  if (p.includes("/kyc"))                  return "KYC_VIEW";

  switch (method) {
    case "GET":    return "READ";
    case "POST":   return "CREATE";
    case "PUT":    return "UPDATE";
    case "PATCH":  return "UPDATE";
    case "DELETE": return "DELETE";
    default:       return "API_REQUEST";
  }
}

function resolveEventStatus(httpStatus: number): AuditEventStatus {
  if (httpStatus < 400)  return "SUCCESS";
  if (httpStatus === 401 || httpStatus === 403) return "DENIED";
  if (httpStatus === 422 || httpStatus === 400) return "REJECTED";
  return "FAILED";
}

function resolveSeverity(httpStatus: number, status: AuditEventStatus): AuditSeverity {
  if (httpStatus >= 500)                      return "ERROR";
  if (status === "DENIED")                    return "WARNING";
  if (status === "REJECTED" || status === "FAILED") return "WARNING";
  return "INFO";
}

function detectChannel(req: Request): AuditChannel {
  const explicit = (req.headers["x-channel"] ?? "").toString().toUpperCase() as AuditChannel;
  if (["WEB", "MOBILE", "API", "INTERNAL", "WEBHOOK", "SCHEDULER"].includes(explicit)) return explicit;
  const ua = (req.headers["user-agent"] ?? "").toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) return "MOBILE";
  if (!ua || /curl|postman|httpie|insomnia/.test(ua)) return "API";
  return "WEB";
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (shouldSkip(req.path)) return next();

  res.on("finish", () => {
    void (async () => {
      try {
        const httpStatus    = res.statusCode;
        const durationMs    = req.startedAt
          ? Math.round(Number(process.hrtime.bigint() - req.startedAt) / 1e6)
          : null;

        const method        = req.method;
        const path          = req.originalUrl ?? req.path;
        const category      = classifyCategory(method, path);
        const action        = classifyAction(method, path);
        const eventStatus   = resolveEventStatus(httpStatus);
        const severity      = resolveSeverity(httpStatus, eventStatus);
        const channel       = detectChannel(req);

        const actorId       = req.user?.userId ?? null;
        const actorRole     = (req.user?.roles?.[0]?.toLowerCase() ?? "system") as AuditActorRole;
        const actorType: AuditActorType = actorId ? "USER" : "SYSTEM";

        const rawIp = (() => {
          const fwd = req.headers["x-forwarded-for"];
          if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim();
          return req.socket?.remoteAddress ?? null;
        })();

        const requestId     = req.requestId     ?? null;
        const correlationId = req.correlationId ?? null;
        const traceId       = req.traceId       ?? null;
        const userAgent     = req.headers["user-agent"]?.slice(0, 500) ?? null;

        const message = httpStatus >= 500
          ? `${method} ${path} failed with ${httpStatus}`
          : httpStatus >= 400
            ? `${method} ${path} rejected with ${httpStatus}`
            : `${method} ${path} completed`;

        const errorObj = httpStatus >= 400 ? {
          code:       String(httpStatus),
          type:       (res.locals.errorType   as string | undefined) ?? null,
          message:    (res.locals.errorMessage as string | undefined) ?? `HTTP ${httpStatus}`,
          exception:  null,
          stackTrace: null,
          retryable:  httpStatus >= 500,
        } : null;

        await AuditLog.create({
          category,
          action,
          eventStatus,
          severity,
          actorId,
          actorRole,
          method,
          path,
          statusCode:    httpStatus,
          ipAddress:     rawIp,
          requestId,
          correlationId,
          traceId,
          entityType:    null,
          entityId:      null,
          event: {
            category,
            action,
            type:     actorId ? "USER_ACTIVITY" : "SYSTEM_EVENT",
            status:   eventStatus,
            severity,
            message,
          },
          actor: {
            type:  actorType,
            id:    actorId,
            name:  null,
            email: null,
            role:  actorRole,
          },
          request: {
            requestId,
            correlationId,
            traceId,
            method,
            path,
            ipAddress: rawIp,
            userAgent,
            channel,
          },
          location:    req.geoLocation ?? null,
          application: {
            service:     process.env.SERVICE_NAME            ?? "skulcredit-api",
            module:      category,
            version:     process.env.npm_package_version     ?? "1.0.0",
            environment: (process.env.NODE_ENV ?? "development").toUpperCase(),
            server:      process.env.HOSTNAME                ?? null,
          },
          resource:   null,
          navigation: null,
          response: {
            statusCode: httpStatus,
            status:     eventStatus,
            durationMs,
          },
          error:    errorObj,
          metadata: {
            platform:  null,
            browser:   null,
            deviceId:  null,
            sessionId: null,
          },
        });
      } catch (err) {
        logger.warn("auditMiddleware: failed to write audit log", {
          err:  (err as Error).message,
          path: req.originalUrl,
        });
      }
    })();
  });

  next();
};
