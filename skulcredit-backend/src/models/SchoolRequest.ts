import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { SchoolRequestStatus } from '../types';

export interface SchoolRequestAttributes {
  id: string;
  parentId: string;
  schoolName: string;
  schoolAddress: string | null;
  schoolCity: string | null;
  schoolState: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  additionalNotes: string | null;
  documentUrl: string | null;
  status: SchoolRequestStatus;
  adminNote: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolRequestCreationAttributes = Optional<
  SchoolRequestAttributes,
  | 'id'
  | 'schoolAddress'
  | 'schoolCity'
  | 'schoolState'
  | 'contactPerson'
  | 'contactPhone'
  | 'contactEmail'
  | 'additionalNotes'
  | 'documentUrl'
  | 'status'
  | 'adminNote'
>;

export class SchoolRequestInstance
  extends Model<SchoolRequestAttributes, SchoolRequestCreationAttributes>
  implements SchoolRequestAttributes {
  declare id: string;
  declare parentId: string;
  declare schoolName: string;
  declare schoolAddress: string | null;
  declare schoolCity: string | null;
  declare schoolState: string | null;
  declare contactPerson: string | null;
  declare contactPhone: string | null;
  declare contactEmail: string | null;
  declare additionalNotes: string | null;
  declare documentUrl: string | null;
  declare status: SchoolRequestStatus;
  declare adminNote: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SchoolRequestInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'parents', key: 'id' },
      onDelete: 'CASCADE',
    },
    schoolName:      { type: DataTypes.STRING, allowNull: false },
    schoolAddress:   { type: DataTypes.STRING, allowNull: true },
    schoolCity:      { type: DataTypes.STRING, allowNull: true },
    schoolState:     { type: DataTypes.STRING, allowNull: true },
    contactPerson:   { type: DataTypes.STRING, allowNull: true },
    contactPhone:    { type: DataTypes.STRING, allowNull: true },
    contactEmail:    { type: DataTypes.STRING, allowNull: true },
    additionalNotes: { type: DataTypes.TEXT,   allowNull: true },
    documentUrl:     { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'onboarded', 'rejected'),
      defaultValue: 'pending',
    },
    adminNote: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'SchoolRequest',
    tableName: 'school_requests',
    timestamps: true,
    underscored: true,
  }
);

export default SchoolRequestInstance;
