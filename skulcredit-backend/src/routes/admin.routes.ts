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
 *   description: "Internal operations - schools, parents, loans (role: admin)"
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin portfolio overview stats
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats returned
 */
router.get("/dashboard", adminController.getDashboard.bind(adminController));

/**
 * @swagger
 * /admin/schools:
 *   get:
 *     summary: List all schools, optionally filtered by status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, approved, rejected]
 *     responses:
 *       200:
 *         description: List of schools
 */
router.get("/schools", adminController.getSchools.bind(adminController));

/**
 * @swagger
 * /admin/schools/{id}/approve:
 *   put:
 *     summary: Approve a school registration
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: School approved
 */
router.put(
  "/schools/:id/approve",
  adminController.approveSchool.bind(adminController),
);

/**
 * @swagger
 * /admin/schools/{id}/reject:
 *   put:
 *     summary: Reject a school registration
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: School rejected
 */
router.put(
  "/schools/:id/reject",
  adminController.rejectSchool.bind(adminController),
);

/**
 * @swagger
 * /admin/parents:
 *   get:
 *     summary: List all parent accounts
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of parents
 */
router.get("/parents", adminController.getParents.bind(adminController));

/**
 * @swagger
 * /admin/loans:
 *   get:
 *     summary: List all loan applications
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of loan applications
 */
router.get("/loans", adminController.getLoanApplications.bind(adminController));

export default router;

// ── School Term management ────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/terms:
 *   get:
 *     summary: List all school terms
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of school terms ordered by open date
 */
router.get("/terms", adminController.listTerms.bind(adminController));

/**
 * @swagger
 * /admin/terms:
 *   post:
 *     summary: Create a new school term
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, academicYear, portalOpenDate, portalCloseDate, maxTenorMonths]
 *             properties:
 *               name:            { type: string, example: "Term 1" }
 *               academicYear:    { type: string, example: "2026/2027" }
 *               portalOpenDate:  { type: string, format: date, example: "2026-09-01" }
 *               portalCloseDate: { type: string, format: date, example: "2026-10-31" }
 *               maxTenorMonths:  { type: integer, example: 4 }
 *               isActive:        { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Term created
 */
router.post("/terms", adminController.createTerm.bind(adminController));

/**
 * @swagger
 * /admin/terms/{id}:
 *   get:
 *     summary: Get a single school term
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: School term record
 */
router.get("/terms/:id", adminController.getTerm.bind(adminController));

/**
 * @swagger
 * /admin/terms/{id}:
 *   put:
 *     summary: Update a school term (dates, tenor, name, isActive)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:            { type: string }
 *               academicYear:    { type: string }
 *               portalOpenDate:  { type: string, format: date }
 *               portalCloseDate: { type: string, format: date }
 *               maxTenorMonths:  { type: integer }
 *               isActive:        { type: boolean }
 *     responses:
 *       200:
 *         description: Term updated
 */
router.put("/terms/:id", adminController.updateTerm.bind(adminController));

/**
 * @swagger
 * /admin/terms/{id}:
 *   delete:
 *     summary: Delete a school term
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Term deleted
 */
router.delete("/terms/:id", adminController.deleteTerm.bind(adminController));

/**
 * @swagger
 * /admin/terms/{id}/activate:
 *   put:
 *     summary: Activate a term (deactivates all others)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Term activated
 */
router.put(
  "/terms/:id/activate",
  adminController.activateTerm.bind(adminController),
);
