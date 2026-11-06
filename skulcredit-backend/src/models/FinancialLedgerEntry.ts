/**
 * FinancialLedgerEntry — Immutable Double-Entry Journal
 *
 * Every financial event in the system posts one or more journal entries.
 * Each entry is one side of a double-entry pair: every DEBIT is matched
 * by an equal CREDIT posted in the same journalId batch. The sum of all
 * debit amounts in a journal must equal the sum of all credit amounts.
 *
 * Design principles:
 *  1. IMMUTABLE  — rows are never updated. Corrections are made by posting
 *                  a reversal entry (type = REVERSAL) referencing the original.
 *  2. TRACEABLE  — every entry links back to the originating business event
 *                  (disbursement, repayment, loan application) via sourceType/sourceId.
 *  3. SEQUENTIAL — entrySequence is a monotonically increasing integer per loan
 *                  account, enabling gap detection and completeness checks.
 *  4. BALANCED   — the LedgerService enforces debit == credit before committing
 *                  any journal batch.
 *
 * Entry types and their standard posting patterns:
 *
 *  LOAN_DISBURSEMENT
 *    DR  LOANS_RECEIVABLE        (principal disbursed)
 *    DR  FEE_RECEIVABLE          (service charge due)
 *    CR  CASH_AND_EQUIVALENTS    (cash out to school)
 *    CR  SERVICE_CHARGE_INCOME   (fee recognised at origination)
 *
 *  REPAYMENT_PRINCIPAL
 *    DR  CASH_AND_EQUIVALENTS    (cash received)
 *    CR  LOANS_RECEIVABLE        (reduce outstanding principal)
 *
 *  REPAYMENT_INTEREST
 *    DR  CASH_AND_EQUIVALENTS    (cash received)
 *    CR  INTEREST_RECEIVABLE     (reduce accrued interest)
 *    CR  INTEREST_INCOME         (interest earned recognised)
 *
 *  REPAYMENT_FEE
 *    DR  CASH_AND_EQUIVALENTS    (cash received)
 *    CR  FEE_RECEIVABLE          (service fee collected)
 *
 *  INTEREST_ACCRUAL  (daily/monthly)
 *    DR  INTEREST_RECEIVABLE     (accrue interest)
 *    CR  UNEARNED_INTEREST       (deferred until collected)
 *
 *  LATE_FEE_CHARGE
 *    DR  LATE_FEE_RECEIVABLE     (charge the borrower)
 *    CR  LATE_FEE_INCOME         (recognise the income)
 *
 *  WAIVER
 *    DR  WAIVER_EXPENSE          (concession cost to us)
 *    CR  LATE_FEE_RECEIVABLE     (reduce what borrower owes)
 *
 *  WRITE_OFF
 *    DR  BAD_DEBT_EXPENSE        (recognise the loss)
 *    CR  LOANS_RECEIVABLE        (remove from books)
 *
 *  REVERSAL
 *    Mirror image of the original entry — exact same amounts with
 *    DR/CR swapped. References originalEntryId.
 *
 *  SUSPENSE_HOLD / SUSPENSE_RELEASE
 *    Used for in-transit funds pending reconciliation.
 */

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { LedgerAccountCode } from "./LedgerAccount";


export type LedgerEntryType =
  | "LOAN_DISBURSEMENT"
  | "REPAYMENT_PRINCIPAL" 
  | "REPAYMENT_INTEREST" 
  | "REPAYMENT_FEE" 
  | "INTEREST_ACCRUAL" 
  | "LATE_FEE_CHARGE"
  | "LATE_FEE_COLLECTION" 
  | "WAIVER"
  | "WRITE_OFF" 
  | "REVERSAL"
  | "SUSPENSE_HOLD"
  | "SUSPENSE_RELEASE" 
  | "ADJUSTMENT"; 

export type LedgerEntrySide = "DEBIT" | "CREDIT";

