import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { SchoolStatus } from '../types';

export interface SchoolAttributes {
  id: string;
  userId: string;
  schoolName: string;
  contactPerson: string;
  website: string | null;
  population: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressCountry: string | null;
  documentCac: string | null;
  documentLicense: string | null;
  status: SchoolStatus;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolCreationAttributes = Optional<
  SchoolAttributes,
  | 'id'
  | 'website'
  | 'population'
  | 'addressStreet'
  | 'addressCity'
  | 'addressState'
  | 'addressCountry'
  | 'documentCac'
  | 'documentLicense'
  | 'status'
  | 'bankName'
  | 'bankAccountName'
  | 'bankAccountNumber'
>;

export class SchoolInstance extends Model<SchoolAttributes, SchoolCreationAttributes> implements SchoolAttributes {
  declare id: string;
  declare userId: string;
  declare schoolName: string;
  declare contactPerson: string;
  declare website: string | null;
  declare population: string | null;
  declare addressStreet: string | null;
  declare addressCity: string | null;
  declare addressState: string | null;
  declare addressCountry: string | null;
  declare documentCac: string | null;
  declare documentLicense: string | null;
  declare status: SchoolStatus;
  declare bankName: string | null;
  declare bankAccountName: string | null;
  declare bankAccountNumber: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SchoolInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    schoolName:    { type: DataTypes.STRING, allowNull: false },
    contactPerson: { type: DataTypes.STRING, allowNull: false },
    website:       { type: DataTypes.STRING, allowNull: true },
    population:    { type: DataTypes.STRING, allowNull: true },
    addressStreet:  { type: DataTypes.STRING, allowNull: true },
    addressCity:    { type: DataTypes.STRING, allowNull: true },
    addressState:   { type: DataTypes.STRING, allowNull: true },
    addressCountry: { type: DataTypes.STRING, allowNull: true },
    documentCac:     { type: DataTypes.STRING, allowNull: true },
    documentLicense: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    bankName:          { type: DataTypes.STRING, allowNull: true },
    bankAccountName:   { type: DataTypes.STRING, allowNull: true },
    bankAccountNumber: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'School',
    tableName: 'schools',
    timestamps: true,
    underscored: true,
  }
);

export default SchoolInstance;
