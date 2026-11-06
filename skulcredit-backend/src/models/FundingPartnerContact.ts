import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface FundingPartnerContactAttributes {
  id: string;
  fundingPartnerId: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string | null;
  isPrimary: boolean;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

type FundingPartnerContactCreationAttributes = Optional<
  FundingPartnerContactAttributes,
  "id" | "phone" | "position" | "isPrimary" | "status"
>;

export class FundingPartnerContactInstance
  extends Model<
    FundingPartnerContactAttributes,
    FundingPartnerContactCreationAttributes
  >
  implements FundingPartnerContactAttributes
{
  declare id: string;
  declare fundingPartnerId: string;
  declare fullName: string;
  declare email: string;
  declare phone: string | null;
  declare position: string | null;
  declare isPrimary: boolean;
  declare status: "active" | "inactive";
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FundingPartnerContactInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fundingPartnerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    position: { type: DataTypes.STRING, allowNull: true },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "FundingPartnerContact",
    tableName: "funding_partner_contacts",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["funding_partner_id"] },
      { fields: ["email"] },
      // NOTE: the unique constraint on (email, funding_partner_id) is intentionally
      // NOT defined here. It is managed exclusively by migration
      // 019_create_funding_partner_contacts so that sequelize.sync() never races
      // with the migration runner to create/drop it.
    ],
  },
);

export default FundingPartnerContactInstance;
