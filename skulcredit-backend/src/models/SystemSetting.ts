import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface SystemSettingAttributes {
  id: string;
  section: string;
  settings: Record<string, unknown>;
  updatedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SystemSettingCreationAttributes = Optional<
  SystemSettingAttributes,
  "id" | "updatedBy"
>;

export class SystemSettingInstance
  extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes
{
  declare id: string;
  declare section: string;
  declare settings: Record<string, unknown>;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SystemSettingInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    updatedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "SystemSetting",
    tableName: "system_settings",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["section"] }],
  },
);

export default SystemSettingInstance;
