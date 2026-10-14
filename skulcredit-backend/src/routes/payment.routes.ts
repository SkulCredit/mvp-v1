import { Router, Request, Response, NextFunction } from "express";
import aletpayService from "../integrations/aletpay/aletpay.service";
import { protect } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import env from "../config/env";
import { ParentRepository, UserRepository } from "../repositories";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Aletpay virtual account payment routes
 */

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Generate an Aletpay virtual account for service charge payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               orderId:
 *                 type: string
 *               description:
 *                 type: string
 *               customer:
 *                 type: object
 *     responses:
 *       200:
 *         description: Virtual account generated
 */
router.post(
  "/initialize",
  protect,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, orderId, description, customer } = req.body as {
        amount: number;
        orderId: string;
        description: string;
        customer?: {
          email?: string;
          phone?: string;
          firstName?: string;
          lastName?: string;
        };
      };

      // Look up the parent profile to fill in customer details
      const [parent, user] = await Promise.all([
        ParentRepository.findOne({ userId: req.user!.userId }),
        UserRepository.findOne({ id: req.user!.userId }),
      ]);

      const result = await aletpayService.generateVirtualAccount({
        amount: Number(amount),
        orderId: String(orderId),
        description: String(description ?? "Service charge payment"),
        customer: {
          email:     customer?.email     ?? req.user!.email,
          phone:     customer?.phone     ?? user?.phoneNumber ?? parent?.bvnPhoneNumber ?? "",
          firstName: customer?.firstName ?? parent?.firstName ?? "",
          lastName:  customer?.lastName  ?? parent?.lastName  ?? "",
        },
      });

      successResponse(res, 200, "Virtual account generated", result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /payments/verify/{transactionId}:
 *   get:
 *     summary: Check the status of an Aletpay transaction
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction status
 */
router.get(
  "/verify/:transactionId",
  protect,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await aletpayService.getTransaction(
        String(req.params.transactionId),
      );
      successResponse(res, 200, "Transaction status", result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /payments/disbursement-virtual-account:
 *   post:
 *     summary: Generate an Aletpay virtual account for funding partner disbursement (no auth required)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicationId:
 *                 type: string
 *               amount:
 *                 type: number
 *               schoolName:
 *                 type: string
 *               bankAccountNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disbursement virtual account generated
 */
router.post(
  "/disbursement-virtual-account",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { applicationId, amount, schoolName, bankAccountNumber } =
        req.body as {
          applicationId?: string;
          amount: number;
          schoolName?: string;
          bankAccountNumber?: string;
        };

      void bankAccountNumber; // informational only — not sent to Aletpay

      const orderId = `DISB-${String(applicationId ?? "").slice(0, 8)}-${Date.now()}`;
      const description = `Disbursement for application ${applicationId ?? "N/A"} to ${schoolName ?? "school"}`;

      const result = await aletpayService.generateVirtualAccount({
        amount: Number(amount),
        orderId,
        description,
        customer: {
          email: env.fundingPartner.email || "funding@skulcredit.com",
          phone: "08000000000",
          firstName: env.fundingPartner.name.split(" ")[0] || "SkulCredit",
          lastName: env.fundingPartner.name.split(" ").slice(1).join(" ") || "Funding",
        },
      });

      successResponse(res, 200, "Disbursement virtual account generated", result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
