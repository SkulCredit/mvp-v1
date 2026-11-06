/**
 * LedgerService — Corporate Double-Entry Financial Ledger Engine
 *
 * Every monetary event in SkulCredit is recorded here as an immutable
 * journal entry.  The core invariant is always enforced:
 *
 *   ∑ DEBIT amounts in a journal == ∑ CREDIT amounts in the same journal
 *
 * Public surface:
 *   postDisbursement()       — loan paid out to school
 *   postRepayment()          — borrower repayment received
 *   postInterestAccrual()    — scheduled monthly interest accrual
 *   postLateFeeCharge()      — late / penalty fee charged
 *   postLateFeeCollection()  — late fee actually collected
 *   postWaiver()             — fee or interest waiver granted
 *   postWriteOff()           — bad debt write-off
 *   postReversal()           — full reversal of a prior journal
 *   postSuspenseHold()       — move to suspense clearing
 *   postSuspenseRelease()    — release from suspense clearing
 *   postAdjustment()         — manual correction (admin, with mandatory note)
 *
 *   getRunningBalance()          — current balance for one account
 *   getLoanAccountStatement()    — full entry history for a loan
 *   getLoanSummary()             — outstanding principal/interest/fees for a loan
 *   getAccountStatement()        — full entry history for a ledger account
 *   getTrialBalance()            — all account balances (DR vs CR)
 *   reconcileEntry()             — mark an entry as matched to a bank statement
 *   seedAccounts()               — upsert the chart of accounts (run on startup)
 */

import { Op, Transaction } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "../config/db";
import LedgerAccount, {
  LedgerAccountCode,
  ACCOUNT_SEEDS,
  NormalBalance,
} from "../models/LedgerAccount";
import FinancialLedgerEntry, {
  LedgerEntryType,
  LedgerEntryActor,
  LedgerSourceType,
  LedgerReconciliationStatus,
} from "../models/FinancialLedgerEntry";
import logger from "../config/logger";


interface RawEntryInput {
  accountCode: LedgerAccountCode;
  side: "DEBIT" | "CREDIT";
  amount: number;
  entryType: LedgerEntryType;
  description: string;
  principalComponent?: number;
  interestComponent?: number;
  feeComponent?: number;
  lateFeeComponent?: number;
}

interface JournalContext {
  journalId: string;
  loanApplicationId?: string;
  sourceType: LedgerSourceType;
  sourceId: string;
  externalReference?: string;
  internalReference?: string;
  actor: LedgerEntryActor;
  actorId?: string;
  actorName?: string;
  effectiveDate?: Date;
  notes?: string;
  originalEntryId?: string;
}

class LedgerService {
  
  async seedAccounts(): Promise<void> {
    for (const seed of ACCOUNT_SEEDS) {
      await LedgerAccount.upsert({
        code: seed.code,
        accountNumber: seed.accountNumber,
        name: seed.name,
        type: seed.type,
        normalBalance: seed.normalBalance,
        description: seed.description,
        isActive: true,
        currentBalance: 0,
      } as never);
    }
    logger.info(`[ledger] Chart of accounts seeded — ${ACCOUNT_SEEDS.length} accounts`);
  }

