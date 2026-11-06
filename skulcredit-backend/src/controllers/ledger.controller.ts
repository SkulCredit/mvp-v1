/**
 * LedgerController — Admin endpoints for the financial ledger
 *
 * All routes require admin authentication (enforced in the router).
 *
 * GET  /finance/ledger/loan/:loanId/statement      — full entry history for one loan
 * GET  /finance/ledger/loan/:loanId/summary         — outstanding balances for one loan
 * GET  /finance/ledger/accounts                     — list all chart-of-accounts entries
 * GET  /finance/ledger/accounts/:code/statement     — statement for one account
 * GET  /finance/ledger/trial-balance                — debit/credit trial balance
 * GET  /finance/ledger/unreconciled                 — reconciliation queue
 * PATCH /finance/ledger/entries/:id/reconcile       — mark entry as reconciled
 * POST  /finance/ledger/entries/adjustment          — post a manual adjustment
 * POST  /finance/ledger/entries/:id/reverse-journal — reverse an entire journal batch
 */

import { Request, Response, NextFunction } from "express";
import ledgerService from "../services/ledger.service";
import { successResponse } from "../utils/response";
import { writeAuditLog } from "../utils/auditLogger";
import type { LedgerAccountCode } from "../models/LedgerAccount";
import type { LedgerEntryType } from "../models/FinancialLedgerEntry";

class LedgerController {

  async getLoanStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loanApplicationId = String(req.params.loanId);
      const {
        accountCode,
        entryType,
        fromDate,
        toDate,
        page,
        limit,
      } = req.query as Record<string, string | undefined>;

      const data = await ledgerService.getLoanAccountStatement({
        loanApplicationId,
        accountCode:  accountCode  as LedgerAccountCode | undefined,
        entryType:    entryType    as LedgerEntryType   | undefined,
        fromDate:     fromDate     ? new Date(fromDate) : undefined,
        toDate:       toDate       ? new Date(toDate)   : undefined,
        page:         page         ? parseInt(page, 10) : 1,
        limit:        limit        ? parseInt(limit, 10) : 100,
      });

      successResponse(res, 200, "Loan ledger statement fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getLoanSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loanApplicationId = String(req.params.loanId);
      const data = await ledgerService.getLoanSummary(loanApplicationId);
      successResponse(res, 200, "Loan ledger summary fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ledgerService.getTrialBalance();
      successResponse(res, 200, "Ledger accounts fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getAccountStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountCode = String(req.params.code) as LedgerAccountCode;
      const { fromDate, toDate, page, limit } = req.query as Record<string, string | undefined>;

      const data = await ledgerService.getAccountStatement({
        accountCode,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate:   toDate   ? new Date(toDate)   : undefined,
        page:     page     ? parseInt(page, 10) : 1,
        limit:    limit    ? parseInt(limit, 10) : 100,
      });

      successResponse(res, 200, "Account statement fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ledgerService.getTrialBalance();
      successResponse(res, 200, "Trial balance fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getUnreconciledEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountCode, fromDate, toDate, page, limit } = req.query as Record<string, string | undefined>;

      const data = await ledgerService.getUnreconciledEntries({
        accountCode: accountCode as LedgerAccountCode | undefined,
        fromDate:    fromDate    ? new Date(fromDate) : undefined,
        toDate:      toDate      ? new Date(toDate)   : undefined,
        page:        page        ? parseInt(page, 10) : 1,
        limit:       limit       ? parseInt(limit, 10) : 50,
      });

      successResponse(res, 200, "Unreconciled ledger entries fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async reconcileEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId      = String(req.params.id);
      const adminId      = req.user?.userId ?? "system";
      const { bankStatementRef, status } = req.body as {
        bankStatementRef: string;
        status?: "RECONCILED" | "DISPUTED";
      };

      const updated = await ledgerService.reconcileEntry({
        entryId,
        bankStatementRef,
        reconciledBy: adminId,
        status,
      });

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "LEDGER_ENTRY_RECONCILED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Ledger entry ${entryId} reconciled against bank ref ${bankStatementRef}`,
        entityType: "FinancialLedgerEntry",
        entityId: entryId,
      });

      successResponse(res, 200, "Ledger entry reconciled successfully", updated);
    } catch (e) {
      next(e);
    }
  }

  async postAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId   = req.user?.userId ?? "system";
      const {
        loanApplicationId,
        debitAccount,
        creditAccount,
        amount,
        description,
        note,
      } = req.body as {
        loanApplicationId?: string;
        debitAccount:  LedgerAccountCode;
        creditAccount: LedgerAccountCode;
        amount:        number;
        description:   string;
        note:          string;
      };

      const entries = await ledgerService.postAdjustment({
        loanApplicationId,
        sourceId:    adminId,
        debitAccount,
        creditAccount,
        amount:      Number(amount),
        description,
        note,
        actorId:     adminId,
        actorName:   "Admin",
      });

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "LEDGER_ADJUSTMENT_POSTED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "WARNING",
        message: `Manual ledger adjustment posted: DR ${debitAccount} / CR ${creditAccount} = ₦${amount} — ${note}`,
        entityType: "FinancialLedgerEntry",
        entityId: entries[0]?.id ?? "batch",
      });

      successResponse(res, 201, "Adjustment journal posted successfully", {
        journalId: entries[0]?.journalId,
        entries,
      });
    } catch (e) {
      next(e);
    }
  }

  async reverseJournal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = String(req.params.id);
      const adminId = req.user?.userId ?? "system";
      const { reason } = req.body as { reason: string };
      
      const { FinancialLedgerEntry } = await import("../models");
      const entry = await (FinancialLedgerEntry as any).findByPk(entryId);
      if (!entry) {
        res.status(404).json({ success: false, message: "Ledger entry not found" });
        return;
      }

      const entries = await ledgerService.postReversal({
        originalJournalId:  entry.journalId,
        loanApplicationId:  entry.loanApplicationId ?? entry.sourceId,
        reason,
        actorId:            adminId,
        actorName:          "Admin",
      });

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "LEDGER_JOURNAL_REVERSED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "WARNING",
        message: `Ledger journal ${entry.journalId} reversed: ${reason}`,
        entityType: "FinancialLedgerEntry",
        entityId: entry.journalId,
      });

      successResponse(res, 201, "Journal reversed successfully", {
        reversalJournalId: entries[0]?.journalId,
        entries,
      });
    } catch (e) {
      next(e);
    }
  }
}

export default new LedgerController();
