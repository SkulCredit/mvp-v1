import { Request, Response, NextFunction } from "express";
import webhookService, {
  LendsqrWebhookPayload,
} from "../services/webhook.service";
import { successResponse } from "../utils/response";
import logger from "../config/logger";

class WebhookController {
  async handleLendsqr(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      logger.info(
        `[webhook] Lendsqr inbound | ip=${req.ip} | body=${JSON.stringify(req.body)}`,
      );

      const payload = req.body as LendsqrWebhookPayload;

      if (!payload?.event || !payload?.data?.loan_id) {
        res
          .status(200)
          .json({ success: true, message: "Acknowledged (no-op)" });
        return;
      }

      const result = await webhookService.handleLendsqrWebhook(payload);

      successResponse(res, 200, result.message, { handled: result.handled });
    } catch (error) {
      logger.error(
        `[webhook] Error processing Lendsqr webhook: ${(error as Error).message}`,
      );
      res
        .status(200)
        .json({
          success: false,
          message: "Received — internal error during processing",
        });
      next(error);
    }
  }

  async getLedger(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const ledger = await webhookService.getLedgerByApplicationId(
        Array.isArray(req.params.applicationId)
          ? req.params.applicationId[0]
          : req.params.applicationId,
      );
      if (!ledger) {
        res.status(404).json({ success: false, message: "Ledger not found" });
        return;
      }
      successResponse(res, 200, "Ledger retrieved", ledger);
    } catch (error) {
      next(error);
    }
  }
}

export default new WebhookController();
