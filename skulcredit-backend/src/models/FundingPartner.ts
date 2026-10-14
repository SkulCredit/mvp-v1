import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface FundingPartnerAttributes {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  contactPerson: string | null;
  status: "active" | "inactive";
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type FundingPartnerCreationAttributes = Optional<
  FundingPartnerAttributes,
  "id" | "phone" | "contactPerson" | "status" | "notes"
>;

export class FundingPartnerInstance
  extends Model<FundingPartnerAttributes, FundingPartnerCreationAttributes>
  implements FundingPartnerAttributes
{
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare contactPerson: string | null;
  declare status: "active" | "inactive";
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FundingPartnerInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    contactPerson: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: "FundingPartner",
    tableName: "funding_partners",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["email"] },
      { fields: ["status"] },
    ],
  },
);

export default FundingPartnerInstance;
