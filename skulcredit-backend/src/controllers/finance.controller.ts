import { Request, Response, NextFunction } from "express";
import financeService from "../services/finance.service";
import { successResponse } from "../utils/response";
import { writeAuditLog } from "../utils/auditLogger";

export class FinanceController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as "6M" | "12M") || "12M";
      const data = await financeService.getDashboardStats(period);
      successResponse(res, 200, "Dashboard stats fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async listDisbursements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, search, date } = req.query as any;
      const data = await financeService.listDisbursements({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        status,
        search,
        date,
      });
      successResponse(res, 200, "Disbursements list fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getEligibleLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const data = await financeService.getEligibleLoans(search);
      successResponse(res, 200, "Eligible loans fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getDisbursementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await financeService.getDisbursementById(id);
      successResponse(res, 200, "Disbursement details fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async initiateDisbursement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.initiateDisbursement(req.body, userId);

      await writeAuditLog({
        req,
        category: "PAYMENT",
        action: "DISBURSEMENT_INITIATED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Disbursement initiated for loan ${req.body.loanApplicationId} amount: ${data.amount}`,
        entityType: "Disbursement",
        entityId: data.disbursementId,
      });

      successResponse(res, 201, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async retryDisbursement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const userId = req.user?.userId || "system";
      const data = await financeService.retryDisbursement(id, userId);

      await writeAuditLog({
        req,
        category: "PAYMENT",
        action: "DISBURSEMENT_RETRY",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "WARNING",
        message: `Disbursement retry initiated for ${id}`,
        entityType: "Disbursement",
        entityId: id,
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async reverseDisbursement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason } = req.body;
      const userId = req.user?.userId || "system";
      const data = await financeService.reverseDisbursement(id, reason, userId);

      await writeAuditLog({
        req,
        category: "PAYMENT",
        action: "DISBURSEMENT_REVERSED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "WARNING",
        message: `Disbursement ${id} reversed: ${reason}`,
        entityType: "Disbursement",
        entityId: id,
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async listSchoolVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const data = await financeService.listSchoolVerifications(search);
      successResponse(res, 200, "School verifications fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async updateSchoolVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = String(req.params.schoolId);
      const userId = req.user?.userId || "system";
      const data = await financeService.updateSchoolVerificationStatus(schoolId, req.body, userId);

      await writeAuditLog({
        req,
        category: "ADMIN",
        action: "SCHOOL_VERIFICATION_STATUS_UPDATED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `School ${schoolId} verification status updated to ${req.body.status}`,
        entityType: "SchoolBankAccount",
        entityId: schoolId,
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async listRepayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, search } = req.query as any;
      const data = await financeService.listRepayments({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        status,
        search,
      });
      successResponse(res, 200, "Repayments register fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getRepaymentLoanDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loanId = String(req.params.loanId);
      const data = await financeService.getRepaymentLoanDetail(loanId);
      successResponse(res, 200, "Loan repayment details fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async triggerFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.triggerFollowUp(req.body, userId);

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "COLLECTION_FOLLOW_UP_TRIGGERED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Follow-up triggered for loan ${req.body.loanId}`,
        entityType: "LoanApplication",
        entityId: String(req.body.loanId),
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async waiveLateFee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.waiveLateFee(req.body, userId);

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "LATE_FEE_WAIVED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Late fee waived for loan ${req.body.loanId}: ${req.body.reason}`,
        entityType: "RepaymentSchedule",
        entityId: String(req.body.scheduleId || req.body.loanId),
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async getOutstandingBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getOutstandingBalances();
      successResponse(res, 200, "Outstanding balances analytics fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async getOverdueAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getOverdueAccounts();
      successResponse(res, 200, "Overdue accounts queue fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async sendBulkReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.sendBulkReminders(req.body, userId);

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "BULK_REMINDERS_SENT",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Bulk reminders sent to ${req.body.loanIds.length} accounts via ${req.body.channel}`,
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async getCollectionFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getCollectionFollowUps();
      successResponse(res, 200, "Collection follow-up queue fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async logInteraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.logInteraction(req.body, userId);

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "COLLECTION_INTERACTION_LOGGED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Interaction (${req.body.interactionType}) logged for loan ${req.body.loanId}`,
        entityType: "LoanApplication",
        entityId: String(req.body.loanId),
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async assignOfficer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.assignOfficer(req.body, userId);

      await writeAuditLog({
        req,
        category: "ADMIN",
        action: "COLLECTION_OFFICER_ASSIGNED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: `Loan ${req.body.loanId} assigned to officer ${req.body.officerName || req.body.officerId}`,
        entityType: "LoanApplication",
        entityId: String(req.body.loanId),
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async getFinancialReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getFinancialReports();
      successResponse(res, 200, "Financial reports and analytics fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async downloadReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const format = (req.query.format as string) || "CSV";
      const report = await financeService.generateReportDownload(id, format);

      res.setHeader("Content-Type", report.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
      res.send(report.content);
    } catch (e) {
      next(e);
    }
  }

  async getSchoolRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getSchoolRecords();
      successResponse(res, 200, "School and loan records fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async createInvestigation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.createInvestigation(req.body, userId);

      await writeAuditLog({
        req,
        category: "TRANSACTION",
        action: "RECONCILIATION_INVESTIGATION_CREATED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "WARNING",
        message: `Reconciliation investigation created for ${req.body.transactionReference}`,
        entityType: "Transaction",
        entityId: String(req.body.transactionReference),
      });

      successResponse(res, 201, data.message, data);
    } catch (e) {
      next(e);
    }
  }

  async getAuditLogsAndSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await financeService.getAuditLogsAndSettings();
      successResponse(res, 200, "Finance audit logs and settings fetched successfully", data);
    } catch (e) {
      next(e);
    }
  }

  async updateFinanceSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "system";
      const data = await financeService.updateFinanceSettings(req.body, userId);

      await writeAuditLog({
        req,
        category: "CONFIGURATION",
        action: "FINANCE_SETTINGS_UPDATED",
        eventType: "ADMIN_ACTION",
        status: "SUCCESS",
        severity: "INFO",
        message: "Finance settings updated",
      });

      successResponse(res, 200, data.message, data);
    } catch (e) {
      next(e);
    }
  }
}

export default new FinanceController();
