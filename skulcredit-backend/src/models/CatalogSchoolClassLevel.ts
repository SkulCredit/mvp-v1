import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface CatalogSchoolClassLevelAttributes {
  id: string;
  schoolId: string;
  institutionTypeId: string;
  /** e.g. "Junior Secondary", "Senior Secondary" — null for flat class lists */
  subLevelGroup: string | null;
  /** e.g. "JSS 1 (Basic 7)", "Nursery I", "SSS 1" */
  className: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type CatalogSchoolClassLevelCreationAttributes = Optional<
  CatalogSchoolClassLevelAttributes,
  "id" | "subLevelGroup" | "sortOrder"
>;

export class CatalogSchoolClassLevelInstance
  extends Model<
    CatalogSchoolClassLevelAttributes,
    CatalogSchoolClassLevelCreationAttributes
  >
  implements CatalogSchoolClassLevelAttributes
{
  declare id: string;
  declare schoolId: string;
  declare institutionTypeId: string;
  declare subLevelGroup: string | null;
  declare className: string;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CatalogSchoolClassLevelInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "catalog_schools", key: "id" },
      onDelete: "CASCADE",
    },
    institutionTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "catalog_institution_types", key: "id" },
      onDelete: "CASCADE",
    },
    subLevelGroup: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    className: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "CatalogSchoolClassLevel",
    tableName: "catalog_school_class_levels",
    timestamps: true,
    underscored: true,
  },
);

export default CatalogSchoolClassLevelInstance;
