import { Request, Response, NextFunction } from "express";
import auditLogService from "../services/auditLog.service";
import { successResponse } from "../utils/response";

class AuditLogController {
  async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query;
      const str = (v: unknown) => (v ? String(v) : undefined);

      const data = await auditLogService.listLogs({
        // Identity
        actorId:       str(q.actorId),
        actorRole:     str(q.actorRole),
        // Event
        category:      str(q.category),
        action:        str(q.action),
        eventStatus:   str(q.eventStatus),
        severity:      str(q.severity),
        // Request
        method:        str(q.method),
        path:          str(q.path),
        statusCode:    str(q.statusCode),
        ipAddress:     str(q.ipAddress),
        requestId:     str(q.requestId),
        correlationId: str(q.correlationId),
        traceId:       str(q.traceId),
        // Entity
        entityType:    str(q.entityType),
        entityId:      str(q.entityId),
        // Date range
        fromDate:      str(q.fromDate),
        toDate:        str(q.toDate),
        // Pagination
        page:          str(q.page),
        limit:         str(q.limit),
      });
      successResponse(res, 200, "Audit logs fetched", data);
    } catch (e) { next(e); }
  }

  async getLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditLogService.getLog(String(req.params.id));
      successResponse(res, 200, "Audit log fetched", log);
    } catch (e) { next(e); }
  }

  async getActionDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await auditLogService.getActionDistribution();
      successResponse(res, 200, "Action distribution fetched", data);
    } catch (e) { next(e); }
  }

  async deleteLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditLogService.getLog(String(req.params.id));
      if (!log) {
        res.status(404).json({ success: false, message: "Audit log not found" });
        return;
      }
      await log.destroy();
      successResponse(res, 200, "Audit log deleted", {});
    } catch (e) { next(e); }
  }

  async getSeverityDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await auditLogService.getSeverityDistribution();
      successResponse(res, 200, "Severity distribution fetched", data);
    } catch (e) { next(e); }
  }

  async getRecentFailures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const data  = await auditLogService.getRecentFailures(limit);
      successResponse(res, 200, "Recent failures fetched", data);
    } catch (e) { next(e); }
  }
}

export default new AuditLogController();
