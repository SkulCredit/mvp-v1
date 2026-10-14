import { Router } from 'express';
import loanController from '../controllers/loan.controller';
import validate from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { eligibilitySchema, applySchema } from '../validators/loan.validator';

const router = Router();

router.use(protect, authorize('parent'));

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: "Loan eligibility check and application (role: parent)"
 */

/**
 * @swagger
 * /loans/eligibility:
 *   post:
 *     summary: Check loan eligibility for a given amount
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckEligibility'
 *     responses:
 *       200:
 *         description: Eligibility result returned
 */
router.post('/eligibility', validate(eligibilitySchema), loanController.checkEligibility.bind(loanController));

/**
 * @swagger
 * /loans/apply:
 *   post:
 *     summary: Submit a school-fee loan application
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyLoan'
 *     responses:
 *       201:
 *         description: Loan application submitted
 */
router.post('/apply', validate(applySchema), loanController.submitApplication.bind(loanController));

export default router;
