import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import schoolTermService from "../services/schoolTerm.service";
import { successResponse } from "../utils/response";
import { SchoolBankAccount, CatalogSchool } from "../models/index";
import ApiError from "../utils/apiError";

class AdminController {
  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Admin dashboard data fetched",
        await adminService.getDashboard(),
      );
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
      successResponse(
        res,
        200,
        "Schools fetched",
        await adminService.getSchools(req.query.status as string | undefined),
      );
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
      successResponse(
        res,
        200,
        "School approved",
        await adminService.approveSchool(String(req.params.id)),
      );
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
      successResponse(
        res,
        200,
        "School rejected",
        await adminService.rejectSchool(String(req.params.id)),
      );
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
      successResponse(
        res,
        200,
        "Parents fetched",
        await adminService.getParents(),
      );
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
      successResponse(
        res,
        200,
        "Loan applications fetched",
        await adminService.getLoanApplications(),
      );
    } catch (error) {
      next(error);
    }
  }

  // ── Academic Sessions ─────────────────────────────────────────────────────

  async listSessions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Sessions fetched",
        await schoolTermService.listSessions(),
      );
    } catch (error) {
      next(error);
    }
  }

  async getSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Session fetched",
        await schoolTermService.getSession(String(req.params.id)),
      );
    } catch (error) {
      next(error);
    }
  }

  async createSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "Session created",
        await schoolTermService.createSession(req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Session updated",
        await schoolTermService.updateSession(String(req.params.id), req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await schoolTermService.deleteSession(String(req.params.id));
      successResponse(res, 200, "Session deleted");
    } catch (error) {
      next(error);
    }
  }

  async setCurrentSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Session set as current",
        await schoolTermService.setCurrentSession(String(req.params.id)),
      );
    } catch (error) {
      next(error);
    }
  }

  // ── Academic Terms ────────────────────────────────────────────────────────

  async listTerms(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Terms fetched",
        await schoolTermService.listTerms(
          req.query.sessionId as string | undefined,
        ),
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
        "Term fetched",
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
        "Term created",
        await schoolTermService.createTerm(
          String(req.params.sessionId),
          req.body,
        ),
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
        "Term updated",
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
      successResponse(res, 200, "Term deleted");
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
        "Term activated",
        await schoolTermService.activateTerm(String(req.params.id)),
      );
    } catch (error) {
      next(error);
    }
  }

  // ── School Bank Accounts ──────────────────────────────────────────────────

  async getBankAccounts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const accounts = await SchoolBankAccount.findAll({
        where: { catalogSchoolId: String(req.params.schoolId) },
        include: [
          { model: CatalogSchool, as: "school", attributes: ["id", "name"] },
        ],
        order: [
          ["isPrimary", "DESC"],
          ["createdAt", "ASC"],
        ],
      });
      successResponse(res, 200, "Bank accounts fetched", accounts);
    } catch (error) {
      next(error);
    }
  }

  async addBankAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const school = await CatalogSchool.findByPk(String(req.params.schoolId));
      if (!school) throw new ApiError(404, "School not found");
      const account = await SchoolBankAccount.create({
        catalogSchoolId: school.id,
        ...req.body,
      });
      successResponse(res, 201, "Bank account added", account);
    } catch (error) {
      next(error);
    }
  }

  async updateBankAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const account = await SchoolBankAccount.findByPk(String(req.params.id));
      if (!account) throw new ApiError(404, "Bank account not found");
      await account.update(req.body);
      successResponse(res, 200, "Bank account updated", account);
    } catch (error) {
      next(error);
    }
  }

  async deleteBankAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const account = await SchoolBankAccount.findByPk(String(req.params.id));
      if (!account) throw new ApiError(404, "Bank account not found");
      await account.destroy();
      successResponse(res, 200, "Bank account deleted");
    } catch (error) {
      next(error);
    }
  }

  async updateSchoolTier(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const school = await CatalogSchool.findByPk(String(req.params.schoolId));
      if (!school) throw new ApiError(404, "School not found");
      const { tier, isRegistered, serviceChargeRate } = req.body as {
        tier?: string | null;
        isRegistered?: boolean;
        serviceChargeRate?: number;
      };
      await school.update({
        ...(tier !== undefined && { tier }),
        ...(isRegistered !== undefined && { isRegistered }),
        ...(serviceChargeRate !== undefined && { serviceChargeRate }),
      });
      successResponse(res, 200, "School tier updated", school);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
