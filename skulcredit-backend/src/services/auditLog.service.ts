import { Op, WhereOptions } from "sequelize";
import AuditLog, { AuditLogAttributes } from "../models/AuditLog";

function qInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface ListAuditLogsOptions {
  // Identity filters
  actorId?:    string;
  actorRole?:  string;

  // Event filters
  category?:    string;
  action?:      string;
  eventStatus?: string;
  severity?:    string;

  // Request filters
  method?:     string;
  path?:       string;
  statusCode?: string;
  ipAddress?:  string;
  requestId?:  string;
  correlationId?: string;
  traceId?:    string;

  // Entity filters
  entityType?: string;
  entityId?:   string;

  // Date range
  fromDate?: string;
  toDate?:   string;

  // Pagination
  page?:  string;
  limit?: string;
}

class AuditLogService {
  async listLogs(opts: ListAuditLogsOptions) {
    const page   = qInt(opts.page,  1);
    const limit  = qInt(opts.limit, 50);
    const offset = (page - 1) * limit;

    const where: WhereOptions<AuditLogAttributes> = {};

    // Exact-match filters on indexed columns
    if (opts.actorId)       (where as Record<string, unknown>).actorId       = opts.actorId;
    if (opts.actorRole)     (where as Record<string, unknown>).actorRole     = opts.actorRole;
    if (opts.category)      (where as Record<string, unknown>).category      = opts.category;
    if (opts.eventStatus)   (where as Record<string, unknown>).eventStatus   = opts.eventStatus;
    if (opts.severity)      (where as Record<string, unknown>).severity      = opts.severity;
    if (opts.method)        (where as Record<string, unknown>).method        = opts.method.toUpperCase();
    if (opts.statusCode)    (where as Record<string, unknown>).statusCode    = parseInt(opts.statusCode, 10);
    if (opts.ipAddress)     (where as Record<string, unknown>).ipAddress     = opts.ipAddress;
    if (opts.requestId)     (where as Record<string, unknown>).requestId     = opts.requestId;
    if (opts.correlationId) (where as Record<string, unknown>).correlationId = opts.correlationId;
    if (opts.traceId)       (where as Record<string, unknown>).traceId       = opts.traceId;
    if (opts.entityType)    (where as Record<string, unknown>).entityType    = opts.entityType;
    if (opts.entityId)      (where as Record<string, unknown>).entityId      = opts.entityId;

    // ILIKE for partial-match fields
    if (opts.action) {
      (where as Record<string, unknown>).action = { [Op.iLike]: `%${opts.action}%` };
    }
    if (opts.path) {
      (where as Record<string, unknown>).path = { [Op.iLike]: `%${opts.path}%` };
    }

    // Date range on createdAt
    if (opts.fromDate || opts.toDate) {
      const range: Record<symbol, Date> = {};
      if (opts.fromDate) range[Op.gte] = new Date(opts.fromDate);
      if (opts.toDate)   range[Op.lte] = new Date(`${opts.toDate}T23:59:59`);
      (where as Record<string, unknown>).createdAt = range;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order:  [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      total: count,
      page,
      limit,
      data:  rows,
    };
  }

  async getLog(id: string) {
    return AuditLog.findByPk(id);
  }

  /** Distribution of actions — useful for the admin dashboard chart */
  async getActionDistribution() {
    return AuditLog.findAll({
      attributes: [
        "action",
        "category",
        [AuditLog.sequelize!.fn("COUNT", AuditLog.sequelize!.col("id")), "count"],
      ],
      group:  ["action", "category"],
      order:  [[AuditLog.sequelize!.literal("count"), "DESC"]],
      limit:  30,
    } as never);
  }

  /** Distribution by severity — useful for a health / error-rate indicator */
  async getSeverityDistribution() {
    return AuditLog.findAll({
      attributes: [
        "severity",
        [AuditLog.sequelize!.fn("COUNT", AuditLog.sequelize!.col("id")), "count"],
      ],
      group: ["severity"],
      order: [[AuditLog.sequelize!.literal("count"), "DESC"]],
    } as never);
  }

  /** Recent failures — quick view for the admin alert panel */
  async getRecentFailures(limit = 10) {
    return AuditLog.findAll({
      where:  { eventStatus: ["FAILED", "DENIED", "REJECTED"] } as never,
      order:  [["createdAt", "DESC"]],
      limit,
    });
  }
}

export default new AuditLogService();
