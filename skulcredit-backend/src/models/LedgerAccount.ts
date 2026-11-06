/**
 * LedgerAccount — Chart of Accounts
 *
 * Each account represents a distinct financial bucket in the ledger.
 * These are the standard accounts used in a loan-book / credit-finance operation.
 *
 * Account types:
 *  ASSET     — things we own or are owed (debit increases balance)
 *  LIABILITY — things we owe to others (credit increases balance)
 *  INCOME    — revenue earned (credit increases balance)
 *  EXPENSE   — costs incurred (debit increases balance)
 *  EQUITY    — residual ownership (credit increases balance)
 *
 * Normal-balance convention (matches GAAP):
 *  ASSET / EXPENSE  → normal debit balance
 *  LIABILITY / INCOME / EQUITY → normal credit balance
 */

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type LedgerAccountCode =
  // Assets
  | "CASH_AND_EQUIVALENTS"       
  | "LOANS_RECEIVABLE"           
  | "INTEREST_RECEIVABLE"       
  | "FEE_RECEIVABLE"             
  | "LATE_FEE_RECEIVABLE"        
  | "SUSPENSE_CLEARING"          

  // Liabilities
  | "SCHOOL_PAYABLE"             
  | "UNEARNED_INTEREST"          
  | "REFUND_PAYABLE"             
  | "THIRD_PARTY_PAYABLE"        

  // Income
  | "INTEREST_INCOME"            
  | "SERVICE_CHARGE_INCOME"      
  | "LATE_FEE_INCOME" 
  | "REVERSAL_INCOME" 

  // Expense
  | "FUNDING_COST"   
  | "BAD_DEBT_EXPENSE" 
  | "PROCESSING_EXPENSE"      
  | "WAIVER_EXPENSE";            

export type LedgerAccountType = "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";

export type NormalBalance = "DEBIT" | "CREDIT";

export const ACCOUNT_NORMAL_BALANCE: Record<LedgerAccountType, NormalBalance> = {
  ASSET:     "DEBIT",
  EXPENSE:   "DEBIT",
  LIABILITY: "CREDIT",
  INCOME:    "CREDIT",
  EQUITY:    "CREDIT",
};

export interface AccountSeedEntry {
  code: LedgerAccountCode;
  name: string;
  type: LedgerAccountType;
  normalBalance: NormalBalance;
  description: string;
  accountNumber: string;
}

