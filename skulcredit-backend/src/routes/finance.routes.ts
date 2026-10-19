import { Router } from "express";
import financeController from "../controllers/finance.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import validate from "../middlewares/validate.middleware";
import {
  dashboardStatsQuerySchema,
  listDisbursementsQuerySchema,
  disbursementIdParamSchema,
  initiateDisbursementSchema,
  reverseDisbursementSchema,
  updateSchoolVerificationStatusSchema,
  listRepaymentsQuerySchema,
  loanIdParamSchema,
  followUpSchema,
  waiveLateFeeSchema,
  bulkRemindersSchema,
  logInteractionSchema,
  assignOfficerSchema,
  createInvestigationSchema,
  updateFinanceSettingsSchema,
} from "../validators/finance.validator";

const router = Router();
const ctrl = financeController;

// All finance routes are restricted to authenticated admin staff
router.use(protect, authorize("admin"));

// 1. Dashboard
router.get("/dashboard/stats", validate(dashboardStatsQuerySchema), ctrl.getDashboardStats.bind(ctrl));

// 2. Disbursements
router.get("/disbursements", validate(listDisbursementsQuerySchema), ctrl.listDisbursements.bind(ctrl));
router.get("/disbursements/eligible-loans", ctrl.getEligibleLoans.bind(ctrl));
router.get("/disbursements/:id", validate(disbursementIdParamSchema), ctrl.getDisbursementById.bind(ctrl));
router.post("/disbursements", validate(initiateDisbursementSchema), ctrl.initiateDisbursement.bind(ctrl));
router.post("/disbursements/:id/retry", validate(disbursementIdParamSchema), ctrl.retryDisbursement.bind(ctrl));
router.post("/disbursements/:id/reverse", validate(reverseDisbursementSchema), ctrl.reverseDisbursement.bind(ctrl));

// 3. School Verifications
router.get("/schools/verification", ctrl.listSchoolVerifications.bind(ctrl));
router.patch("/schools/verification/:schoolId/status", validate(updateSchoolVerificationStatusSchema), ctrl.updateSchoolVerificationStatus.bind(ctrl));

// 4. Repayments & Collections
router.get("/repayments", validate(listRepaymentsQuerySchema), ctrl.listRepayments.bind(ctrl));
router.get("/repayments/:loanId", validate(loanIdParamSchema), ctrl.getRepaymentLoanDetail.bind(ctrl));
router.post("/repayments/follow-up", validate(followUpSchema), ctrl.triggerFollowUp.bind(ctrl));
router.post("/repayments/waive-fee", validate(waiveLateFeeSchema), ctrl.waiveLateFee.bind(ctrl));

// 5. Outstanding Balances & Overdue
router.get("/outstanding-balances", ctrl.getOutstandingBalances.bind(ctrl));
router.get("/overdue-accounts", ctrl.getOverdueAccounts.bind(ctrl));
router.post("/overdue-accounts/bulk-reminders", validate(bulkRemindersSchema), ctrl.sendBulkReminders.bind(ctrl));

// 6. Collection Follow-Up
router.get("/collections/follow-up", ctrl.getCollectionFollowUps.bind(ctrl));
router.post("/collections/log-interaction", validate(logInteractionSchema), ctrl.logInteraction.bind(ctrl));
router.post("/collections/assign", validate(assignOfficerSchema), ctrl.assignOfficer.bind(ctrl));

// 7. Reports & Analytics
router.get("/reports", ctrl.getFinancialReports.bind(ctrl));
router.get("/reports/:id/download", ctrl.downloadReport.bind(ctrl));

// 8. Records & Reconciliation
router.get("/records/schools", ctrl.getSchoolRecords.bind(ctrl));
router.post("/records/investigation", validate(createInvestigationSchema), ctrl.createInvestigation.bind(ctrl));

// 9. Audit Logs & Settings
router.get("/audit-logs", ctrl.getAuditLogsAndSettings.bind(ctrl));
router.patch("/settings", validate(updateFinanceSettingsSchema), ctrl.updateFinanceSettings.bind(ctrl));

export default router;
