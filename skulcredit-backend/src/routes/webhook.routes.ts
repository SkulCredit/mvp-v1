/**
 * Webhook routes — inbound callbacks from Lendsqr.
 *
 * These endpoints are intentionally NOT behind the regular JWT `protect`
 * middleware because they are called by Lendsqr's servers, not by our users.
 * We authenticate them via a shared secret in the X-Lendsqr-Signature header
 * (validated in the controller / middleware layer).
 */

import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Inbound event callbacks from third-party providers
 */

/**
 * @swagger
 * /webhooks/lendsqr:
 *   post:
 *     summary: Receive a loan status event from Lendsqr Adjutor
 *     tags: [Webhooks]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, data]
 *             properties:
 *               event:
 *                 type: string
 *                 example: loan.disbursed
 *               data:
 *                 type: object
 *                 required: [loan_id]
 *                 properties:
 *                   loan_id:
 *                     type: integer
 *                   loan_profile_id:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   disbursed_at:
 *                     type: string
 *                     format: date-time
 *                   settlement_reference:
 *                     type: string
 *     responses:
 *       200:
 *         description: Event acknowledged
 */
router.post('/lendsqr', webhookController.handleLendsqr.bind(webhookController));

/**
 * @swagger
 * /webhooks/lendsqr/ledger/{applicationId}:
 *   get:
 *     summary: Retrieve the full LoanLedger for an application (admin)
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: LoanLedger record
 *       404:
 *         description: Ledger not found
 */
router.get(
  '/lendsqr/ledger/:applicationId',
  protect,
  authorize('admin'),
  webhookController.getLedger.bind(webhookController),
);

export default router;
