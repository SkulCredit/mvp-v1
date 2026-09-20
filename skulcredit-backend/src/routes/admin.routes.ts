import { Router } from "express";
import adminController from "../controllers/admin.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";

const router = Router();

router.use(protect, authorize("admin"));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: "Internal operations - schools, parents, loans, academic sessions (role: admin)"
 */

router.get("/dashboard", adminController.getDashboard.bind(adminController));
router.get("/schools", adminController.getSchools.bind(adminController));
router.put(
  "/schools/:id/approve",
  adminController.approveSchool.bind(adminController),
);
router.put(
  "/schools/:id/reject",
  adminController.rejectSchool.bind(adminController),
);
router.get("/parents", adminController.getParents.bind(adminController));
router.get("/loans", adminController.getLoanApplications.bind(adminController));

// GET    /admin/sessions              — list all (with nested terms)
// POST   /admin/sessions              — create new session
// GET    /admin/sessions/:id          — get one session
// PUT    /admin/sessions/:id          — update session metadata
// DELETE /admin/sessions/:id          — delete (cascades to terms)
// PUT    /admin/sessions/:id/current  — mark as current session

router.get("/sessions", adminController.listSessions.bind(adminController));
router.post("/sessions", adminController.createSession.bind(adminController));
router.get("/sessions/:id", adminController.getSession.bind(adminController));
router.put(
  "/sessions/:id",
  adminController.updateSession.bind(adminController),
);
router.delete(
  "/sessions/:id",
  adminController.deleteSession.bind(adminController),
);
router.put(
  "/sessions/:id/current",
  adminController.setCurrentSession.bind(adminController),
);

// GET    /admin/terms?sessionId=      — list terms (optionally filtered by session)
// POST   /admin/sessions/:sessionId/terms  — create term in a session
// GET    /admin/terms/:id             — get one term
// PUT    /admin/terms/:id             — update term (dates, windows, status)
// DELETE /admin/terms/:id             — delete term
// PUT    /admin/terms/:id/activate    — set status=ACTIVE_APPLICATION

router.get("/terms", adminController.listTerms.bind(adminController));
router.post(
  "/sessions/:sessionId/terms",
  adminController.createTerm.bind(adminController),
);
router.get("/terms/:id", adminController.getTerm.bind(adminController));
router.put("/terms/:id", adminController.updateTerm.bind(adminController));
router.delete("/terms/:id", adminController.deleteTerm.bind(adminController));
router.put(
  "/terms/:id/activate",
  adminController.activateTerm.bind(adminController),
);

export default router;

// PATCH /admin/catalog-schools/:schoolId/tier
//   Body: { tier?, isRegistered?, serviceChargeRate? }
router.patch(
  "/catalog-schools/:schoolId/tier",
  adminController.updateSchoolTier.bind(adminController),
);

// GET    /admin/catalog-schools/:schoolId/bank-accounts
// POST   /admin/catalog-schools/:schoolId/bank-accounts
// PUT    /admin/bank-accounts/:id
// DELETE /admin/bank-accounts/:id

router.get(
  "/catalog-schools/:schoolId/bank-accounts",
  adminController.getBankAccounts.bind(adminController),
);
router.post(
  "/catalog-schools/:schoolId/bank-accounts",
  adminController.addBankAccount.bind(adminController),
);
router.put(
  "/bank-accounts/:id",
  adminController.updateBankAccount.bind(adminController),
);
router.delete(
  "/bank-accounts/:id",
  adminController.deleteBankAccount.bind(adminController),
);
