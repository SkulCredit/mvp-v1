import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import adminService from "../services/admin.service";

class SchoolVerificationController {
  async getByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getSchoolVerificationLinkByToken(String(req.params.token));
      successResponse(res, 200, "Verification link fetched", data);
    } catch (e) {
      next(e);
    }
  }

  async useLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);
      const { action, rejectionNote } = req.body as {
        action: "confirmed" | "rejected";
        rejectionNote?: string;
      };
      if (action !== "confirmed" && action !== "rejected") {
        res.status(400).json({ success: false, message: "action must be confirmed or rejected" });
        return;
      }
      const data = await adminService.useSchoolVerificationLink(token, action, rejectionNote);
      successResponse(res, 200, action === "confirmed" ? "Application confirmed" : "Application rejected", data);
    } catch (e) {
      next(e);
    }
  }
}

export default new SchoolVerificationController();
