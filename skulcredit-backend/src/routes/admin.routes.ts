/**
 * admin.routes.ts
 *
 * All routes require:  protect + authorize("admin")
 *
 * Route map (prefix: /api/v1/admin)
 * ───────
 * DASHBOARD & ANALYTICS
 *   GET  /dashboard
 *   GET  /analytics/applications   ?period=&groupBy=day|month|year
 *   GET  /analytics/revenue        ?period=&groupBy=day|month|year
 *   GET  /analytics/market-projection
 *
 * USERS
 *   GET    /users                  ?role=&search=
 *   GET    /users/:id
 *   PATCH  /users/:id/toggle-active
 *   PATCH  /users/:id/email
 *
 * PARENTS
 *   GET    /parents                ?search=&kycStatus=&page=&limit=
 *   GET    /parents/:id
 *   PATCH  /parents/:id/kyc
 *
 * PARTNER SCHOOLS (registered school accounts)
 *   GET    /schools                ?status=
 *   GET    /schools/:id
 *   PUT    /schools/:id/approve
 *   PUT    /schools/:id/reject
 *   PATCH  /schools/:id/status
 *
 * CATALOG SCHOOLS
 *   GET    /catalog-schools        ?search=&isRegistered=
 *   GET    /catalog-schools/:id
 *   PATCH  /catalog-schools/:id
 *   PATCH  /catalog-schools/:schoolId/tier
 *   GET    /catalog-schools/:schoolId/bank-accounts
 *   POST   /catalog-schools/:schoolId/bank-accounts
 *
 * BANK ACCOUNTS
 *   PUT    /bank-accounts/:id
 *   DELETE /bank-accounts/:id
 *
 * INSTITUTION TYPES
 *   GET    /institution-types
 *   POST   /institution-types
 *   PUT    /institution-types/:id
 *   DELETE /institution-types/:id
 *
 * CLASS LEVELS
 *   GET    /class-levels           ?schoolId=&institutionTypeId=
 *   POST   /class-levels
 *   PUT    /class-levels/:id
 *   DELETE /class-levels/:id
 *
 * STUDENTS
 *   GET    /students               ?parentId=&schoolId=&page=&limit=
 *   GET    /students/:id
 *   PUT    /students/:id
 *   DELETE /students/:id
 *
 * LOAN APPLICATIONS
 *   GET    /loans                  ?status=&parentId=&fromDate=&toDate=&page=&limit=
 *   GET    /loans/:id
 *   PATCH  /loans/:id/status
 *   PATCH  /loans/:id/note
 *   GET    /loans/:id/events
 *   POST   /loans/:id/events
 *   GET    /loans/:id/schedule
 *
 * LOAN LEDGERS
 *   GET    /ledgers                ?status=&page=&limit=
 *   GET    /ledgers/loan/:loanApplicationId
 *
 * LOAN OFFERS
 *   GET    /loan-offers            ?status=&page=&limit=
 *   GET    /loan-offers/loan/:loanApplicationId
 *   PATCH  /loan-offers/:id/status
 *
 * DISBURSEMENTS
 *   GET    /disbursements          ?status=&schoolId=&fromDate=&toDate=&page=&limit=
 *   GET    /disbursements/:id
 *   PATCH  /disbursements/:id/status
 *
 * REPAYMENTS
 *   GET    /repayments             ?loanApplicationId=&parentId=&status=&page=&limit=
 *   GET    /repayments/:id
 *   POST   /repayments/manual
 *
 * REPAYMENT SCHEDULE
 *   PATCH  /schedule/:id
 *
 * DOCUMENTS (KYC)
 *   GET    /documents              ?parentId=&category=&page=&limit=
 *   GET    /documents/:id
 *   DELETE /documents/:id
 *
 * SCHOOL REQUESTS
 *   GET    /school-requests        ?status=&page=&limit=
 *   GET    /school-requests/:id
 *   PATCH  /school-requests/:id/status
 *
 * NOTIFICATIONS
 *   GET    /notifications          ?userId=&isRead=&page=&limit=
 *   POST   /notifications/broadcast
 *   DELETE /notifications/:id
 *
 * DEVICE TOKENS
 *   GET    /device-tokens          ?userId=
 *   DELETE /device-tokens/:id
 *
 * ACADEMIC SESSIONS & TERMS
 *   GET    /sessions
 *   POST   /sessions
 *   GET    /sessions/:id
 *   PUT    /sessions/:id
 *   DELETE /sessions/:id
 *   PUT    /sessions/:id/current
 *   POST   /sessions/:sessionId/terms
 *   GET    /terms                  ?sessionId=
 *   GET    /terms/:id
 *   PUT    /terms/:id
 *   DELETE /terms/:id
 *   PUT    /terms/:id/activate
 *
 * LEGACY SCHOOL TERMS
 *   GET    /school-terms           ?schoolId=
 *   GET    /school-terms/:id
 *   DELETE /school-terms/:id
 * ───────
 */

