import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface SchoolTermAttributes {
  id: string;
  name: string;           
  academicYear: string; 
  portalOpenDate: string; 
  portalCloseDate: string;
  maxTenorMonths: number; 
  isActive: boolean;      
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
      { unique: true, fields: ["name", "academic_year"] },
    ],
  },
);

export default SchoolTermInstance;
