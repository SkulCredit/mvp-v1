import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface CatalogSchoolAttributes {
  id: string;
  name: string;
  isRegistered: boolean;
  /** "1+", "1", "2", "3", "4" — null for non-registered schools */
  tier: string | null;
  /** Stored as a decimal fraction, e.g. 0.10 = 10 %. null = use global default */
  serviceChargeRate: number | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type CatalogSchoolCreationAttributes = Optional<
  CatalogSchoolAttributes,
  "id" | "isRegistered" | "tier" | "serviceChargeRate" | "isActive"
>;

export class CatalogSchoolInstance
  extends Model<CatalogSchoolAttributes, CatalogSchoolCreationAttributes>
  implements CatalogSchoolAttributes
{
  declare id: string;
  declare name: string;
  declare isRegistered: boolean;
  declare tier: string | null;
  declare serviceChargeRate: number | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CatalogSchoolInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    isRegistered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    tier: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    serviceChargeRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "CatalogSchool",
    tableName: "catalog_schools",
    timestamps: true,
    underscored: true,
  },
);

export default CatalogSchoolInstance;
