import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface AdminProfileAttributes {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type AdminProfileCreationAttributes = Optional<
  AdminProfileAttributes,
  "id" | "fullName" | "avatarUrl" | "phone"
>;

export class AdminProfileInstance
  extends Model<AdminProfileAttributes, AdminProfileCreationAttributes>
  implements AdminProfileAttributes
{
  declare id: string;
  declare userId: string;
  declare fullName: string | null;
  declare avatarUrl: string | null;
  declare phone: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AdminProfileInstance.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(150), allowNull: true },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
  },
  {
    sequelize,
    modelName: "AdminProfile",
    tableName: "admin_profiles",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["user_id"] }],
  },
);

export default AdminProfileInstance;
