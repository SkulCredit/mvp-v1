import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface SchoolVerificationLinkAttributes {
  id: string;
  token: string;
  loanApplicationId: string;
  schoolName: string;
  contactEmail: string | null;
  generatedBy: string;
  expiresAt: Date;
  usedAt: Date | null;
  action: "confirmed" | "rejected" | null;
  rejectionNote: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolVerificationLinkCreationAttributes = Optional<
  SchoolVerificationLinkAttributes,
  "id" | "contactEmail" | "usedAt" | "action" | "rejectionNote"
>;

export class SchoolVerificationLinkInstance
  extends Model<SchoolVerificationLinkAttributes, SchoolVerificationLinkCreationAttributes>
  implements SchoolVerificationLinkAttributes
{
  declare id: string;
  declare token: string;
  declare loanApplicationId: string;
  declare schoolName: string;
  declare contactEmail: string | null;
  declare generatedBy: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare action: "confirmed" | "rejected" | null;
  declare rejectionNote: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SchoolVerificationLinkInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    loanApplicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "loan_application_id",
      references: { model: "loan_applications", key: "id" },
      onDelete: "CASCADE",
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "school_name",
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "contact_email",
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "generated_by",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "used_at",
    },
    action: {
      type: DataTypes.ENUM("confirmed", "rejected"),
      allowNull: true,
    },
    rejectionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_note",
    },
  },
  {
    sequelize,
    modelName: "SchoolVerificationLink",
    tableName: "school_verification_links",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["token"], unique: true },
      { fields: ["loan_application_id"] },
      { fields: ["expires_at"] },
    ],
  },
);

export default SchoolVerificationLinkInstance;
