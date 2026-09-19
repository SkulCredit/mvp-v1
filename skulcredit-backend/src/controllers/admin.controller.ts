import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import schoolTermService from "../services/schoolTerm.service";
import { successResponse } from "../utils/response";

class AdminController {
  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.getDashboard();
      successResponse(res, 200, "Admin dashboard data fetched", result);
    } catch (error) {
      next(error);
    }
  }

  async getSchools(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.getSchools(
        req.query.status as string | undefined,
      );
      successResponse(res, 200, "Schools fetched", result);
    } catch (error) {
      next(error);
    }
  }

  async approveSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.approveSchool(String(req.params.id));
      successResponse(res, 200, "School approved", result);
    } catch (error) {
      next(error);
    }
  }

  async rejectSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.rejectSchool(String(req.params.id));
      successResponse(res, 200, "School rejected", result);
    } catch (error) {
      next(error);
    }
  }

  async getParents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.getParents();
      successResponse(res, 200, "Parents fetched", result);
    } catch (error) {
      next(error);
    }
  }

  async getLoanApplications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.getLoanApplications();
      successResponse(res, 200, "Loan applications fetched", result);
    } catch (error) {
      next(error);
    }
  }

  // ── School Terms ──────────────────────────────────────────────────────────

  async listTerms(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School terms fetched",
        await schoolTermService.listTerms(),
      );
    } catch (error) {
      next(error);
    }
  }

  async getTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School term fetched",
        await schoolTermService.getTerm(String(req.params.id)),
      );
    } catch (error) {
      next(error);
    }
  }

  async createTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "School term created",
        await schoolTermService.createTerm(req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School term updated",
        await schoolTermService.updateTerm(String(req.params.id), req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await schoolTermService.deleteTerm(String(req.params.id));
      successResponse(res, 200, "School term deleted");
    } catch (error) {
      next(error);
    }
  }

  async activateTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School term activated",
        await schoolTermService.activateTerm(String(req.params.id)),
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
