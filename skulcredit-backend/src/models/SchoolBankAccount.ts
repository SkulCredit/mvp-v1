import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface SchoolBankAccountAttributes {
  id: string;
  catalogSchoolId: string;  
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string | null; 
  isPrimary: boolean;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolBankAccountCreationAttributes = Optional<
  SchoolBankAccountAttributes,
  "id" | "bankCode" | "isPrimary" | "isVerified"
>;

export class SchoolBankAccountInstance
  extends Model<SchoolBankAccountAttributes, SchoolBankAccountCreationAttributes>
  implements SchoolBankAccountAttributes
{
  declare id: string;
  declare catalogSchoolId: string;
  declare bankName: string;
  declare accountNumber: string;
  declare accountName: string;
  declare bankCode: string | null;
  declare isPrimary: boolean;
  declare isVerified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SchoolBankAccountInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    catalogSchoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "catalog_schools", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    accountName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    bankCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "SchoolBankAccount",
    tableName: "school_bank_account_details",
    timestamps: true,
    underscored: true,
  },
);

export default SchoolBankAccountInstance;
