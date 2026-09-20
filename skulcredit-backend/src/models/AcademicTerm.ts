import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type TermCode = "FIRST_TERM" | "SECOND_TERM" | "THIRD_TERM";
export type TermStatus =
  | "UPCOMING"
  | "ACTIVE_APPLICATION"
  | "APPLICATION_CLOSED"
  | "COMPLETED";

export interface ApplicationWindow {
  window_name: string;          // e.g. "Early Applicant Window"
  start_date: string;           // YYYY-MM-DD
  end_date: string;             // YYYY-MM-DD
  repayment_duration_months: number;
  is_open: boolean;
}

export interface AcademicTermAttributes {
  id: string;
  termId: string;               // e.g. "TERM-2026-2027-T1"
  sessionId: string;            // FK → academic_sessions.id
  termCode: TermCode;
  termName: string;             // e.g. "First Term"
  defaultResumptionMonth: string; // e.g. "September"
  maxRepaymentMonths: number;
  resumptionDate: string | null;
  portalOpeningDate: string | null;
  portalCloseDate: string | null; // last day parents can apply (end of last window)
  status: TermStatus;
  applicationWindows: ApplicationWindow[];
  createdAt?: Date;
  updatedAt?: Date;
}

type AcademicTermCreationAttributes = Optional<
  AcademicTermAttributes,
  "id" | "resumptionDate" | "portalOpeningDate" | "portalCloseDate" | "status"
>;

export class AcademicTermInstance
  extends Model<AcademicTermAttributes, AcademicTermCreationAttributes>
  implements AcademicTermAttributes
{
  declare id: string;
  declare termId: string;
  declare sessionId: string;
  declare termCode: TermCode;
  declare termName: string;
  declare defaultResumptionMonth: string;
  declare maxRepaymentMonths: number;
  declare resumptionDate: string | null;
  declare portalOpeningDate: string | null;
  declare portalCloseDate: string | null;
  declare status: TermStatus;
  declare applicationWindows: ApplicationWindow[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AcademicTermInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    termId: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_sessions", key: "id" },
      onDelete: "CASCADE",
    },
    termCode: {
      type: DataTypes.ENUM("FIRST_TERM", "SECOND_TERM", "THIRD_TERM"),
      allowNull: false,
    },
    termName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    defaultResumptionMonth: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    maxRepaymentMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resumptionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    portalOpeningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    portalCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "UPCOMING",
        "ACTIVE_APPLICATION",
        "APPLICATION_CLOSED",
        "COMPLETED",
      ),
      allowNull: false,
      defaultValue: "UPCOMING",
    },
    applicationWindows: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: "AcademicTerm",
    tableName: "academic_terms",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["session_id", "term_code"] },
    ],
  },
);

export default AcademicTermInstance;
