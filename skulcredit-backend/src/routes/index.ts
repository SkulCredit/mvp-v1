import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import parentRoutes from "./parent.routes";
import schoolRoutes from "./school.routes";
import uploadRoutes from "./upload.routes";
import loanRoutes from "./loan.routes";
import adminRoutes from "./admin.routes";
import paymentRoutes from "./payment.routes";
import notificationRoutes from "./notification.routes";
import catalogRoutes from "./catalog.routes";
import webhookRoutes from "./webhook.routes";
import supportRoutes from "./support.routes";
import csRoutes from "./cs.routes";
import financeRoutes from "./finance.routes";
import schoolVerificationRoutes from "./schoolVerification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/parents", parentRoutes);
router.use("/schools", schoolRoutes);
router.use("/upload", uploadRoutes);
router.use("/loans", loanRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/catalog", catalogRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/support", supportRoutes);
router.use("/cs", csRoutes);
router.use("/finance", financeRoutes);
router.use("/school-verification", schoolVerificationRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Server health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: "Server is running", version: "1.0.0" });
});

export default router;
