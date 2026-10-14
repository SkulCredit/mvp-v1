import { Router } from "express";
import adminController from "../controllers/admin.controller";
import supportController from "../controllers/support.controller";
import auditLogController from "../controllers/auditLog.controller";
import uploadController from "../controllers/upload.controller";
import { uploadPhoto } from "../middlewares/upload.middleware";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";

const router = Router();
const ctrl = adminController;

router.use(protect, authorize("admin"));

router.get("/dashboard", ctrl.getDashboard.bind(ctrl));
router.get("/analytics/applications", ctrl.getApplicationStats.bind(ctrl));
router.get("/analytics/revenue", ctrl.getRevenueStats.bind(ctrl));
router.get("/analytics/market-projection", ctrl.getMarketProjection.bind(ctrl));

router.get("/users", ctrl.listUsers.bind(ctrl));
router.get("/users/:id", ctrl.getUser.bind(ctrl));
router.patch("/users/:id/toggle-active", ctrl.toggleUserActive.bind(ctrl));
router.patch("/users/:id/email", ctrl.resetUserEmail.bind(ctrl));
router.post("/users", ctrl.createStaffUser.bind(ctrl));

router.get("/parents", ctrl.listParents.bind(ctrl));
router.get("/parents/:id", ctrl.getParent.bind(ctrl));
router.patch("/parents/:id/kyc", ctrl.updateParentKyc.bind(ctrl));

router.get("/schools", ctrl.getSchools.bind(ctrl));
router.post("/schools", ctrl.createSchool.bind(ctrl));
router.get("/schools/:id", ctrl.getSchool.bind(ctrl));
router.patch("/schools/:id", ctrl.updateSchool.bind(ctrl));
router.post("/schools/:id/create-access", ctrl.createSchoolLoginAccess.bind(ctrl));
router.put("/schools/:id/approve", ctrl.approveSchool.bind(ctrl));
router.put("/schools/:id/reject", ctrl.rejectSchool.bind(ctrl));
router.patch("/schools/:id/status", ctrl.updateSchoolStatus.bind(ctrl));

router.get("/catalog-schools", ctrl.listCatalogSchools.bind(ctrl));
router.get("/catalog-schools/:id", ctrl.getCatalogSchool.bind(ctrl));
router.patch("/catalog-schools/:id", ctrl.updateCatalogSchool.bind(ctrl));
router.patch(
  "/catalog-schools/:schoolId/tier",
  ctrl.updateSchoolTier.bind(ctrl),
);
router.get(
  "/catalog-schools/:schoolId/bank-accounts",
  ctrl.getBankAccounts.bind(ctrl),
);
router.post(
  "/catalog-schools/:schoolId/bank-accounts",
  ctrl.addBankAccount.bind(ctrl),
);

router.put("/bank-accounts/:id", ctrl.updateBankAccount.bind(ctrl));
router.delete("/bank-accounts/:id", ctrl.deleteBankAccount.bind(ctrl));

router.get("/institution-types", ctrl.listInstitutionTypes.bind(ctrl));
router.post("/institution-types", ctrl.createInstitutionType.bind(ctrl));
router.put("/institution-types/:id", ctrl.updateInstitutionType.bind(ctrl));
router.delete("/institution-types/:id", ctrl.deleteInstitutionType.bind(ctrl));

router.get("/class-levels", ctrl.listClassLevels.bind(ctrl));
router.post("/class-levels", ctrl.createClassLevel.bind(ctrl));
router.put("/class-levels/:id", ctrl.updateClassLevel.bind(ctrl));
router.delete("/class-levels/:id", ctrl.deleteClassLevel.bind(ctrl));

router.get("/students", ctrl.listStudents.bind(ctrl));
router.get("/students/:id", ctrl.getStudent.bind(ctrl));
router.put("/students/:id", ctrl.updateStudent.bind(ctrl));
router.delete("/students/:id", ctrl.deleteStudent.bind(ctrl));

router.get("/loans", ctrl.getLoanApplications.bind(ctrl));
router.get("/loans/:id", ctrl.getLoanApplication.bind(ctrl));
router.patch("/loans/:id/status", ctrl.updateApplicationStatus.bind(ctrl));
router.patch("/loans/:id/note", ctrl.updateApplicationNote.bind(ctrl));
router.get("/loans/:id/events", ctrl.listApplicationEvents.bind(ctrl));
router.post("/loans/:id/events", ctrl.createApplicationEvent.bind(ctrl));
router.get("/loans/:id/schedule", ctrl.getRepaymentSchedule.bind(ctrl));

