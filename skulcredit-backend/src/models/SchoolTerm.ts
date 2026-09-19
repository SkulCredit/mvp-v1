import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

/**
 * SchoolTerm — global Nigerian school calendar terms.
 *
 * NOT per-school. This table defines the national application windows:
 *   - Term 1:  ~Sep–Dec   (usually the longest, opens September)
 *   - Term 2:  ~Jan–Apr   (opens January)
 *   - Term 3:  ~Apr–Jul   (shortest term, max 3-month repayment)
 *
 * Admin configures the exact resumption date each cycle.
 * `portalOpenDate`  — the first day parents can submit applications.
 * `portalCloseDate` — the last day parents can submit applications.
 * `maxTenorMonths`  — maximum repayment tenor allowed in this term.
 *                     The service automatically reduces tenor for late
 *                     applicants (e.g. Oct applicant in Term 1 gets 3m).
 * `isActive`        — true for the currently open term; admin toggles this.
 */
export interface SchoolTermAttributes {
  id: string;
  name: string;           // e.g. "Term 1", "Term 2", "Term 3"
  academicYear: string;   // e.g. "2026/2027"
  portalOpenDate: string; // DATEONLY — parents can start applying
  portalCloseDate: string;// DATEONLY — application window closes
  maxTenorMonths: number; // Maximum repayment months for this term (3 or 4)
  isActive: boolean;      // Only ONE term should be active at a time
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolTermCreationAttributes = Optional<
  SchoolTermAttributes,
  "id" | "isActive"
>;

export class SchoolTermInstance
  extends Model<SchoolTermAttributes, SchoolTermCreationAttributes>
  implements SchoolTermAttributes
{
  declare id: string;
  declare name: string;
  declare academicYear: string;
  declare portalOpenDate: string;
  declare portalCloseDate: string;
  declare maxTenorMonths: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SchoolTermInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    portalOpenDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    portalCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    maxTenorMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "SchoolTerm",
    tableName: "school_terms",
    timestamps: true,
    underscored: true,
    indexes: [
      // Ensure no duplicate term name within the same academic year
      { unique: true, fields: ["name", "academic_year"] },
    ],
  },
);

export default SchoolTermInstance;
