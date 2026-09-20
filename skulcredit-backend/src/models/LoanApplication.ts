import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { LoanApplicationStatus } from "../types";

export interface LoanApplicationAttributes {
  id: string;
  referenceNumber: string | null;
  parentId: string;
  studentId: string;
  catalogSchoolId: string; 
  schoolId: string | null; 
  termId: string | null;
  lendsqrApplicationId: string | null;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number;
  status: LoanApplicationStatus;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  schoolVerificationStatus: "pending" | "confirmed" | "rejected";
  schoolVerifiedAt: Date | null;
  schoolVerificationNote: string | null;
  rejectionReason: string | null;
  adminNote: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  serviceFeePaid: boolean;
  disbursementStatus: "pending" | "processing" | "successful" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

type LoanApplicationCreationAttributes = Optional<
  LoanApplicationAttributes,
  | "id"
  | "referenceNumber"
  | "termId"
  | "lendsqrApplicationId"
  | "amountApproved"
  | "status"
  | "termsAccepted"
  | "termsAcceptedAt"
  | "schoolVerificationStatus"
  | "schoolVerifiedAt"
  | "schoolVerificationNote"
  | "rejectionReason"
  | "adminNote"
  | "decidedBy"
  | "decidedAt"
  | "serviceFeePaid"
  | "disbursementStatus"
  | "schoolId"
>;

export class LoanApplicationInstance
  extends Model<LoanApplicationAttributes, LoanApplicationCreationAttributes>
  implements LoanApplicationAttributes
{
  declare id: string;
  declare referenceNumber: string | null;
  declare parentId: string;
  declare studentId: string;
  declare catalogSchoolId: string;
  declare schoolId: string | null;
  declare termId: string | null;
  declare lendsqrApplicationId: string | null;
  declare amountRequested: number;
  declare amountApproved: number | null;
  declare tenor: number;
  declare status: LoanApplicationStatus;
  declare termsAccepted: boolean;
  declare termsAcceptedAt: Date | null;
  declare schoolVerificationStatus: "pending" | "confirmed" | "rejected";
  declare schoolVerifiedAt: Date | null;
  declare schoolVerificationNote: string | null;
  declare rejectionReason: string | null;
  declare adminNote: string | null;
  declare decidedBy: string | null;
  declare decidedAt: Date | null;
  declare serviceFeePaid: boolean;
  declare disbursementStatus:
    | "pending"
    | "processing"
    | "successful"
    | "failed";
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LoanApplicationInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    referenceNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "parents", key: "id" },
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
    },
    catalogSchoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "catalog_schools", key: "id" },
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "schools", key: "id" },
    },
    termId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "terms", key: "id" },
    },
    lendsqrApplicationId: { type: DataTypes.STRING, allowNull: true },
    amountRequested: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    amountApproved: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    tenor: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "under_review",
        "info_requested",
        "school_verification",
        "approved",
        "rejected",
        "disbursed",
        "repaid",
        "cancelled",
      ),
      defaultValue: "pending",
    },
    termsAccepted: { type: DataTypes.BOOLEAN, defaultValue: false },
    termsAcceptedAt: { type: DataTypes.DATE, allowNull: true },
    schoolVerificationStatus: {
      type: DataTypes.ENUM("pending", "confirmed", "rejected"),
      defaultValue: "pending",
    },
    schoolVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    schoolVerificationNote: { type: DataTypes.TEXT, allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    adminNote: { type: DataTypes.TEXT, allowNull: true },
    decidedBy: { type: DataTypes.UUID, allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
    serviceFeePaid: { type: DataTypes.BOOLEAN, defaultValue: false },
    disbursementStatus: {
      type: DataTypes.ENUM("pending", "processing", "successful", "failed"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "LoanApplication",
    tableName: "loan_applications",
    timestamps: true,
    underscored: true,
  },
);

export default LoanApplicationInstance;