router.get("/ledgers", ctrl.listLoanLedgers.bind(ctrl));
router.get("/ledgers/loan/:loanApplicationId", ctrl.getLoanLedger.bind(ctrl));

router.get("/loan-offers", ctrl.listLoanOffers.bind(ctrl));
router.get(
  "/loan-offers/loan/:loanApplicationId",
  ctrl.getLoanOffer.bind(ctrl),
);
router.patch("/loan-offers/:id/status", ctrl.updateLoanOfferStatus.bind(ctrl));

router.get("/disbursement-requests", ctrl.listDisbursementRequests.bind(ctrl));
router.post("/loans/:id/assign-disbursement", ctrl.assignDisbursementPartner.bind(ctrl));
router.get("/disbursements", ctrl.listDisbursements.bind(ctrl));
router.get("/disbursements/:id", ctrl.getDisbursement.bind(ctrl));
router.patch(
  "/disbursements/:id/status",
  ctrl.updateDisbursementStatus.bind(ctrl),
);

router.post("/repayments/manual", ctrl.recordManualRepayment.bind(ctrl));
router.get("/repayments", ctrl.listRepayments.bind(ctrl));
router.get("/repayments/:id", ctrl.getRepayment.bind(ctrl));

router.patch("/schedule/:id", ctrl.updateScheduleInstallment.bind(ctrl));

router.get("/documents", ctrl.listDocuments.bind(ctrl));
router.get("/documents/:id", ctrl.getDocument.bind(ctrl));
router.delete("/documents/:id", ctrl.deleteDocument.bind(ctrl));

router.get("/school-requests", ctrl.listSchoolRequests.bind(ctrl));
router.get("/school-requests/:id", ctrl.getSchoolRequest.bind(ctrl));
router.patch(
  "/school-requests/:id/status",
  ctrl.updateSchoolRequestStatus.bind(ctrl),
);

router.post("/notifications/broadcast", ctrl.broadcastNotification.bind(ctrl));
router.get("/notifications", ctrl.listNotifications.bind(ctrl));
router.delete("/notifications/:id", ctrl.deleteNotification.bind(ctrl));

router.get("/device-tokens", ctrl.listDeviceTokens.bind(ctrl));
router.delete("/device-tokens/:id", ctrl.deleteDeviceToken.bind(ctrl));

router.get("/sessions", ctrl.listSessions.bind(ctrl));
router.post("/sessions", ctrl.createSession.bind(ctrl));
router.get("/sessions/:id", ctrl.getSession.bind(ctrl));
router.put("/sessions/:id", ctrl.updateSession.bind(ctrl));
router.delete("/sessions/:id", ctrl.deleteSession.bind(ctrl));
router.put("/sessions/:id/current", ctrl.setCurrentSession.bind(ctrl));
router.post("/sessions/:sessionId/terms", ctrl.createTerm.bind(ctrl));

router.get("/terms", ctrl.listTerms.bind(ctrl));
router.get("/terms/:id", ctrl.getTerm.bind(ctrl));
router.put("/terms/:id", ctrl.updateTerm.bind(ctrl));
router.delete("/terms/:id", ctrl.deleteTerm.bind(ctrl));
router.put("/terms/:id/activate", ctrl.activateTerm.bind(ctrl));

router.get("/school-terms", ctrl.listSchoolTerms.bind(ctrl));
router.get("/school-terms/:id", ctrl.getSchoolTerm.bind(ctrl));
router.delete("/school-terms/:id", ctrl.deleteSchoolTerm.bind(ctrl));

router.get("/funding-partners", ctrl.listFundingPartners.bind(ctrl));
router.post("/funding-partners", ctrl.createFundingPartner.bind(ctrl));
router.get("/funding-partners/:id", ctrl.getFundingPartner.bind(ctrl));
router.put("/funding-partners/:id", ctrl.updateFundingPartner.bind(ctrl));
router.delete("/funding-partners/:id", ctrl.deleteFundingPartner.bind(ctrl));

