import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import schoolTermService from "../services/schoolTerm.service";
import { successResponse } from "../utils/response";
import { SchoolBankAccount, CatalogSchool } from "../models/index";
import ApiError from "../utils/apiError";

function qInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

class AdminController {
  /** GET /admin/dashboard */
  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Dashboard data fetched",
        await adminService.getDashboard(),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/analytics/applications
   * Query: ?period=today|week|month|quarter|year&groupBy=day|month|year
   */
  async getApplicationStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { period, groupBy } = req.query as {
        period?: string;
        groupBy?: "day" | "month" | "year";
      };
      successResponse(
        res,
        200,
        "Application stats fetched",
        await adminService.getApplicationStats(period, groupBy ?? "month"),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/analytics/revenue
   * Query: ?period=today|week|month|quarter|year&groupBy=day|month|year
   */
  async getRevenueStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { period, groupBy } = req.query as {
        period?: string;
        groupBy?: "day" | "month" | "year";
      };
      successResponse(
        res,
        200,
        "Revenue stats fetched",
        await adminService.getRevenueStats(period, groupBy ?? "month"),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/analytics/market-projection */
  async getMarketProjection(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Market projection fetched",
        await adminService.getMarketProjection(),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/users
   * Query: ?role=parent|school|admin&search=<email>
   */
  async listUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { role, search } = req.query as { role?: string; search?: string };
      successResponse(
        res,
        200,
        "Users fetched",
        await adminService.listUsers(role, search),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/users/:id */
  async getUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "User fetched",
        await adminService.getUser(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/users/:id/toggle-active
   * Body: { isActive: boolean }
   */
  async toggleUserActive(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { isActive } = req.body as { isActive: boolean };
      if (typeof isActive !== "boolean")
        throw new ApiError(400, "isActive must be a boolean");
      successResponse(
        res,
        200,
        "User status updated",
        await adminService.toggleUserActive(String(req.params.id), isActive),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/users/:id/email
   * Body: { email: string }
   */
  async resetUserEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      if (!email) throw new ApiError(400, "email is required");
      successResponse(
        res,
        200,
        "User email updated",
        await adminService.resetUserEmail(String(req.params.id), email),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/parents
   * Query: ?search=<email>&kycStatus=pending|submitted|approved|rejected&page=1&limit=20
   */
  async listParents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { search, kycStatus } = req.query as {
        search?: string;
        kycStatus?: string;
      };
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Parents fetched",
        await adminService.listParents(search, kycStatus, page, limit),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/parents/:id */
  async getParent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Parent fetched",
        await adminService.getParent(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/parents/:id/kyc
   * Body: { kycStatus: string, adminNote?: string }
   */
  async updateParentKyc(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { kycStatus, adminNote } = req.body as {
        kycStatus: string;
        adminNote?: string;
      };
      if (!kycStatus) throw new ApiError(400, "kycStatus is required");
      successResponse(
        res,
        200,
        "Parent KYC status updated",
        await adminService.updateParentKyc(
          String(req.params.id),
          kycStatus,
          adminNote,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/schools
   * Query: ?status=pending|under_review|approved|rejected
   */
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
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/schools/:id */
  async getSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School fetched",
        await adminService.getSchool(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /** PUT /admin/schools/:id/approve */
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
    } catch (e) {
      next(e);
    }
  }

  /** PUT /admin/schools/:id/reject */
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
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/schools/:id/status
   * Body: { status: string, adminNote?: string }
   */
  async updateSchoolStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, adminNote } = req.body as {
        status: string;
        adminNote?: string;
      };
      if (!status) throw new ApiError(400, "status is required");
      successResponse(
        res,
        200,
        "School status updated",
        await adminService.updateSchoolStatus(
          String(req.params.id),
          status,
          adminNote,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/catalog-schools
   * Query: ?search=<name>&isRegistered=true|false
   */
  async listCatalogSchools(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { search } = req.query as { search?: string };
      const isRegistered =
        req.query.isRegistered === undefined
          ? undefined
          : req.query.isRegistered === "true";
      successResponse(
        res,
        200,
        "Catalog schools fetched",
        await adminService.listCatalogSchools(search, isRegistered),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/catalog-schools/:id */
  async getCatalogSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Catalog school fetched",
        await adminService.getCatalogSchool(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/catalog-schools/:id
   * Body: { name?, tier?, isRegistered?, serviceChargeRate?, isActive? }
   */
  async updateCatalogSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Catalog school updated",
        await adminService.updateCatalogSchool(String(req.params.id), req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/catalog-schools/:schoolId/tier
   * Body: { tier?, isRegistered?, serviceChargeRate? }
   */
  async updateSchoolTier(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School tier updated",
        await adminService.updateCatalogSchool(
          String(req.params.schoolId),
          req.body,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/catalog-schools/:schoolId/bank-accounts */
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
      } as never);
      successResponse(res, 200, "Bank accounts fetched", accounts);
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /admin/catalog-schools/:schoolId/bank-accounts
   * Body: { bankName, accountNumber, accountName, bankCode?, isPrimary? }
   */
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
      } as never);
      successResponse(res, 201, "Bank account added", account);
    } catch (e) {
      next(e);
    }
  }

  /**
   * PUT /admin/bank-accounts/:id
   * Body: { bankName?, accountNumber?, accountName?, bankCode?, isPrimary?, isVerified? }
   */
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
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/bank-accounts/:id */
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
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/class-levels
   * Query: ?schoolId=&institutionTypeId=
   */
  async listClassLevels(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { schoolId, institutionTypeId } = req.query as {
        schoolId?: string;
        institutionTypeId?: string;
      };
      successResponse(
        res,
        200,
        "Class levels fetched",
        await adminService.listClassLevels(schoolId, institutionTypeId),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /admin/class-levels
   * Body: { schoolId, institutionTypeId, className, subLevelGroup?, sortOrder? }
   */
  async createClassLevel(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "Class level created",
        await adminService.createClassLevel(req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PUT /admin/class-levels/:id
   * Body: { subLevelGroup?, className?, sortOrder? }
   */
  async updateClassLevel(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Class level updated",
        await adminService.updateClassLevel(String(req.params.id), req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/class-levels/:id */
  async deleteClassLevel(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteClassLevel(String(req.params.id));
      successResponse(res, 200, "Class level deleted");
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/institution-types */
  async listInstitutionTypes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Institution types fetched",
        await adminService.listInstitutionTypes(),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /admin/institution-types
   * Body: { name, sortOrder? }
   */
  async createInstitutionType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "Institution type created",
        await adminService.createInstitutionType(req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PUT /admin/institution-types/:id
   * Body: { name?, sortOrder? }
   */
  async updateInstitutionType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Institution type updated",
        await adminService.updateInstitutionType(
          String(req.params.id),
          req.body,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/institution-types/:id */
  async deleteInstitutionType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteInstitutionType(String(req.params.id));
      successResponse(res, 200, "Institution type deleted");
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/students
   * Query: ?parentId=&schoolId=&page=1&limit=20
   */
  async listStudents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { parentId, schoolId } = req.query as {
        parentId?: string;
        schoolId?: string;
      };
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Students fetched",
        await adminService.listStudents(parentId, schoolId, page, limit),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/students/:id */
  async getStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Student fetched",
        await adminService.getStudent(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PUT /admin/students/:id
   * Body: { firstName?, lastName?, studentId?, gradeLevel?, tuitionAmount? }
   */
  async updateStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Student updated",
        await adminService.updateStudent(String(req.params.id), req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/students/:id */
  async deleteStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteStudent(String(req.params.id));
      successResponse(res, 200, "Student deleted");
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/loans
   * Query: ?status=&parentId=&studentId=&catalogSchoolId=
   *        &fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&page=1&limit=20
   */
  async getLoanApplications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, parentId, studentId, catalogSchoolId, fromDate, toDate } =
        req.query as Record<string, string>;
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);

      successResponse(
        res,
        200,
        "Loan applications fetched",
        await adminService.getLoanApplications({
          status,
          parentId,
          studentId,
          catalogSchoolId,
          fromDate,
          toDate,
          page,
          limit,
        }),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/loans/:id */
  async getLoanApplication(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Loan application fetched",
        await adminService.getLoanApplication(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/loans/:id/status
   * Body: { status, rejectionReason?, adminNote?, decidedBy? }
   */
  async updateApplicationStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, rejectionReason, adminNote, decidedBy } = req.body as {
        status: string;
        rejectionReason?: string;
        adminNote?: string;
        decidedBy?: string;
      };
      if (!status) throw new ApiError(400, "status is required");
      successResponse(
        res,
        200,
        "Application status updated",
        await adminService.updateApplicationStatus(
          String(req.params.id),
          status,
          {
            rejectionReason,
            adminNote,
            decidedBy,
          },
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/loans/:id/note
   * Body: { adminNote: string }
   */
  async updateApplicationNote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { adminNote } = req.body as { adminNote: string };
      if (!adminNote) throw new ApiError(400, "adminNote is required");
      successResponse(
        res,
        200,
        "Application note updated",
        await adminService.updateApplicationNote(
          String(req.params.id),
          adminNote,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/loans/:id/events */
  async listApplicationEvents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Application events fetched",
        await adminService.listApplicationEvents(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /admin/loans/:id/events
   * Body: { actor, actorId?, status, note? }
   */
  async createApplicationEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "Event created",
        await adminService.createApplicationEvent({
          loanApplicationId: String(req.params.id),
          ...req.body,
        }),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/ledgers
   * Query: ?status=&page=1&limit=20
   */
  async listLoanLedgers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Loan ledgers fetched",
        await adminService.listLoanLedgers(
          req.query.status as string | undefined,
          page,
          limit,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/ledgers/loan/:loanApplicationId */
  async getLoanLedger(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Loan ledger fetched",
        await adminService.getLoanLedger(String(req.params.loanApplicationId)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/loan-offers
   * Query: ?status=&page=1&limit=20
   */
  async listLoanOffers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Loan offers fetched",
        await adminService.listLoanOffers(
          req.query.status as string | undefined,
          page,
          limit,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/loan-offers/loan/:loanApplicationId */
  async getLoanOffer(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Loan offer fetched",
        await adminService.getLoanOffer(String(req.params.loanApplicationId)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/loan-offers/:id/status
   * Body: { status: string }
   */
  async updateLoanOfferStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status } = req.body as { status: string };
      if (!status) throw new ApiError(400, "status is required");
      successResponse(
        res,
        200,
        "Loan offer status updated",
        await adminService.updateLoanOfferStatus(String(req.params.id), status),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/disbursements
   * Query: ?status=&schoolId=&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&page=1&limit=20
   */
  async listDisbursements(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, schoolId, fromDate, toDate } = req.query as Record<
        string,
        string
      >;
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Disbursements fetched",
        await adminService.listDisbursements({
          status,
          schoolId,
          fromDate,
          toDate,
          page,
          limit,
        }),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/disbursements/:id */
  async getDisbursement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Disbursement fetched",
        await adminService.getDisbursement(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/disbursements/:id/status
   * Body: { status, paystackTransferCode?, paystackTransferId?,
   *         paystackReference?, failureReason?, notes? }
   */
  async updateDisbursementStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, ...extras } = req.body as {
        status: string;
        [k: string]: string;
      };
      if (!status) throw new ApiError(400, "status is required");
      successResponse(
        res,
        200,
        "Disbursement status updated",
        await adminService.updateDisbursementStatus(
          String(req.params.id),
          status,
          extras,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/repayments
   * Query: ?loanApplicationId=&parentId=&status=
   *        &fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&page=1&limit=20
   */
  async listRepayments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { loanApplicationId, parentId, status, fromDate, toDate } =
        req.query as Record<string, string>;
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Repayments fetched",
        await adminService.listRepayments({
          loanApplicationId,
          parentId,
          status,
          fromDate,
          toDate,
          page,
          limit,
        }),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/repayments/:id */
  async getRepayment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Repayment fetched",
        await adminService.getRepayment(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /admin/repayments/manual
   * Body: { loanApplicationId, parentId, amount, paymentMethod, type,
   *         paidAt?, notes?, recordedBy?, receiptNumber? }
   */
  async recordManualRepayment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const payload = req.body as {
        loanApplicationId: string;
        parentId: string;
        amount: number;
        paymentMethod: string;
        type: string;
        paidAt?: string;
        notes?: string;
        recordedBy?: string;
        receiptNumber?: string;
      };
      const required = [
        "loanApplicationId",
        "parentId",
        "amount",
        "paymentMethod",
        "type",
      ];
      for (const k of required) {
        if (!payload[k as keyof typeof payload])
          throw new ApiError(400, `${k} is required`);
      }
      successResponse(
        res,
        201,
        "Manual repayment recorded",
        await adminService.recordManualRepayment(payload),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/loans/:id/schedule */
  async getRepaymentSchedule(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Repayment schedule fetched",
        await adminService.getRepaymentSchedule(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/schedule/:id
   * Body: { status?, amountPaid?, paidAt?, lateFeeApplied? }
   */
  async updateScheduleInstallment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Installment updated",
        await adminService.updateScheduleInstallment(
          String(req.params.id),
          req.body,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/documents
   * Query: ?parentId=&category=photo|kyc_document&page=1&limit=20
   */
  async listDocuments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { parentId, category } = req.query as {
        parentId?: string;
        category?: string;
      };
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Documents fetched",
        await adminService.listDocuments(parentId, category, page, limit),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/documents/:id */
  async getDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Document fetched",
        await adminService.getDocument(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/documents/:id */
  async deleteDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteDocument(String(req.params.id));
      successResponse(res, 200, "Document deleted");
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/school-requests
   * Query: ?status=pending|in_progress|onboarded|rejected&page=1&limit=20
   */
  async listSchoolRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "School requests fetched",
        await adminService.listSchoolRequests(
          req.query.status as string | undefined,
          page,
          limit,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/school-requests/:id */
  async getSchoolRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School request fetched",
        await adminService.getSchoolRequest(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * PATCH /admin/school-requests/:id/status
   * Body: { status: string, adminNote?: string }
   */
  async updateSchoolRequestStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, adminNote } = req.body as {
        status: string;
        adminNote?: string;
      };
      if (!status) throw new ApiError(400, "status is required");
      successResponse(
        res,
        200,
        "School request status updated",
        await adminService.updateSchoolRequestStatus(
          String(req.params.id),
          status,
          adminNote,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/notifications
   * Query: ?userId=&isRead=true|false&page=1&limit=20
   */
  async listNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.query as { userId?: string };
      const isRead =
        req.query.isRead === undefined
          ? undefined
          : req.query.isRead === "true";
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Notifications fetched",
        await adminService.listNotifications(userId, isRead, page, limit),
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /admin/notifications/broadcast
   * Body: { userIds?[], role?, title, message, type, referenceId?, referenceType? }
   */
  async broadcastNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { title, message, type } = req.body as {
        title: string;
        message: string;
        type: string;
      };
      if (!title || !message || !type) {
        throw new ApiError(400, "title, message, and type are required");
      }
      successResponse(
        res,
        201,
        "Notification broadcast sent",
        await adminService.broadcastNotification(req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/notifications/:id */
  async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteNotification(String(req.params.id));
      successResponse(res, 200, "Notification deleted");
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/device-tokens
   * Query: ?userId=
   */
  async listDeviceTokens(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Device tokens fetched",
        await adminService.listDeviceTokens(
          req.query.userId as string | undefined,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/device-tokens/:id */
  async deleteDeviceToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteDeviceToken(String(req.params.id));
      successResponse(res, 200, "Device token deleted");
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/sessions */
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
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/sessions/:id */
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
    } catch (e) {
      next(e);
    }
  }

  /** POST /admin/sessions */
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
    } catch (e) {
      next(e);
    }
  }

  /** PUT /admin/sessions/:id */
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
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/sessions/:id */
  async deleteSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await schoolTermService.deleteSession(String(req.params.id));
      successResponse(res, 200, "Session deleted");
    } catch (e) {
      next(e);
    }
  }

  /** PUT /admin/sessions/:id/current */
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
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/terms?sessionId= */
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
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/terms/:id */
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
    } catch (e) {
      next(e);
    }
  }

  /** POST /admin/sessions/:sessionId/terms */
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
    } catch (e) {
      next(e);
    }
  }

  /** PUT /admin/terms/:id */
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
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/terms/:id */
  async deleteTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await schoolTermService.deleteTerm(String(req.params.id));
      successResponse(res, 200, "Term deleted");
    } catch (e) {
      next(e);
    }
  }

  /** PUT /admin/terms/:id/activate */
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
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /admin/school-terms
   * Query: ?schoolId=
   */
  async listSchoolTerms(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School terms fetched",
        await adminService.listSchoolTerms(
          req.query.schoolId as string | undefined,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  /** GET /admin/school-terms/:id */
  async getSchoolTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School term fetched",
        await adminService.getSchoolTerm(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  /** DELETE /admin/school-terms/:id */
  async deleteSchoolTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteSchoolTerm(String(req.params.id));
      successResponse(res, 200, "School term deleted");
    } catch (e) {
      next(e);
    }
  }

  async listFundingPartners(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status } = req.query as { status?: string };
      successResponse(
        res,
        200,
        "Funding partners fetched",
        await adminService.listFundingPartners(status),
      );
    } catch (e) {
      next(e);
    }
  }

  async getFundingPartner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Funding partner fetched",
        await adminService.getFundingPartner(String(req.params.id)),
      );
    } catch (e) {
      next(e);
    }
  }

  async createFundingPartner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.createFundingPartner(
        req.body as {
          name: string;
          email: string;
          phone?: string | null;
          contactPerson?: string | null;
          status?: "active" | "inactive";
          notes?: string | null;
        },
      );
      successResponse(res, 201, "Funding partner created", result);
    } catch (e) {
      next(e);
    }
  }

  async updateFundingPartner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await adminService.updateFundingPartner(
        String(req.params.id),
        req.body as {
          name?: string;
          email?: string;
          phone?: string | null;
          contactPerson?: string | null;
          status?: "active" | "inactive";
          notes?: string | null;
        },
      );
      successResponse(res, 200, "Funding partner updated", result);
    } catch (e) {
      next(e);
    }
  }

  async deleteFundingPartner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.deleteFundingPartner(String(req.params.id));
      successResponse(res, 200, "Funding partner deleted");
    } catch (e) {
      next(e);
    }
  }
}

export default new AdminController();
