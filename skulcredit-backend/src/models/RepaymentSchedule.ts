import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { RepaymentScheduleStatus } from '../types';

export interface RepaymentScheduleAttributes {
  id: string;
  loanApplicationId: string;
  parentId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  outstandingBalance: number;
  status: RepaymentScheduleStatus;
  lateFeeApplied: number | null;
  lateFeeAppliedAt: Date | null;
  paidAt: Date | null;
  amountPaid: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type RepaymentScheduleCreationAttributes = Optional<
  RepaymentScheduleAttributes,
  'id' | 'status' | 'lateFeeApplied' | 'lateFeeAppliedAt' | 'paidAt' | 'amountPaid'
>;

export class RepaymentScheduleInstance
  extends Model<RepaymentScheduleAttributes, RepaymentScheduleCreationAttributes>
  implements RepaymentScheduleAttributes {
  declare id: string;
  declare loanApplicationId: string;
  declare parentId: string;
  declare installmentNumber: number;
  declare dueDate: string;
  declare principalAmount: number;
  declare interestAmount: number;
  declare totalAmount: number;
  declare outstandingBalance: number;
  declare status: RepaymentScheduleStatus;
  declare lateFeeApplied: number | null;
  declare lateFeeAppliedAt: Date | null;
  declare paidAt: Date | null;
  declare amountPaid: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RepaymentScheduleInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanApplicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'loan_applications', key: 'id' },
      onDelete: 'CASCADE',
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'parents', key: 'id' },
    },
    installmentNumber:  { type: DataTypes.INTEGER, allowNull: false },
    dueDate:            { type: DataTypes.DATEONLY, allowNull: false },
    principalAmount:    { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    interestAmount:     { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    totalAmount:        { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    outstandingBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('upcoming', 'due', 'paid', 'partially_paid', 'overdue', 'waived'),
      defaultValue: 'upcoming',
    },
    lateFeeApplied:   { type: DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: 0 },
    lateFeeAppliedAt: { type: DataTypes.DATE, allowNull: true },
    paidAt:     { type: DataTypes.DATE, allowNull: true },
    amountPaid: { type: DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'RepaymentSchedule',
    tableName: 'repayment_schedules',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['loan_application_id', 'installment_number'], unique: true },
      { fields: ['parent_id', 'due_date'] },
      { fields: ['status'] },
    ],
  }
);

export default RepaymentScheduleInstance;