export type LedgerEntryActor =
  | "SYSTEM"
  | "ADMIN"
  | "LENDSQR"
  | "PARENT"
  | "SCHEDULER"; 

// Source (originating) entity types
export type LedgerSourceType =
  | "LoanApplication"
  | "Disbursement"
  | "Repayment"
  | "RepaymentSchedule"
  | "LoanLedger"
  | "Manual";

// Reconciliation status
export type LedgerReconciliationStatus =
  | "UNRECONCILED" 
  | "RECONCILED" 
  | "DISPUTED" 
  | "WRITTEN_OFF"; 

export const LEDGER_ENTRY_TYPES: LedgerEntryType[] = [
  "LOAN_DISBURSEMENT",
  "REPAYMENT_PRINCIPAL",
  "REPAYMENT_INTEREST",
  "REPAYMENT_FEE",
  "INTEREST_ACCRUAL",
  "LATE_FEE_CHARGE",
  "LATE_FEE_COLLECTION",
  "WAIVER",
  "WRITE_OFF",
  "REVERSAL",
  "SUSPENSE_HOLD",
  "SUSPENSE_RELEASE",
  "ADJUSTMENT",
];

export const LEDGER_ENTRY_ACTORS: LedgerEntryActor[] = [
  "SYSTEM",
  "ADMIN",
  "LENDSQR",
  "PARENT",
  "SCHEDULER",
];

export const LEDGER_SOURCE_TYPES: LedgerSourceType[] = [
  "LoanApplication",
  "Disbursement",
  "Repayment",
  "RepaymentSchedule",
  "LoanLedger",
  "Manual",
];

export const LEDGER_RECONCILIATION_STATUSES: LedgerReconciliationStatus[] = [
  "UNRECONCILED",
  "RECONCILED",
  "DISPUTED",
  "WRITTEN_OFF",
];

export interface FinancialLedgerEntryAttributes {
  id: string;
  journalId: string;
  entrySequence: number;
  accountCode: LedgerAccountCode;
  accountId: string; 
  side: LedgerEntrySide;
  amount: number;
  currency: string; 
  runningBalance: number;
  entryType: LedgerEntryType;
  principalComponent: number | null;
  interestComponent: number | null;
  feeComponent: number | null;
  lateFeeComponent: number | null;
  loanApplicationId: string | null; 
  sourceType: LedgerSourceType; 
  sourceId: string; 
  externalReference: string | null; 
  internalReference: string | null; 
  originalEntryId: string | null;
  isReversed: boolean;
  actor: LedgerEntryActor;
  actorId: string | null; 
  actorName: string | null; 
  reconciliationStatus: LedgerReconciliationStatus;
  reconciledAt: Date | null;
  reconciledBy: string | null;
  bankStatementRef: string | null;
  description: string; 
  notes: string | null; 
  effectiveDate: Date;
  createdAt?: Date;

}

type FinancialLedgerEntryCreationAttributes = Optional<
  FinancialLedgerEntryAttributes,
  | "id"
  | "entrySequence"
  | "currency"
  | "runningBalance"
  | "principalComponent"
  | "interestComponent"
  | "feeComponent"
  | "lateFeeComponent"
  | "loanApplicationId"
  | "externalReference"
  | "internalReference"
  | "originalEntryId"
  | "isReversed"
  | "actorId"
  | "actorName"
  | "reconciliationStatus"
  | "reconciledAt"
  | "reconciledBy"
  | "bankStatementRef"
  | "notes"
>;

