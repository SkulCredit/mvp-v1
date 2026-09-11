import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

router.use(protect, authorize('admin'));

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
router.get('/dashboard', adminController.getDashboard.bind(adminController));

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
router.get('/schools', adminController.getSchools.bind(adminController));

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
router.put('/schools/:id/approve', adminController.approveSchool.bind(adminController));

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
router.put('/schools/:id/reject', adminController.rejectSchool.bind(adminController));

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
router.get('/parents', adminController.getParents.bind(adminController));

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
router.get('/loans', adminController.getLoanApplications.bind(adminController));

export default router;
