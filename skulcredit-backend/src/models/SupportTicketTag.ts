import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface SupportTicketTagAttributes {
  id: string;
  ticketId: string;
  userId: string;
  taggedBy: string | null;
  note: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SupportTicketTagCreationAttributes = Optional<
  SupportTicketTagAttributes,
  "id" | "taggedBy" | "note"
>;

export class SupportTicketTagInstance
  extends Model<SupportTicketTagAttributes, SupportTicketTagCreationAttributes>
  implements SupportTicketTagAttributes
{
  declare id: string;
  declare ticketId: string;
  declare userId: string;
  declare taggedBy: string | null;
  declare note: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupportTicketTagInstance.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    taggedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "SupportTicketTag",
    tableName: "support_ticket_tags",
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ["ticket_id", "user_id"] },
      { fields: ["ticket_id"] },
      { fields: ["user_id"] },
      { fields: ["tagged_by"] },
    ],
  },
);

export default SupportTicketTagInstance;
