import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export interface TermAttributes {
  id: string;
  schoolId: string;
  name: string;
  academicSession: string;
  startDate: string | null;
  endDate: string | null;
  feesDueDate: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type TermCreationAttributes = Optional<TermAttributes, 'id' | 'startDate' | 'endDate' | 'feesDueDate' | 'isActive'>;

export class TermInstance extends Model<TermAttributes, TermCreationAttributes> implements TermAttributes {
  declare id: string;
  declare schoolId: string;
  declare name: string;
  declare academicSession: string;
  declare startDate: string | null;
  declare endDate: string | null;
  declare feesDueDate: string | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TermInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' },
      onDelete: 'CASCADE',
    },
    name:            { type: DataTypes.STRING, allowNull: false },
    academicSession: { type: DataTypes.STRING, allowNull: false },
    startDate:   { type: DataTypes.DATEONLY, allowNull: true },
    endDate:     { type: DataTypes.DATEONLY, allowNull: true },
    feesDueDate: { type: DataTypes.DATEONLY, allowNull: true },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'Term',
    tableName: 'terms',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['school_id', 'name', 'academic_session'] },
    ],
  }
);

export default TermInstance;