  private async postJournal(
    entries: RawEntryInput[],
    ctx: JournalContext,
    externalTx?: Transaction,
  ): Promise<FinancialLedgerEntry[]> {
    const totalDebits  = entries.filter(e => e.side === "DEBIT").reduce((s, e) => s + e.amount, 0);
    const totalCredits = entries.filter(e => e.side === "CREDIT").reduce((s, e) => s + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new Error(
        `[ledger] Journal ${ctx.journalId} does not balance: DR=${totalDebits} CR=${totalCredits}`,
      );
    }

    const run = async (t: Transaction) => {
      const posted: FinancialLedgerEntry[] = [];

      for (const raw of entries) {
        const account = await LedgerAccount.findOne({
          where: { code: raw.accountCode },
          transaction: t,
          lock: true,   
        });

        if (!account) {
          throw new Error(`[ledger] Account not found: ${raw.accountCode}. Run seedAccounts() first.`);
        }

        const normalBalance: NormalBalance = account.normalBalance;
        const delta =
          (raw.side === normalBalance) ? raw.amount : -raw.amount;

        const newBalance = Number(account.currentBalance) + delta;

        let nextSeq = 1;
        if (ctx.loanApplicationId) {
          const lastEntry = await FinancialLedgerEntry.findOne({
            where: { loanApplicationId: ctx.loanApplicationId },
            order: [["entry_sequence", "DESC"]],
            transaction: t,
          });
          nextSeq = lastEntry ? lastEntry.entrySequence + 1 : 1;
        }

        const entry = await FinancialLedgerEntry.create(
          {
            journalId:          ctx.journalId,
            entrySequence:      nextSeq,
            accountCode:        raw.accountCode,
            accountId:          account.id,
            side:               raw.side,
            amount:             raw.amount,
            currency:           "NGN",
            runningBalance:     newBalance,
            entryType:          raw.entryType,
            principalComponent: raw.principalComponent ?? null,
            interestComponent:  raw.interestComponent  ?? null,
            feeComponent:       raw.feeComponent       ?? null,
            lateFeeComponent:   raw.lateFeeComponent   ?? null,
            loanApplicationId:  ctx.loanApplicationId ?? null,
            sourceType:         ctx.sourceType,
            sourceId:           ctx.sourceId,
            externalReference:  ctx.externalReference ?? null,
            internalReference:  ctx.internalReference ?? null,
            originalEntryId:    ctx.originalEntryId   ?? null,
            isReversed:         false,
            actor:              ctx.actor,
            actorId:            ctx.actorId   ?? null,
            actorName:          ctx.actorName ?? null,
            reconciliationStatus: "UNRECONCILED",
            reconciledAt:       null,
            reconciledBy:       null,
            bankStatementRef:   null,
            description:        raw.description,
            notes:              ctx.notes ?? null,
            effectiveDate:      ctx.effectiveDate ?? new Date(),
          },
          { transaction: t },
        );

        await account.update({ currentBalance: newBalance }, { transaction: t });

        posted.push(entry);
      }

      return posted;
    };

    return externalTx ? run(externalTx) : sequelize.transaction(run);
  }

