import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface CatalogInstitutionTypeAttributes {
  id: string;
  name: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type CatalogInstitutionTypeCreationAttributes = Optional<
  CatalogInstitutionTypeAttributes,
  "id" | "sortOrder"
>;

export class CatalogInstitutionTypeInstance
  extends Model<
    CatalogInstitutionTypeAttributes,
    CatalogInstitutionTypeCreationAttributes
  >
  implements CatalogInstitutionTypeAttributes
{
  declare id: string;
  declare name: string;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CatalogInstitutionTypeInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    sortOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "CatalogInstitutionType",
    tableName: "catalog_institution_types",
    timestamps: true,
    underscored: true,
  },
);

export default CatalogInstitutionTypeInstance;
