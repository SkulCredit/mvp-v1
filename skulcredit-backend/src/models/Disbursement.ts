import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/db';
import type { DisbursementStatus } from '../types';

export interface DisbursementAttributes {
  id: string;
  loanApplicationId: string;
  schoolId: string;
  parentId: string;
  amount: number;
  currency: string;
  recipientBankName: string | null;
  recipientAccountName: string | null;
  recipientAccountNumber: string | null;
  status: DisbursementStatus;
  disbursedAt: Date | null;
  failureReason: string | null;
  paystackTransferCode: string | null;
  paystackTransferId: string | null;
  paystackReference: string | null;
  disbursementReference: string | null;
  reversedAt: Date | null;
  reversalReason: string | null;
  initiatedBy: string | null;
  retryCount: number;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type DisbursementCreationAttributes = Optional<
  DisbursementAttributes,
  | 'id'
  | 'currency'
  | 'recipientBankName'
  | 'recipientAccountName'
  | 'recipientAccountNumber'
  | 'status'
  | 'disbursedAt'
  | 'failureReason'
  | 'paystackTransferCode'
  | 'paystackTransferId'
  | 'paystackReference'
  | 'disbursementReference'
  | 'reversedAt'
  | 'reversalReason'
  | 'initiatedBy'
  | 'retryCount'
  | 'notes'
>;

export class DisbursementInstance
  extends Model<DisbursementAttributes, DisbursementCreationAttributes>
  implements DisbursementAttributes {
  declare id: string;
  declare loanApplicationId: string;
  declare schoolId: string;
  declare parentId: string;
  declare amount: number;
  declare currency: string;
  declare recipientBankName: string | null;
  declare recipientAccountName: string | null;
  declare recipientAccountNumber: string | null;
  declare status: DisbursementStatus;
  declare disbursedAt: Date | null;
  declare failureReason: string | null;
  declare paystackTransferCode: string | null;
  declare paystackTransferId: string | null;
  declare paystackReference: string | null;
  declare disbursementReference: string | null;
  declare reversedAt: Date | null;
  declare reversalReason: string | null;
  declare initiatedBy: string | null;
  declare retryCount: number;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DisbursementInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanApplicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'loan_applications', key: 'id' },
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'schools', key: 'id' },
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'parents', key: 'id' },
    },
    amount:   { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'NGN' },
    recipientBankName:      { type: DataTypes.STRING, allowNull: true },
    recipientAccountName:   { type: DataTypes.STRING, allowNull: true },
    recipientAccountNumber: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'successful', 'failed', 'reversed'),
      defaultValue: 'pending',
    },
    disbursedAt:   { type: DataTypes.DATE, allowNull: true },
    failureReason: { type: DataTypes.TEXT, allowNull: true },
    paystackTransferCode:  { type: DataTypes.STRING, allowNull: true },
    paystackTransferId:    { type: DataTypes.STRING, allowNull: true },
    paystackReference:     { type: DataTypes.STRING, allowNull: true, unique: true },
    disbursementReference: { type: DataTypes.STRING, allowNull: true, unique: true },
    reversedAt:     { type: DataTypes.DATE, allowNull: true },
    reversalReason: { type: DataTypes.TEXT, allowNull: true },
    initiatedBy:    { type: DataTypes.UUID, allowNull: true },
    retryCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
    notes:          { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Disbursement',
    tableName: 'disbursements',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['loan_application_id'], unique: true },
      { fields: ['school_id'] },
      { fields: ['status'] },
      {
        fields: ['paystack_reference'],
        unique: true,
        where: { paystack_reference: { [Op.ne]: null } },
      },
    ],
  }
);

export default DisbursementInstance;
