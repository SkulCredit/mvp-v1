import { Router, Request, Response, NextFunction } from 'express';
import paystackService from '../integrations/paystack/paystack.service';
import { protect } from '../middlewares/auth.middleware';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Paystack payment initialization and verification
 */

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize a Paystack payment transaction
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitializePayment'
 *     responses:
 *       200:
 *         description: Payment initialized — returns authorization_url
 */
router.post('/initialize', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, metadata } = req.body;
    const result = await paystackService.initializePayment({ email: req.user!.email, amount, metadata }) as { data: unknown };
    successResponse(res, 200, 'Payment initialized', result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a Paystack transaction by reference
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction verification result
 */
router.get('/verify/:reference', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paystackService.verifyPayment(String(req.params.reference)) as { data: unknown };
    successResponse(res, 200, 'Payment verified', result.data);
  } catch (error) {
    next(error);
  }
});

export default router;