export class FinancialLedgerEntryInstance
  extends Model<
    FinancialLedgerEntryAttributes,
    FinancialLedgerEntryCreationAttributes
  >
  implements FinancialLedgerEntryAttributes
{
  declare id: string;
  declare journalId: string;
  declare entrySequence: number;
  declare accountCode: LedgerAccountCode;
  declare accountId: string;
  declare side: LedgerEntrySide;
  declare amount: number;
  declare currency: string;
  declare runningBalance: number;
  declare entryType: LedgerEntryType;
  declare principalComponent: number | null;
  declare interestComponent: number | null;
  declare feeComponent: number | null;
  declare lateFeeComponent: number | null;
  declare loanApplicationId: string | null;
  declare sourceType: LedgerSourceType;
  declare sourceId: string;
  declare externalReference: string | null;
  declare internalReference: string | null;
  declare originalEntryId: string | null;
  declare isReversed: boolean;
  declare actor: LedgerEntryActor;
  declare actorId: string | null;
  declare actorName: string | null;
  declare reconciliationStatus: LedgerReconciliationStatus;
  declare reconciledAt: Date | null;
  declare reconciledBy: string | null;
  declare bankStatementRef: string | null;
  declare description: string;
  declare notes: string | null;
  declare effectiveDate: Date;
  declare readonly createdAt: Date;
}

FinancialLedgerEntryInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    journalId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "journal_id",
      comment:
        "UUID shared by all entries in the same double-entry posting batch",
    },
    entrySequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "entry_sequence",
    },
    accountCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "account_code",
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "account_id",
      references: { model: "ledger_accounts", key: "id" },
    },
    side: {
      type: DataTypes.ENUM("DEBIT", "CREDIT"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "NGN",
    },
    runningBalance: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: false,
      defaultValue: 0,
      field: "running_balance",
      comment: "Account balance after this entry; positive = debit balance",
    },
    entryType: {
      type: DataTypes.ENUM(...LEDGER_ENTRY_TYPES),
      allowNull: false,
      field: "entry_type",
    },
    principalComponent: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: true,
      field: "principal_component",
    },
    interestComponent: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: true,
      field: "interest_component",
    },
    feeComponent: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: true,
      field: "fee_component",
    },
    lateFeeComponent: {
      type: DataTypes.DECIMAL(20, 4),
      allowNull: true,
      field: "late_fee_component",
    },
    loanApplicationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "loan_application_id",
      references: { model: "loan_applications", key: "id" },
    },
    sourceType: {
      type: DataTypes.ENUM(...LEDGER_SOURCE_TYPES),
      allowNull: false,
      field: "source_type",
    },
    sourceId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "source_id",
    },
    externalReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "external_reference",
    },
    internalReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "internal_reference",
    },
    originalEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "original_entry_id",
    },
    isReversed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_reversed",
    },
    actor: {
      type: DataTypes.ENUM(...LEDGER_ENTRY_ACTORS),
      allowNull: false,
    },
    actorId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "actor_id",
    },
    actorName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "actor_name",
    },
    reconciliationStatus: {
      type: DataTypes.ENUM(...LEDGER_RECONCILIATION_STATUSES),
      allowNull: false,
      defaultValue: "UNRECONCILED",
      field: "reconciliation_status",
    },
    reconciledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reconciled_at",
    },
    reconciledBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "reconciled_by",
    },
    bankStatementRef: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "bank_statement_ref",
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "effective_date",
    },
  },
  {
    sequelize,
    modelName: "FinancialLedgerEntry",
    tableName: "financial_ledger_entries",
    timestamps: true,
    underscored: true,
    updatedAt: false, 
    indexes: [
      // Fast loan-level statement
      { fields: ["loan_application_id", "entry_sequence"] },
      // Account history
      { fields: ["account_id", "effective_date"] },
      { fields: ["account_code"] },
      // Journal grouping
      { fields: ["journal_id"] },
      // Source tracing
      { fields: ["source_type", "source_id"] },
      // External reference lookup (Paystack / Lendsqr)
      { fields: ["external_reference"] },
      // Reconciliation queue
      { fields: ["reconciliation_status"] },
      // Reversal chain
      { fields: ["original_entry_id"] },
    ],
  },
);

export default FinancialLedgerEntryInstance;