import { Router } from "express";
import adminController from "../controllers/admin.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";

const router = Router();
const ctrl = adminController;

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

//  DASHBOARD & ANALYTICS ────
router.get("/dashboard", ctrl.getDashboard.bind(ctrl));
router.get("/analytics/applications", ctrl.getApplicationStats.bind(ctrl));
router.get("/analytics/revenue", ctrl.getRevenueStats.bind(ctrl));
router.get("/analytics/market-projection", ctrl.getMarketProjection.bind(ctrl));

//  USERS ──
router.get("/users", ctrl.listUsers.bind(ctrl));
router.get("/users/:id", ctrl.getUser.bind(ctrl));
router.patch("/users/:id/toggle-active", ctrl.toggleUserActive.bind(ctrl));
router.patch("/users/:id/email", ctrl.resetUserEmail.bind(ctrl));

//  PARENTS 
router.get("/parents", ctrl.listParents.bind(ctrl));
router.get("/parents/:id", ctrl.getParent.bind(ctrl));
router.patch("/parents/:id/kyc", ctrl.updateParentKyc.bind(ctrl));

//  PARTNER SCHOOLS (registered school accounts) ────
router.get("/schools", ctrl.getSchools.bind(ctrl));
router.get("/schools/:id", ctrl.getSchool.bind(ctrl));
router.put("/schools/:id/approve", ctrl.approveSchool.bind(ctrl));
router.put("/schools/:id/reject", ctrl.rejectSchool.bind(ctrl));
router.patch("/schools/:id/status", ctrl.updateSchoolStatus.bind(ctrl));

//  CATALOG SCHOOLS 
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

//  BANK ACCOUNTS ──
router.put("/bank-accounts/:id", ctrl.updateBankAccount.bind(ctrl));
router.delete("/bank-accounts/:id", ctrl.deleteBankAccount.bind(ctrl));

//  INSTITUTION TYPES ─
router.get("/institution-types", ctrl.listInstitutionTypes.bind(ctrl));
router.post("/institution-types", ctrl.createInstitutionType.bind(ctrl));
router.put("/institution-types/:id", ctrl.updateInstitutionType.bind(ctrl));
router.delete("/institution-types/:id", ctrl.deleteInstitutionType.bind(ctrl));

//  CLASS LEVELS ───
router.get("/class-levels", ctrl.listClassLevels.bind(ctrl));
router.post("/class-levels", ctrl.createClassLevel.bind(ctrl));
router.put("/class-levels/:id", ctrl.updateClassLevel.bind(ctrl));
router.delete("/class-levels/:id", ctrl.deleteClassLevel.bind(ctrl));

//  STUDENTS ───────
router.get("/students", ctrl.listStudents.bind(ctrl));
router.get("/students/:id", ctrl.getStudent.bind(ctrl));
router.put("/students/:id", ctrl.updateStudent.bind(ctrl));
router.delete("/students/:id", ctrl.deleteStudent.bind(ctrl));

//  LOAN APPLICATIONS ─
router.get("/loans", ctrl.getLoanApplications.bind(ctrl));
router.get("/loans/:id", ctrl.getLoanApplication.bind(ctrl));
router.patch("/loans/:id/status", ctrl.updateApplicationStatus.bind(ctrl));
router.patch("/loans/:id/note", ctrl.updateApplicationNote.bind(ctrl));
router.get("/loans/:id/events", ctrl.listApplicationEvents.bind(ctrl));
router.post("/loans/:id/events", ctrl.createApplicationEvent.bind(ctrl));
router.get("/loans/:id/schedule", ctrl.getRepaymentSchedule.bind(ctrl));

