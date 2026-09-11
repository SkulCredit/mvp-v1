import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { LoanOfferStatus, LoanOfferSource } from '../types';

export interface LoanOfferAttributes {
  id: string;
  loanApplicationId: string;
  amountOffered: number;
  processingFee: number;
  interestAmount: number;
  totalRepayable: number;
  interestRate: number;
  tenor: number;
  monthlyInstallment: number;
  firstRepaymentDate: string | null;
  lastRepaymentDate: string | null;
  expiresAt: Date | null;
  status: LoanOfferStatus;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  source: LoanOfferSource;
  lendsqrLoanId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type LoanOfferCreationAttributes = Optional<
  LoanOfferAttributes,
  | 'id'
  | 'processingFee'
  | 'interestAmount'
  | 'interestRate'
  | 'firstRepaymentDate'
  | 'lastRepaymentDate'
  | 'expiresAt'
  | 'status'
  | 'acceptedAt'
  | 'declinedAt'
  | 'source'
  | 'lendsqrLoanId'
>;

export class LoanOfferInstance
  extends Model<LoanOfferAttributes, LoanOfferCreationAttributes>
  implements LoanOfferAttributes {
  declare id: string;
  declare loanApplicationId: string;
  declare amountOffered: number;
  declare processingFee: number;
  declare interestAmount: number;
  declare totalRepayable: number;
  declare interestRate: number;
  declare tenor: number;
  declare monthlyInstallment: number;
  declare firstRepaymentDate: string | null;
  declare lastRepaymentDate: string | null;
  declare expiresAt: Date | null;
  declare status: LoanOfferStatus;
  declare acceptedAt: Date | null;
  declare declinedAt: Date | null;
  declare source: LoanOfferSource;
  declare lendsqrLoanId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LoanOfferInstance.init(
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
      onDelete: 'CASCADE',
    },
    amountOffered:      { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    processingFee:      { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    interestAmount:     { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    totalRepayable:     { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    interestRate:       { type: DataTypes.DECIMAL(5, 4),  allowNull: false, defaultValue: 0 },
    tenor:              { type: DataTypes.INTEGER, allowNull: false },
    monthlyInstallment: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    firstRepaymentDate: { type: DataTypes.DATEONLY, allowNull: true },
    lastRepaymentDate:  { type: DataTypes.DATEONLY, allowNull: true },
    expiresAt:          { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
      defaultValue: 'pending',
    },
    acceptedAt:    { type: DataTypes.DATE, allowNull: true },
    declinedAt:    { type: DataTypes.DATE, allowNull: true },
    source: {
      type: DataTypes.ENUM('automated', 'manual'),
      defaultValue: 'automated',
    },
    lendsqrLoanId: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'LoanOffer',
    tableName: 'loan_offers',
    timestamps: true,
    underscored: true,
  }
);

export default LoanOfferInstance;