  async postDisbursement(params: {
    loanApplicationId: string;
    disbursementId: string;
    disbursementRef: string;
    paystackRef?: string;
    principalAmount: number;
    serviceChargeAmount?: number;
    actor?: LedgerEntryActor;
    actorId?: string;
    actorName?: string;
    effectiveDate?: Date;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const {
      loanApplicationId,
      disbursementId,
      disbursementRef,
      paystackRef,
      principalAmount,
      serviceChargeAmount = 0,
      actor = "SYSTEM",
      actorId,
      actorName,
      effectiveDate,
      externalTx,
    } = params;

    const journalId = uuidv4();
    const totalCashOut = principalAmount + serviceChargeAmount;

    const entries: RawEntryInput[] = [
      {
        accountCode: "LOANS_RECEIVABLE",
        side: "DEBIT",
        amount: principalAmount,
        entryType: "LOAN_DISBURSEMENT",
        description: `Loan principal disbursed — ${disbursementRef}`,
        principalComponent: principalAmount,
      },
    ];

    if (serviceChargeAmount > 0) {
      entries.push({
        accountCode: "FEE_RECEIVABLE",
        side: "DEBIT",
        amount: serviceChargeAmount,
        entryType: "LOAN_DISBURSEMENT",
        description: `Service charge receivable — ${disbursementRef}`,
        feeComponent: serviceChargeAmount,
      });
    }

    entries.push({
      accountCode: "CASH_AND_EQUIVALENTS",
      side: "CREDIT",
      amount: totalCashOut,
      entryType: "LOAN_DISBURSEMENT",
      description: `Cash paid out to school — ${disbursementRef}`,
      principalComponent: principalAmount,
      feeComponent: serviceChargeAmount || undefined,
    });

    if (serviceChargeAmount > 0) {
      entries.push({
        accountCode: "SERVICE_CHARGE_INCOME",
        side: "CREDIT",
        amount: serviceChargeAmount,
        entryType: "LOAN_DISBURSEMENT",
        description: `Service charge income recognised — ${disbursementRef}`,
        feeComponent: serviceChargeAmount,
      });
    }

    logger.info(
      `[ledger] Posting DISBURSEMENT journal=${journalId} loan=${loanApplicationId} ` +
      `principal=${principalAmount} fee=${serviceChargeAmount}`,
    );

    return this.postJournal(entries, {
      journalId,
      loanApplicationId,
      sourceType: "Disbursement",
      sourceId: disbursementId,
      externalReference: paystackRef,
      internalReference: disbursementRef,
      actor,
      actorId,
      actorName,
      effectiveDate,
    }, externalTx);
  }

  async postRepayment(params: {
    loanApplicationId: string;
    repaymentId: string;
    receiptNumber?: string;
    paystackRef?: string;
    totalAmount: number;
    principalComponent: number;
    interestComponent?: number;
    feeComponent?: number;
    lateFeeComponent?: number;
    actor?: LedgerEntryActor;
    actorId?: string;
    actorName?: string;
    effectiveDate?: Date;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const {
      loanApplicationId,
      repaymentId,
      receiptNumber,
      paystackRef,
      totalAmount,
      principalComponent,
      interestComponent  = 0,
      feeComponent       = 0,
      lateFeeComponent   = 0,
      actor              = "SYSTEM",
      actorId,
      actorName,
      effectiveDate,
      externalTx,
    } = params;

    const journalId = uuidv4();
    const ref = receiptNumber ?? repaymentId;

    const entries: RawEntryInput[] = [
      // Cash received from borrower
      {
        accountCode: "CASH_AND_EQUIVALENTS",
        side: "DEBIT",
        amount: totalAmount,
        entryType: "REPAYMENT_PRINCIPAL",
        description: `Repayment received — ${ref}`,
        principalComponent,
        interestComponent: interestComponent || undefined,
        feeComponent: feeComponent || undefined,
        lateFeeComponent: lateFeeComponent || undefined,
      },
    ];

    if (principalComponent > 0) {
      entries.push({
        accountCode: "LOANS_RECEIVABLE",
        side: "CREDIT",
        amount: principalComponent,
        entryType: "REPAYMENT_PRINCIPAL",
        description: `Principal repaid — ${ref}`,
        principalComponent,
      });
    }

    if (interestComponent > 0) {
      entries.push({
        accountCode: "INTEREST_RECEIVABLE",
        side: "CREDIT",
        amount: interestComponent,
        entryType: "REPAYMENT_INTEREST",
        description: `Interest receivable cleared — ${ref}`,
        interestComponent,
      });
      entries.push({
        accountCode: "INTEREST_INCOME",
        side: "CREDIT",
        amount: interestComponent,
        entryType: "REPAYMENT_INTEREST",
        description: `Interest income recognised on collection — ${ref}`,
        interestComponent,
      });

      entries.push({
        accountCode: "UNEARNED_INTEREST",
        side: "DEBIT",
        amount: interestComponent,
        entryType: "REPAYMENT_INTEREST",
        description: `Unearned interest liability released on collection — ${ref}`,
        interestComponent,
      });
    }

    if (feeComponent > 0) {
      entries.push({
        accountCode: "FEE_RECEIVABLE",
        side: "CREDIT",
        amount: feeComponent,
        entryType: "REPAYMENT_FEE",
        description: `Service fee collected — ${ref}`,
        feeComponent,
      });
    }

    if (lateFeeComponent > 0) {
      entries.push({
        accountCode: "LATE_FEE_RECEIVABLE",
        side: "CREDIT",
        amount: lateFeeComponent,
        entryType: "LATE_FEE_COLLECTION",
        description: `Late fee collected — ${ref}`,
        lateFeeComponent,
      });
    }

    logger.info(
      `[ledger] Posting REPAYMENT journal=${journalId} loan=${loanApplicationId} ` +
      `total=${totalAmount} principal=${principalComponent} interest=${interestComponent} ` +
      `fee=${feeComponent} lateFee=${lateFeeComponent}`,
    );

    return this.postJournal(entries, {
      journalId,
      loanApplicationId,
      sourceType: "Repayment",
      sourceId: repaymentId,
      externalReference: paystackRef,
      internalReference: receiptNumber,
      actor,
      actorId,
      actorName,
      effectiveDate,
    }, externalTx);
  }

  async postInterestAccrual(params: {
    loanApplicationId: string;
    scheduleId: string;
    amount: number;
    actor?: LedgerEntryActor;
    effectiveDate?: Date;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const { loanApplicationId, scheduleId, amount, actor = "SCHEDULER", effectiveDate, externalTx } = params;
    const journalId = uuidv4();

    return this.postJournal(
      [
        {
          accountCode: "INTEREST_RECEIVABLE",
          side: "DEBIT",
          amount,
          entryType: "INTEREST_ACCRUAL",
          description: `Monthly interest accrual — schedule ${scheduleId}`,
          interestComponent: amount,
        },
        {
          accountCode: "UNEARNED_INTEREST",
          side: "CREDIT",
          amount,
          entryType: "INTEREST_ACCRUAL",
          description: `Unearned interest liability — schedule ${scheduleId}`,
          interestComponent: amount,
        },
      ],
      {
        journalId,
        loanApplicationId,
        sourceType: "RepaymentSchedule",
        sourceId: scheduleId,
        actor,
        effectiveDate,
      },
      externalTx,
    );
  }

  async postLateFeeCharge(params: {
    loanApplicationId: string;
    scheduleId: string;
    amount: number;
    actor?: LedgerEntryActor;
    actorId?: string;
    effectiveDate?: Date;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const { loanApplicationId, scheduleId, amount, actor = "SYSTEM", actorId, effectiveDate, externalTx } = params;
    const journalId = uuidv4();

    return this.postJournal(
      [
        {
          accountCode: "LATE_FEE_RECEIVABLE",
          side: "DEBIT",
          amount,
          entryType: "LATE_FEE_CHARGE",
          description: `Late fee charged — installment ${scheduleId}`,
          lateFeeComponent: amount,
        },
        {
          accountCode: "LATE_FEE_INCOME",
          side: "CREDIT",
          amount,
          entryType: "LATE_FEE_CHARGE",
          description: `Late fee income recognised — installment ${scheduleId}`,
          lateFeeComponent: amount,
        },
      ],
      {
        journalId,
        loanApplicationId,
        sourceType: "RepaymentSchedule",
        sourceId: scheduleId,
        actor,
        actorId,
        effectiveDate,
      },
      externalTx,
    );
  }

  async postWaiver(params: {
    loanApplicationId: string;
    scheduleId: string;
    amount: number;
    waivingType: "LATE_FEE" | "INTEREST";
    reason: string;
    actorId: string;
    actorName?: string;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const {
      loanApplicationId,
      scheduleId,
      amount,
      waivingType,
      reason,
      actorId,
      actorName,
      externalTx,
    } = params;

    const journalId = uuidv4();
    const creditAccount: LedgerAccountCode =
      waivingType === "INTEREST" ? "INTEREST_RECEIVABLE" : "LATE_FEE_RECEIVABLE";
    const componentKey = waivingType === "INTEREST" ? "interestComponent" : "lateFeeComponent";

    return this.postJournal(
      [
        {
          accountCode: "WAIVER_EXPENSE",
          side: "DEBIT",
          amount,
          entryType: "WAIVER",
          description: `${waivingType} waiver granted — ${reason}`,
          [componentKey]: amount,
        },
        {
          accountCode: creditAccount,
          side: "CREDIT",
          amount,
          entryType: "WAIVER",
          description: `${waivingType} receivable waived — ${reason}`,
          [componentKey]: amount,
        },
      ],
      {
        journalId,
        loanApplicationId,
        sourceType: "RepaymentSchedule",
        sourceId: scheduleId,
        actor: "ADMIN",
        actorId,
        actorName,
        notes: reason,
      },
      externalTx,
    );
  }

  async postWriteOff(params: {
    loanApplicationId: string;
    outstandingPrincipal: number;
    outstandingInterest?: number;
    reason: string;
    actorId: string;
    actorName?: string;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const {
      loanApplicationId,
      outstandingPrincipal,
      outstandingInterest = 0,
      reason,
      actorId,
      actorName,
      externalTx,
    } = params;

    const journalId = uuidv4();
    const entries: RawEntryInput[] = [
      {
        accountCode: "BAD_DEBT_EXPENSE",
        side: "DEBIT",
        amount: outstandingPrincipal,
        entryType: "WRITE_OFF",
        description: `Bad debt write-off — principal — ${reason}`,
        principalComponent: outstandingPrincipal,
      },
      {
        accountCode: "LOANS_RECEIVABLE",
        side: "CREDIT",
        amount: outstandingPrincipal,
        entryType: "WRITE_OFF",
        description: `Loan receivable written off — ${reason}`,
        principalComponent: outstandingPrincipal,
      },
    ];

    if (outstandingInterest > 0) {
      entries.push(
        {
          accountCode: "BAD_DEBT_EXPENSE",
          side: "DEBIT",
          amount: outstandingInterest,
          entryType: "WRITE_OFF",
          description: `Bad debt write-off — interest — ${reason}`,
          interestComponent: outstandingInterest,
        },
        {
          accountCode: "INTEREST_RECEIVABLE",
          side: "CREDIT",
          amount: outstandingInterest,
          entryType: "WRITE_OFF",
          description: `Interest receivable written off — ${reason}`,
          interestComponent: outstandingInterest,
        },
      );
    }

    return this.postJournal(entries, {
      journalId,
      loanApplicationId,
      sourceType: "LoanApplication",
      sourceId: loanApplicationId,
      actor: "ADMIN",
      actorId,
      actorName,
      notes: reason,
    }, externalTx);
  }

  async postReversal(params: {
    originalJournalId: string;
    loanApplicationId: string;
    reason: string;
    actorId: string;
    actorName?: string;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const { originalJournalId, loanApplicationId, reason, actorId, actorName, externalTx } = params;

    const run = async (t: Transaction) => {
      const originals = await FinancialLedgerEntry.findAll({
        where: { journalId: originalJournalId },
        transaction: t,
      });

      if (originals.length === 0) {
        throw new Error(`[ledger] No entries found for journal ${originalJournalId}`);
      }

      const mirrorEntries: RawEntryInput[] = originals.map((e) => ({
        accountCode: e.accountCode as LedgerAccountCode,
        side: e.side === "DEBIT" ? "CREDIT" : "DEBIT",
        amount: Number(e.amount),
        entryType: "REVERSAL" as LedgerEntryType,
        description: `REVERSAL of entry ${e.id} — ${reason}`,
        principalComponent: e.principalComponent ? Number(e.principalComponent) : undefined,
        interestComponent:  e.interestComponent  ? Number(e.interestComponent)  : undefined,
        feeComponent:       e.feeComponent        ? Number(e.feeComponent)       : undefined,
        lateFeeComponent:   e.lateFeeComponent    ? Number(e.lateFeeComponent)   : undefined,
      }));

      const reversalJournalId = uuidv4();
      const posted = await this.postJournal(
        mirrorEntries,
        {
          journalId: reversalJournalId,
          loanApplicationId,
          sourceType: "LoanApplication",
          sourceId: loanApplicationId,
          originalEntryId: originalJournalId,
          actor: "ADMIN",
          actorId,
          actorName,
          notes: reason,
        },
        t,
      );
      for (const orig of originals) {
        await orig.update({ isReversed: true }, { transaction: t });
      }

      logger.info(
        `[ledger] Reversed journal ${originalJournalId} → new journal ${reversalJournalId} (${reason})`,
      );

      return posted;
    };

    return externalTx ? run(externalTx) : sequelize.transaction(run);
  }

  async postSuspenseHold(params: {
    loanApplicationId?: string;
    sourceId: string;
    amount: number;
    externalReference?: string;
    description: string;
    actorId?: string;
    effectiveDate?: Date;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const journalId = uuidv4();
    return this.postJournal(
      [
        {
          accountCode: "SUSPENSE_CLEARING",
          side: "DEBIT",
          amount: params.amount,
          entryType: "SUSPENSE_HOLD",
          description: params.description,
        },
        {
          accountCode: "CASH_AND_EQUIVALENTS",
          side: "CREDIT",
          amount: params.amount,
          entryType: "SUSPENSE_HOLD",
          description: params.description,
        },
      ],
      {
        journalId,
        loanApplicationId: params.loanApplicationId,
        sourceType: "Manual",
        sourceId: params.sourceId,
        externalReference: params.externalReference,
        actor: "SYSTEM",
        actorId: params.actorId,
        effectiveDate: params.effectiveDate,
      },
      params.externalTx,
    );
  }

  async postSuspenseRelease(params: {
    loanApplicationId: string;
    sourceId: string;
    amount: number;
    externalReference?: string;
    description: string;
    actorId?: string;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    const journalId = uuidv4();
    return this.postJournal(
      [
        {
          accountCode: "CASH_AND_EQUIVALENTS",
          side: "DEBIT",
          amount: params.amount,
          entryType: "SUSPENSE_RELEASE",
          description: params.description,
        },
        {
          accountCode: "SUSPENSE_CLEARING",
          side: "CREDIT",
          amount: params.amount,
          entryType: "SUSPENSE_RELEASE",
          description: params.description,
        },
      ],
      {
        journalId,
        loanApplicationId: params.loanApplicationId,
        sourceType: "Manual",
        sourceId: params.sourceId,
        externalReference: params.externalReference,
        actor: "ADMIN",
        actorId: params.actorId,
      },
      params.externalTx,
    );
  }

  async postAdjustment(params: {
    loanApplicationId?: string;
    sourceId: string;
    debitAccount: LedgerAccountCode;
    creditAccount: LedgerAccountCode;
    amount: number;
    description: string;
    note: string;
    actorId: string;
    actorName?: string;
    externalTx?: Transaction;
  }): Promise<FinancialLedgerEntry[]> {
    if (!params.note?.trim()) {
      throw new Error("[ledger] ADJUSTMENT entry requires a non-empty note.");
    }

    const journalId = uuidv4();
    return this.postJournal(
      [
        {
          accountCode: params.debitAccount,
          side: "DEBIT",
          amount: params.amount,
          entryType: "ADJUSTMENT",
          description: params.description,
        },
        {
          accountCode: params.creditAccount,
          side: "CREDIT",
          amount: params.amount,
          entryType: "ADJUSTMENT",
          description: params.description,
        },
      ],
      {
        journalId,
        loanApplicationId: params.loanApplicationId,
        sourceType: "Manual",
        sourceId: params.sourceId,
        actor: "ADMIN",
        actorId: params.actorId,
        actorName: params.actorName,
        notes: params.note,
      },
      params.externalTx,
    );
  }


  async getRunningBalance(accountCode: LedgerAccountCode): Promise<number> {
    const account = await LedgerAccount.findOne({ where: { code: accountCode } });
    return account ? Number(account.currentBalance) : 0;
  }

  async getLoanAccountStatement(params: {
    loanApplicationId: string;
    fromDate?: Date;
    toDate?: Date;
    accountCode?: LedgerAccountCode;
    entryType?: LedgerEntryType;
    page?: number;
    limit?: number;
  }) {
    const {
      loanApplicationId,
      fromDate,
      toDate,
      accountCode,
      entryType,
      page = 1,
      limit = 100,
    } = params;

    const where: Record<string, unknown> = { loanApplicationId };
    if (accountCode) where.accountCode = accountCode;
    if (entryType)   where.entryType   = entryType;
    if (fromDate || toDate) {
      where.effectiveDate = {
        ...(fromDate ? { [Op.gte]: fromDate } : {}),
        ...(toDate   ? { [Op.lte]: toDate   } : {}),
      };
    }

    const { count, rows } = await FinancialLedgerEntry.findAndCountAll({
      where,
      order: [["entry_sequence", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      entries: rows.map(this._formatEntry),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  async getLoanSummary(loanApplicationId: string): Promise<{
    outstandingPrincipal: number;
    outstandingInterest: number;
    outstandingFees: number;
    outstandingLateFees: number;
    totalDisbursed: number;
    totalRepaid: number;
    totalInterestCollected: number;
    isFullyRepaid: boolean;
  }> {
    const entries = await FinancialLedgerEntry.findAll({
      where: { loanApplicationId },
      attributes: [
        "side", "amount", "entryType",
        "principalComponent", "interestComponent",
        "feeComponent", "lateFeeComponent", "accountCode",
      ],
    });

    let disbursedPrincipal   = 0;
    let repaidPrincipal      = 0;
    let accruedInterest      = 0;
    let collectedInterest    = 0;
    let chargedFees          = 0;
    let collectedFees        = 0;
    let chargedLateFees      = 0;
    let collectedLateFees    = 0;
    let waivedLateFees       = 0;
    let waivedInterest       = 0;
    let writtenOffPrincipal  = 0;

    for (const e of entries) {
      const amt = Number(e.amount);
      switch (e.entryType) {
        case "LOAN_DISBURSEMENT":
          if (e.accountCode === "LOANS_RECEIVABLE" && e.side === "DEBIT") disbursedPrincipal += amt;
          if (e.accountCode === "FEE_RECEIVABLE"   && e.side === "DEBIT") chargedFees += amt;
          break;
        case "REPAYMENT_PRINCIPAL":
          if (e.accountCode === "LOANS_RECEIVABLE" && e.side === "CREDIT") repaidPrincipal += amt;
          break;
        case "REPAYMENT_INTEREST":
          if (e.accountCode === "INTEREST_RECEIVABLE" && e.side === "CREDIT") collectedInterest += amt;
          break;
        case "REPAYMENT_FEE":
          if (e.accountCode === "FEE_RECEIVABLE" && e.side === "CREDIT") collectedFees += amt;
          break;
        case "LATE_FEE_COLLECTION":
          if (e.accountCode === "LATE_FEE_RECEIVABLE" && e.side === "CREDIT") collectedLateFees += amt;
          break;
        case "INTEREST_ACCRUAL":
          if (e.accountCode === "INTEREST_RECEIVABLE" && e.side === "DEBIT") accruedInterest += amt;
          break;
        case "LATE_FEE_CHARGE":
          if (e.accountCode === "LATE_FEE_RECEIVABLE" && e.side === "DEBIT") chargedLateFees += amt;
          break;
        case "WAIVER":
          if (e.accountCode === "LATE_FEE_RECEIVABLE" && e.side === "CREDIT") waivedLateFees += amt;
          if (e.accountCode === "INTEREST_RECEIVABLE"  && e.side === "CREDIT") waivedInterest += amt;
          break;
        case "WRITE_OFF":
          if (e.accountCode === "LOANS_RECEIVABLE" && e.side === "CREDIT") writtenOffPrincipal += amt;
          break;
      }
    }

    const outstandingPrincipal  = Math.max(0, disbursedPrincipal - repaidPrincipal - writtenOffPrincipal);
    const outstandingInterest   = Math.max(0, accruedInterest    - collectedInterest - waivedInterest);
    const outstandingFees       = Math.max(0, chargedFees        - collectedFees);
    const outstandingLateFees   = Math.max(0, chargedLateFees    - collectedLateFees - waivedLateFees);
    const totalRepaid           = repaidPrincipal + collectedInterest + collectedFees + collectedLateFees;

    return {
      outstandingPrincipal,
      outstandingInterest,
      outstandingFees,
      outstandingLateFees,
      totalDisbursed: disbursedPrincipal,
      totalRepaid,
      totalInterestCollected: collectedInterest,
      isFullyRepaid: outstandingPrincipal === 0 && outstandingInterest === 0 && outstandingLateFees === 0,
    };
  }

  async getAccountStatement(params: {
    accountCode: LedgerAccountCode;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { accountCode, fromDate, toDate, page = 1, limit = 100 } = params;

    const account = await LedgerAccount.findOne({ where: { code: accountCode } });
    if (!account) throw new Error(`Account not found: ${accountCode}`);

    const where: Record<string, unknown> = { accountCode };
    if (fromDate || toDate) {
      where.effectiveDate = {
        ...(fromDate ? { [Op.gte]: fromDate } : {}),
        ...(toDate   ? { [Op.lte]: toDate   } : {}),
      };
    }

    const { count, rows } = await FinancialLedgerEntry.findAndCountAll({
      where,
      order: [["effective_date", "ASC"], ["created_at", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      account: {
        code: account.code,
        accountNumber: account.accountNumber,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        currentBalance: Number(account.currentBalance),
      },
      entries: rows.map(this._formatEntry),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  async getTrialBalance(): Promise<{
    accounts: Array<{
      code: LedgerAccountCode;
      accountNumber: string;
      name: string;
      type: string;
      normalBalance: string;
      balance: number;
      debitBalance: number;
      creditBalance: number;
    }>;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }> {
    const accounts = await LedgerAccount.findAll({
      where: { isActive: true },
      order: [["account_number", "ASC"]],
    });

    let totalDebits  = 0;
    let totalCredits = 0;

    const rows = accounts.map((a) => {
      const balance = Number(a.currentBalance);
      const debitBalance  = balance > 0 ? balance : 0;
      const creditBalance = balance < 0 ? Math.abs(balance) : 0;
      totalDebits  += debitBalance;
      totalCredits += creditBalance;
      return {
        code: a.code,
        accountNumber: a.accountNumber,
        name: a.name,
        type: a.type,
        normalBalance: a.normalBalance,
        balance,
        debitBalance,
        creditBalance,
      };
    });

    return {
      accounts: rows,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }

  async reconcileEntry(params: {
    entryId: string;
    bankStatementRef: string;
    reconciledBy: string;
    status?: LedgerReconciliationStatus;
  }): Promise<FinancialLedgerEntry> {
    const entry = await FinancialLedgerEntry.findByPk(params.entryId);
    if (!entry) throw new Error(`Ledger entry not found: ${params.entryId}`);

    await (entry as never as { update: (data: object) => Promise<void> }).update({
      reconciliationStatus: params.status ?? "RECONCILED",
      reconciledAt:         new Date(),
      reconciledBy:         params.reconciledBy,
      bankStatementRef:     params.bankStatementRef,
    });

    return entry;
  }

  async getUnreconciledEntries(params: {
    accountCode?: LedgerAccountCode;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { accountCode, fromDate, toDate, page = 1, limit = 50 } = params;

    const where: Record<string, unknown> = {
      reconciliationStatus: "UNRECONCILED",
      entryType: { [Op.in]: ["LOAN_DISBURSEMENT", "REPAYMENT_PRINCIPAL", "REPAYMENT_INTEREST", "REPAYMENT_FEE"] },
    };
    if (accountCode) where.accountCode = accountCode;
    if (fromDate || toDate) {
      where.effectiveDate = {
        ...(fromDate ? { [Op.gte]: fromDate } : {}),
        ...(toDate   ? { [Op.lte]: toDate   } : {}),
      };
    }

    const { count, rows } = await FinancialLedgerEntry.findAndCountAll({
      where,
      order: [["effective_date", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      entries: rows.map(this._formatEntry),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }
  
  private _formatEntry(e: FinancialLedgerEntry) {
    return {
      id:                   e.id,
      journalId:            e.journalId,
      entrySequence:        e.entrySequence,
      accountCode:          e.accountCode,
      side:                 e.side,
      amount:               Number(e.amount),
      currency:             e.currency,
      runningBalance:       Number(e.runningBalance),
      entryType:            e.entryType,
      principalComponent:   e.principalComponent   != null ? Number(e.principalComponent)  : null,
      interestComponent:    e.interestComponent    != null ? Number(e.interestComponent)   : null,
      feeComponent:         e.feeComponent         != null ? Number(e.feeComponent)        : null,
      lateFeeComponent:     e.lateFeeComponent     != null ? Number(e.lateFeeComponent)    : null,
      loanApplicationId:    e.loanApplicationId,
      sourceType:           e.sourceType,
      sourceId:             e.sourceId,
      externalReference:    e.externalReference,
      internalReference:    e.internalReference,
      originalEntryId:      e.originalEntryId,
      isReversed:           e.isReversed,
      actor:                e.actor,
      actorId:              e.actorId,
      actorName:            e.actorName,
      reconciliationStatus: e.reconciliationStatus,
      reconciledAt:         e.reconciledAt,
      bankStatementRef:     e.bankStatementRef,
      description:          e.description,
      notes:                e.notes,
      effectiveDate:        e.effectiveDate,
      createdAt:            e.createdAt,
    };
  }
}

export default new LedgerService();