//  LOAN LEDGERS ───
// Note: specific route before parameterised to avoid collision
router.get("/ledgers", ctrl.listLoanLedgers.bind(ctrl));
router.get("/ledgers/loan/:loanApplicationId", ctrl.getLoanLedger.bind(ctrl));

//  LOAN OFFERS ────
router.get("/loan-offers", ctrl.listLoanOffers.bind(ctrl));
router.get(
  "/loan-offers/loan/:loanApplicationId",
  ctrl.getLoanOffer.bind(ctrl),
);
router.patch("/loan-offers/:id/status", ctrl.updateLoanOfferStatus.bind(ctrl));

//  DISBURSEMENTS ──
router.get("/disbursements", ctrl.listDisbursements.bind(ctrl));
router.get("/disbursements/:id", ctrl.getDisbursement.bind(ctrl));
router.patch(
  "/disbursements/:id/status",
  ctrl.updateDisbursementStatus.bind(ctrl),
);

//  REPAYMENTS ─────
// Note: /manual before /:id to avoid route collision
router.post("/repayments/manual", ctrl.recordManualRepayment.bind(ctrl));
router.get("/repayments", ctrl.listRepayments.bind(ctrl));
router.get("/repayments/:id", ctrl.getRepayment.bind(ctrl));

//  REPAYMENT SCHEDULE 
router.patch("/schedule/:id", ctrl.updateScheduleInstallment.bind(ctrl));

//  DOCUMENTS (KYC) 
router.get("/documents", ctrl.listDocuments.bind(ctrl));
router.get("/documents/:id", ctrl.getDocument.bind(ctrl));
router.delete("/documents/:id", ctrl.deleteDocument.bind(ctrl));

//  SCHOOL REQUESTS 
router.get("/school-requests", ctrl.listSchoolRequests.bind(ctrl));
router.get("/school-requests/:id", ctrl.getSchoolRequest.bind(ctrl));
router.patch(
  "/school-requests/:id/status",
  ctrl.updateSchoolRequestStatus.bind(ctrl),
);

//  NOTIFICATIONS ──
// Note: /broadcast before /:id to avoid route collision
router.post("/notifications/broadcast", ctrl.broadcastNotification.bind(ctrl));
router.get("/notifications", ctrl.listNotifications.bind(ctrl));
router.delete("/notifications/:id", ctrl.deleteNotification.bind(ctrl));

//  DEVICE TOKENS ──
router.get("/device-tokens", ctrl.listDeviceTokens.bind(ctrl));
router.delete("/device-tokens/:id", ctrl.deleteDeviceToken.bind(ctrl));

//  ACADEMIC SESSIONS ─
router.get("/sessions", ctrl.listSessions.bind(ctrl));
router.post("/sessions", ctrl.createSession.bind(ctrl));
router.get("/sessions/:id", ctrl.getSession.bind(ctrl));
router.put("/sessions/:id", ctrl.updateSession.bind(ctrl));
router.delete("/sessions/:id", ctrl.deleteSession.bind(ctrl));
router.put("/sessions/:id/current", ctrl.setCurrentSession.bind(ctrl));
router.post("/sessions/:sessionId/terms", ctrl.createTerm.bind(ctrl));

//  ACADEMIC TERMS ─
router.get("/terms", ctrl.listTerms.bind(ctrl));
router.get("/terms/:id", ctrl.getTerm.bind(ctrl));
router.put("/terms/:id", ctrl.updateTerm.bind(ctrl));
router.delete("/terms/:id", ctrl.deleteTerm.bind(ctrl));
router.put("/terms/:id/activate", ctrl.activateTerm.bind(ctrl));

//  LEGACY SCHOOL TERMS (per-school terms created by school accounts) 
router.get("/school-terms", ctrl.listSchoolTerms.bind(ctrl));
router.get("/school-terms/:id", ctrl.getSchoolTerm.bind(ctrl));
router.delete("/school-terms/:id", ctrl.deleteSchoolTerm.bind(ctrl));

export default router;
