import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type AuditCategory =
  | "AUTHENTICATION" | "AUTHORIZATION" | "USER"        | "ADMIN"
  | "NAVIGATION"     | "API"           | "PAYMENT"     | "TRANSACTION"
  | "WALLET"         | "TRANSFER"      | "KYC"         | "SECURITY"
  | "CONFIGURATION"  | "DATABASE"      | "SYSTEM"      | "INTEGRATION"
  | "NOTIFICATION"   | "FILE"          | "REPORT"      | "BACKGROUND_JOB"
  | "SCHEDULED_TASK";

export type AuditEventStatus =
  | "SUCCESS" | "FAILED"    | "DENIED"    | "REJECTED"
  | "PENDING" | "STARTED"   | "COMPLETED" | "CANCELLED";

export type AuditSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type AuditActorType = "USER" | "ADMIN" | "SYSTEM" | "SERVICE" | "SCHEDULER";

export type AuditActorRole = "admin" | "parent" | "school" | "system" | "funding_partner" | "customer_service" | "customer_service_manager";

export type AuditChannel = "WEB" | "MOBILE" | "API" | "INTERNAL" | "WEBHOOK" | "SCHEDULER";

export interface AuditEvent {
  category:  AuditCategory;
  action:    string;           
  type:      string;           
  status:    AuditEventStatus;
  severity:  AuditSeverity;
  message:   string;
}

export interface AuditActor {
  type:   AuditActorType;
  id:     string | null;
  name:   string | null;
  email:  string | null;
  role:   AuditActorRole;
}

export interface AuditRequest {
  requestId:     string | null;
  correlationId: string | null;
  traceId:       string | null;
  method:        string;
  path:          string;
  ipAddress:     string | null;
  userAgent:     string | null;
  channel:       AuditChannel;
}

export interface AuditLocation {
  country:  string | null;
  state:    string | null;
  city:     string | null;
  timezone: string | null;
}

export interface AuditApplication {
  service:     string;
  module:      string;
  version:     string;
  environment: string;
  server:      string | null;
}

export interface AuditResource {
  type: string | null;
  id:   string | null;
}

export interface AuditNavigation {
  page:         string | null;
  previousPage: string | null;
}

export interface AuditResponse {
  statusCode: number;
  status:     AuditEventStatus;
  durationMs: number | null;
}

export interface AuditError {
  code:       string | null;
  type:       string | null;
  message:    string | null;
  exception:  string | null;
  stackTrace: string | null;
  retryable:  boolean;
}

export interface AuditMetadata {
  sessionId?: string | null;
  deviceId?:  string | null;
  platform?:  string | null;
  browser?:   string | null;
  [key: string]: unknown;
}

export interface AuditLogAttributes {
  id:          string;
  category:    AuditCategory;
  action:      string;
  eventStatus: AuditEventStatus;
  severity:    AuditSeverity;
  actorId:     string | null;
  actorRole:   AuditActorRole;
  method:      string | null;
  path:        string | null;
  statusCode:  number | null;
  ipAddress:   string | null;
  requestId:   string | null;
  correlationId: string | null;
  traceId:     string | null;
  entityType:  string | null;
  entityId:    string | null;
  // Rich JSONB columns
  event:       AuditEvent;
  actor:       AuditActor;
  request:     AuditRequest;
  location:    AuditLocation | null;
  application: AuditApplication;
  resource:    AuditResource | null;
  navigation:  AuditNavigation | null;
  response:    AuditResponse;
  error:       AuditError | null;
  metadata:    AuditMetadata | null;
  createdAt?:  Date;
}

type AuditLogCreationAttributes = Optional<
  AuditLogAttributes,
  | "id" | "actorId" | "method" | "path" | "statusCode" | "ipAddress"
  | "requestId" | "correlationId" | "traceId" | "entityType" | "entityId"
  | "location" | "resource" | "navigation" | "error" | "metadata"
>;

export class AuditLogInstance
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id:            string;
  declare category:      AuditCategory;
  declare action:        string;
  declare eventStatus:   AuditEventStatus;
  declare severity:      AuditSeverity;
  declare actorId:       string | null;
  declare actorRole:     AuditActorRole;
  declare method:        string | null;
  declare path:          string | null;
  declare statusCode:    number | null;
  declare ipAddress:     string | null;
  declare requestId:     string | null;
  declare correlationId: string | null;
  declare traceId:       string | null;
  declare entityType:    string | null;
  declare entityId:      string | null;
  declare event:         AuditEvent;
  declare actor:         AuditActor;
  declare request:       AuditRequest;
  declare location:      AuditLocation | null;
  declare application:   AuditApplication;
  declare resource:      AuditResource | null;
  declare navigation:    AuditNavigation | null;
  declare response:      AuditResponse;
  declare error:         AuditError | null;
  declare metadata:      AuditMetadata | null;
  declare readonly createdAt: Date;
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  "AUTHENTICATION", "AUTHORIZATION", "USER",        "ADMIN",
  "NAVIGATION",     "API",           "PAYMENT",     "TRANSACTION",
  "WALLET",         "TRANSFER",      "KYC",         "SECURITY",
  "CONFIGURATION",  "DATABASE",      "SYSTEM",      "INTEGRATION",
  "NOTIFICATION",   "FILE",          "REPORT",      "BACKGROUND_JOB",
  "SCHEDULED_TASK",
];

export const AUDIT_EVENT_STATUSES: AuditEventStatus[] = [
  "SUCCESS", "FAILED", "DENIED", "REJECTED", "PENDING", "STARTED", "COMPLETED", "CANCELLED",
];

export const AUDIT_SEVERITIES: AuditSeverity[] = [
  "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL",
];

export const AUDIT_ACTOR_TYPES: AuditActorType[] = [
  "USER", "ADMIN", "SYSTEM", "SERVICE", "SCHEDULER",
];

export const AUDIT_ACTOR_ROLES: AuditActorRole[] = [
  "admin", "parent", "school", "system", "funding_partner", "customer_service", "customer_service_manager",
];

export const AUDIT_CHANNELS: AuditChannel[] = [
  "WEB", "MOBILE", "API", "INTERNAL", "WEBHOOK", "SCHEDULER",
];

AuditLogInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM(...AUDIT_CATEGORIES),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    eventStatus: {
      type: DataTypes.ENUM(...AUDIT_EVENT_STATUSES),
      allowNull: false,
      field: "event_status",
    },
    severity: {
      type: DataTypes.ENUM(...AUDIT_SEVERITIES),
      allowNull: false,
      defaultValue: "INFO",
    },
    actorId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "actor_id",
    },
    actorRole: {
      type: DataTypes.ENUM(...AUDIT_ACTOR_ROLES),
      allowNull: false,
      defaultValue: "system",
      field: "actor_role",
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "status_code",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
    },
    requestId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "request_id",
    },
    correlationId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "correlation_id",
    },
    traceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "trace_id",
    },
    entityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "entity_type",
    },
    entityId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "entity_id",
    },
    // JSONB rich columns
    event: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    actor: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    request: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    application: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    resource: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    navigation: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    response: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    error: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ["category"] },
      { fields: ["action"] },
      { fields: ["event_status"] },
      { fields: ["severity"] },
      { fields: ["actor_id"] },
      { fields: ["actor_role"] },
      { fields: ["method"] },
      { fields: ["status_code"] },
      { fields: ["ip_address"] },
      { fields: ["request_id"] },
      { fields: ["correlation_id"] },
      { fields: ["trace_id"] },
      { fields: ["entity_type", "entity_id"] },
      { fields: ["created_at"] },
    ],
  },
);

export default AuditLogInstance;
