import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type MessageAuthorType = "submitter" | "customer_service";
export type MessageVisibility = "public" | "internal";

export interface SupportTicketMessageAttributes {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorType: MessageAuthorType;
  body: string;
  visibility: MessageVisibility;
  createdAt?: Date;
  updatedAt?: Date;
}

type SupportTicketMessageCreationAttributes = Optional<
  SupportTicketMessageAttributes,
  "id" | "authorId" | "visibility"
>;

export class SupportTicketMessageInstance
  extends Model<SupportTicketMessageAttributes, SupportTicketMessageCreationAttributes>
  implements SupportTicketMessageAttributes
{
  declare id: string;
  declare ticketId: string;
  declare authorId: string | null;
  declare authorType: MessageAuthorType;
  declare body: string;
  declare visibility: MessageVisibility;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupportTicketMessageInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "support_tickets", key: "id" },
      onDelete: "CASCADE",
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    authorType: {
      type: DataTypes.ENUM("submitter", "customer_service"),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    visibility: {
      type: DataTypes.ENUM("public", "internal"),
      allowNull: false,
      defaultValue: "public",
    },
  },
  {
    sequelize,
    modelName: "SupportTicketMessage",
    tableName: "support_ticket_messages",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["ticket_id"] },
      { fields: ["ticket_id", "visibility"] },
      { fields: ["created_at"] },
    ],
  },
);

export default SupportTicketMessageInstance;