router.get(
  "/parents/:parentId/eligibility-status",
  ctrl.getParentEligibilityStatus.bind(ctrl),
);
router.get(
  "/parents/:parentId/eligibility-profile",
  ctrl.getParentEligibilityProfile.bind(ctrl),
);
router.patch(
  "/parents/:parentId/eligibility-profile",
  ctrl.updateParentEligibilityProfile.bind(ctrl),
);
router.post(
  "/parents/:parentId/score-check",
  ctrl.adminCheckLoanScore.bind(ctrl),
);

router.get(
  "/parents/:parentId/loans/:loanId/mandate-preview",
  ctrl.adminGetMandatePreview.bind(ctrl),
);
router.post(
  "/parents/:parentId/loans/:loanId/confirm-service-charge",
  ctrl.adminConfirmServiceCharge.bind(ctrl),
);
router.post(
  "/parents/:parentId/loans/:loanId/setup-repayment",
  ctrl.adminSetupRepayment.bind(ctrl),
);
router.post(
  "/parents/:parentId/loans/:loanId/pay-installment",
  ctrl.adminPayInstallment.bind(ctrl),
);

router.get(
  "/schools/user/:schoolUserId/dashboard",
  ctrl.adminGetSchoolDashboard.bind(ctrl),
);
router.put(
  "/schools/user/:schoolUserId/loans/:loanId/verify-enrollment",
  ctrl.adminVerifyEnrollment.bind(ctrl),
);

router.get("/current-term", ctrl.adminGetCurrentTerm.bind(ctrl));

router.get("/support/tickets",     supportController.listTickets.bind(supportController));
router.get("/support/tickets/stats", supportController.getStats.bind(supportController));
router.get("/support/tickets/:id", supportController.getTicket.bind(supportController));
router.patch("/support/tickets/:id", supportController.updateTicket.bind(supportController));
router.delete("/support/tickets/:id", supportController.deleteTicket.bind(supportController));

router.get("/audit-logs",                    auditLogController.listLogs.bind(auditLogController));
router.get("/audit-logs/distribution",       auditLogController.getActionDistribution.bind(auditLogController));
router.get("/audit-logs/severity-distribution", auditLogController.getSeverityDistribution.bind(auditLogController));
router.get("/audit-logs/recent-failures",    auditLogController.getRecentFailures.bind(auditLogController));
router.get("/audit-logs/:id",                auditLogController.getLog.bind(auditLogController));
router.delete("/audit-logs/:id",             auditLogController.deleteLog.bind(auditLogController));

router.post("/settings/database/export", ctrl.exportDatabase.bind(ctrl));
router.post("/settings/database/backup", ctrl.backupDatabase.bind(ctrl));
router.post("/settings/notifications/test-email", ctrl.testEmail.bind(ctrl));
router.get("/settings/audit/export", ctrl.exportAuditLogs.bind(ctrl));
router.get("/settings", ctrl.getSettings.bind(ctrl));
router.get("/settings/:section", ctrl.getSettingsSection.bind(ctrl));
router.put("/settings/:section", ctrl.updateSettingsSection.bind(ctrl));

router.get(
  "/users/:userId/notifications",
  ctrl.adminListUserNotifications.bind(ctrl),
);
router.put(
  "/users/:userId/notifications/read-all",
  ctrl.adminMarkAllNotificationsRead.bind(ctrl),
);
router.put(
  "/users/:userId/notifications/:notificationId/read",
  ctrl.adminMarkNotificationRead.bind(ctrl),
);
router.post(
  "/users/:userId/notifications/:notificationId/reply",
  ctrl.adminReplyToNotification.bind(ctrl),
);

router.get("/profile", ctrl.getAdminProfile.bind(ctrl));
router.put("/profile", ctrl.updateAdminProfile.bind(ctrl));
router.post("/profile/avatar", uploadPhoto("admin").single("avatar"), uploadController.uploadDocument.bind(uploadController));
router.put("/profile/password", ctrl.updateAdminPassword.bind(ctrl));

// Direct debit mandate management
router.post("/applications/:id/mandate", ctrl.createMandate.bind(ctrl));
router.patch("/applications/:id/mandate/activate", ctrl.activateMandate.bind(ctrl));
router.patch("/applications/:id/mandate/deactivate", ctrl.deactivateMandate.bind(ctrl));
router.patch("/applications/:id/mandate/cancel", ctrl.cancelMandate.bind(ctrl));
router.get("/applications/:id/mandates", ctrl.getApplicationMandates.bind(ctrl));

export default router;
