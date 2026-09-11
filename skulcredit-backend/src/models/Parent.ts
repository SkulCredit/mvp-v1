import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { KycStatus } from '../types';

export interface ParentAttributes {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dob: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  profilePhotoUrl: string | null;
  kycStatus: KycStatus;
  bvn: string | null;
  nin: string | null;
  lendsqrCustomerId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type ParentCreationAttributes = Optional<
  ParentAttributes,
  | 'id'
  | 'middleName'
  | 'dob'
  | 'addressStreet'
  | 'addressCity'
  | 'addressState'
  | 'addressPostalCode'
  | 'addressCountry'
  | 'profilePhotoUrl'
  | 'kycStatus'
  | 'bvn'
  | 'nin'
  | 'lendsqrCustomerId'
>;

export class ParentInstance extends Model<ParentAttributes, ParentCreationAttributes> implements ParentAttributes {
  declare id: string;
  declare userId: string;
  declare firstName: string;
  declare lastName: string;
  declare middleName: string | null;
  declare dob: string | null;
  declare addressStreet: string | null;
  declare addressCity: string | null;
  declare addressState: string | null;
  declare addressPostalCode: string | null;
  declare addressCountry: string | null;
  declare profilePhotoUrl: string | null;
  declare kycStatus: KycStatus;
  declare bvn: string | null;
  declare nin: string | null;
  declare lendsqrCustomerId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ParentInstance.init(
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
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName:  { type: DataTypes.STRING, allowNull: false },
    middleName: { type: DataTypes.STRING, allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    addressStreet:     { type: DataTypes.STRING, allowNull: true },
    addressCity:       { type: DataTypes.STRING, allowNull: true },
    addressState:      { type: DataTypes.STRING, allowNull: true },
    addressPostalCode: { type: DataTypes.STRING, allowNull: true },
    addressCountry:    { type: DataTypes.STRING, allowNull: true },
    profilePhotoUrl:   { type: DataTypes.STRING, allowNull: true },
    kycStatus: {
      type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    bvn: { type: DataTypes.STRING, allowNull: true },
    nin: { type: DataTypes.STRING, allowNull: true },
    lendsqrCustomerId: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Parent',
    tableName: 'parents',
    timestamps: true,
    underscored: true,
    defaultScope: {
      attributes: { exclude: ['bvn', 'nin'] },
    },
    scopes: {
      withSensitive: { attributes: { exclude: [] } },
    },
  }
);

export default ParentInstance;
