import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type TicketStatus   = "open" | "in_progress" | "awaiting_customer" | "escalated" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketUserRole = "parent" | "school" | "admin";
export type TicketCategory =
  | "loan_application"
  | "payment"
  | "technical"
  | "document_upload"
  | "general_inquiry"
  | "school_verification"
  | "disbursement"
  | "other";

export interface SupportTicketAttributes {
  id: string;
  ticketNumber: string;
  userId: string;
  userRole: TicketUserRole;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string | null;
  adminReply: string | null;
  csNotes: string | null;
  escalationLevel: number;
  escalatedTo: string | null;
  escalationNote: string | null;
  escalatedAt: Date | null;
  repliedAt: Date | null;
  resolvedAt: Date | null;
  userDeletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SupportTicketCreationAttributes = Optional<
  SupportTicketAttributes,
  | "id"
  | "ticketNumber"
  | "status"
  | "priority"
  | "category"
  | "assignedTo"
  | "adminReply"
  | "csNotes"
  | "escalationLevel"
  | "escalatedTo"
  | "escalationNote"
  | "escalatedAt"
  | "repliedAt"
  | "resolvedAt"
  | "userDeletedAt"
>;

export class SupportTicketInstance
  extends Model<SupportTicketAttributes, SupportTicketCreationAttributes>
  implements SupportTicketAttributes
{
  declare id: string;
  declare ticketNumber: string;
  declare userId: string;
  declare userRole: TicketUserRole;
  declare category: TicketCategory;
  declare subject: string;
  declare message: string;
  declare status: TicketStatus;
  declare priority: TicketPriority;
  declare assignedTo: string | null;
  declare adminReply: string | null;
  declare csNotes: string | null;
  declare escalationLevel: number;
  declare escalatedTo: string | null;
  declare escalationNote: string | null;
  declare escalatedAt: Date | null;
  declare repliedAt: Date | null;
  declare resolvedAt: Date | null;
  declare userDeletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupportTicketInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    userRole: {
      type: DataTypes.ENUM("parent", "school", "admin"),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "loan_application",
        "payment",
        "technical",
        "document_upload",
        "general_inquiry",
        "school_verification",
        "disbursement",
        "other",
      ),
      allowNull: false,
      defaultValue: "general_inquiry",
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "awaiting_customer", "escalated", "resolved", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium",
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    adminReply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    csNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    escalationLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    escalatedTo: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    escalationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    escalatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repliedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userDeletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "SupportTicket",
    tableName: "support_tickets",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["ticket_number"], unique: true },
      { fields: ["status"] },
      { fields: ["priority"] },
      { fields: ["category"] },
      { fields: ["assigned_to"] },
      { fields: ["escalated_to"] },
      { fields: ["created_at"] },
      { fields: ["user_deleted_at"] },
    ],
  },
);

export default SupportTicketInstance;
