import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/db';
import type { RepaymentStatus, RepaymentType, PaymentMethod } from '../types';

export interface RepaymentAttributes {
  id: string;
  loanApplicationId: string;
  parentId: string;
  repaymentScheduleId: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentChannel: string | null;
  status: RepaymentStatus;
  paidAt: Date | null;
  failureReason: string | null;
  paystackReference: string | null;
  paystackTransactionId: string | null;
  receiptNumber: string | null;
  type: RepaymentType;
  recordedBy: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type RepaymentCreationAttributes = Optional<
  RepaymentAttributes,
  | 'id'
  | 'repaymentScheduleId'
  | 'currency'
  | 'paymentChannel'
  | 'status'
  | 'paidAt'
  | 'failureReason'
  | 'paystackReference'
  | 'paystackTransactionId'
  | 'receiptNumber'
  | 'type'
  | 'recordedBy'
  | 'notes'
>;

export class RepaymentInstance
  extends Model<RepaymentAttributes, RepaymentCreationAttributes>
  implements RepaymentAttributes {
  declare id: string;
  declare loanApplicationId: string;
  declare parentId: string;
  declare repaymentScheduleId: string | null;
  declare amount: number;
  declare currency: string;
  declare paymentMethod: PaymentMethod;
  declare paymentChannel: string | null;
  declare status: RepaymentStatus;
  declare paidAt: Date | null;
  declare failureReason: string | null;
  declare paystackReference: string | null;
  declare paystackTransactionId: string | null;
  declare receiptNumber: string | null;
  declare type: RepaymentType;
  declare recordedBy: string | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RepaymentInstance.init(
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
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'parents', key: 'id' },
    },
    repaymentScheduleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'repayment_schedules', key: 'id' },
    },
    amount:         { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency:       { type: DataTypes.STRING(3), defaultValue: 'NGN' },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'bank_transfer', 'direct_debit', 'ussd', 'manual'),
      allowNull: false,
    },
    paymentChannel: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'successful', 'failed', 'reversed'),
      defaultValue: 'pending',
    },
    paidAt:                { type: DataTypes.DATE, allowNull: true },
    failureReason:         { type: DataTypes.STRING, allowNull: true },
    paystackReference:     { type: DataTypes.STRING, allowNull: true, unique: true },
    paystackTransactionId: { type: DataTypes.STRING, allowNull: true },
    receiptNumber:         { type: DataTypes.STRING, allowNull: true, unique: true },
    type: {
      type: DataTypes.ENUM('scheduled', 'early_partial', 'early_full', 'late', 'manual_reversal'),
      defaultValue: 'scheduled',
    },
    recordedBy: { type: DataTypes.UUID, allowNull: true },
    notes:      { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Repayment',
    tableName: 'repayments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['loan_application_id'] },
      { fields: ['parent_id'] },
      { fields: ['status'] },
      {
        fields: ['paystack_reference'],
        unique: true,
        where: { paystack_reference: { [Op.ne]: null } },
      },
    ],
  }
);

export default RepaymentInstance;