export const ACCOUNT_SEEDS: AccountSeedEntry[] = [
  {
    code: "CASH_AND_EQUIVALENTS",
    name: "Cash and Equivalents",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "Liquid funds held / available for disbursement (Paystack settlement wallet)",
    accountNumber: "1010",
  },
  {
    code: "LOANS_RECEIVABLE",
    name: "Loans Receivable — Principal",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "Total principal disbursed to schools still outstanding from borrowers",
    accountNumber: "1100",
  },
  {
    code: "INTEREST_RECEIVABLE",
    name: "Interest Receivable",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "Accrued interest earned but not yet collected from borrowers",
    accountNumber: "1110",
  },
  {
    code: "FEE_RECEIVABLE",
    name: "Fee Receivable — Service Charge",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "Service charge / processing fee billed but not yet collected",
    accountNumber: "1120",
  },
  {
    code: "LATE_FEE_RECEIVABLE",
    name: "Late Fee Receivable",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "Penalty / late payment fees charged but not yet collected",
    accountNumber: "1130",
  },
  {
    code: "SUSPENSE_CLEARING",
    name: "Suspense / Clearing Account",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "In-transit or unmatched transactions pending resolution",
    accountNumber: "1900",
  },
 
  {
    code: "SCHOOL_PAYABLE",
    name: "School Fees Payable",
    type: "LIABILITY",
    normalBalance: "CREDIT",
    description: "Approved loan funds set aside for but not yet transferred to schools",
    accountNumber: "2100",
  },
  {
    code: "UNEARNED_INTEREST",
    name: "Unearned Interest Income",
    type: "LIABILITY",
    normalBalance: "CREDIT",
    description: "Interest collected upfront that has not yet been earned over the loan tenor",
    accountNumber: "2200",
  },
  {
    code: "REFUND_PAYABLE",
    name: "Refund Payable",
    type: "LIABILITY",
    normalBalance: "CREDIT",
    description: "Overpayments or prepayments that must be returned to borrowers",
    accountNumber: "2300",
  },
  {
    code: "THIRD_PARTY_PAYABLE",
    name: "Third-Party Settlement Payable",
    type: "LIABILITY",
    normalBalance: "CREDIT",
    description: "Amounts owed to Lendsqr or payment gateway partners",
    accountNumber: "2400",
  },

  {
    code: "INTEREST_INCOME",
    name: "Interest Income",
    type: "INCOME",
    normalBalance: "CREDIT",
    description: "Interest earned on outstanding loan principal",
    accountNumber: "4100",
  },
  {
    code: "SERVICE_CHARGE_INCOME",
    name: "Service Charge Income",
    type: "INCOME",
    normalBalance: "CREDIT",
    description: "Processing / origination fee income",
    accountNumber: "4200",
  },
  {
    code: "LATE_FEE_INCOME",
    name: "Late Fee Income",
    type: "INCOME",
    normalBalance: "CREDIT",
    description: "Penalty income from overdue repayments",
    accountNumber: "4300",
  },
  {
    code: "REVERSAL_INCOME",
    name: "Reversal / Write-back Income",
    type: "INCOME",
    normalBalance: "CREDIT",
    description: "Gains arising from loan reversals or recovered write-offs",
    accountNumber: "4400",
  },
  {
    code: "FUNDING_COST",
    name: "Funding Cost — Interest Expense",
    type: "EXPENSE",
    normalBalance: "DEBIT",
    description: "Interest paid to funders (Lendsqr / funding partners) for loan capital",
    accountNumber: "5100",
  },
  {
    code: "BAD_DEBT_EXPENSE",
    name: "Bad Debt Expense — Write-Off",
    type: "EXPENSE",
    normalBalance: "DEBIT",
    description: "Uncollectible loan principal written off against the receivable",
    accountNumber: "5200",
  },
  {
    code: "PROCESSING_EXPENSE",
    name: "Payment Processing Expense",
    type: "EXPENSE",
    normalBalance: "DEBIT",
    description: "Gateway / transfer fees charged by Paystack or Lendsqr",
    accountNumber: "5300",
  },
  {
    code: "WAIVER_EXPENSE",
    name: "Waiver Expense",
    type: "EXPENSE",
    normalBalance: "DEBIT",
    description: "Late fees or interest waived as a concession to borrowers",
    accountNumber: "5400",
  },
];

export interface LedgerAccountAttributes {
  id: string;
  code: LedgerAccountCode;
  accountNumber: string;
  name: string;
  type: LedgerAccountType;
  normalBalance: NormalBalance;
  description: string | null;
  isActive: boolean;
  currentBalance: number; 
  createdAt?: Date;
  updatedAt?: Date;
}

type LedgerAccountCreationAttributes = Optional<
  LedgerAccountAttributes,
  "id" | "description" | "isActive" | "currentBalance"
>;

export class LedgerAccountInstance
  extends Model<LedgerAccountAttributes, LedgerAccountCreationAttributes>
  implements LedgerAccountAttributes
{
  declare id: string;
  declare code: LedgerAccountCode;
  declare accountNumber: string;
  declare name: string;
  declare type: LedgerAccountType;
  declare normalBalance: NormalBalance;
  declare description: string | null;
  declare isActive: boolean;
  declare currentBalance: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const LEDGER_ACCOUNT_CODES = ACCOUNT_SEEDS.map((s) => s.code) as [
  LedgerAccountCode,
  ...LedgerAccountCode[]
];

export const LEDGER_ACCOUNT_TYPES: LedgerAccountType[] = [
  "ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY",
];

LedgerAccountInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.ENUM(...LEDGER_ACCOUNT_CODES),
      allowNull: false,
      unique: true,
    },
    accountNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      field: "account_number",
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...LEDGER_ACCOUNT_TYPES),
      allowNull: false,
    },
    normalBalance: {
      type: DataTypes.ENUM("DEBIT", "CREDIT"),
      allowNull: false,
      field: "normal_balance",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    currentBalance: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
      defaultValue: 0,
      field: "current_balance",
      comment: "Denormalised running balance. Authoritative value is computed from entries.",
    },
  },
  {
    sequelize,
    modelName: "LedgerAccount",
    tableName: "ledger_accounts",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["code"],           unique: true },
      { fields: ["account_number"], unique: true },
      { fields: ["type"] },
    ],
  },
);

export default LedgerAccountInstance;
