import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import authService from "../services/auth.service";
import schoolTermService from "../services/schoolTerm.service";
import parentService from "../services/parent.service";
import schoolService from "../services/school.service";
import notificationService from "../notifications/notification.service";
import { successResponse } from "../utils/response";
import {
  SchoolBankAccount,
  CatalogSchool,
  LoanApplication,
} from "../models/index";
import { ParentRepository, UserRepository } from "../repositories";
import ApiError from "../utils/apiError";

function qInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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
        "Dashboard data fetched",
        await adminService.getDashboard(),
      );
    } catch (e) {
      next(e);
    }
  }

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

  async updateStaffUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "User updated",
        await adminService.updateStaffUser(String(req.params.id), req.body),
      );
    } catch (e) {
      next(e);
    }
  }

  async createStaffUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password, phoneNumber, firstName, lastName, role } =
        req.body as {
          email: string;
          password: string;
          phoneNumber?: string;
          firstName?: string;
          lastName?: string;
          role?: "admin" | "customer_service" | "customer_service_manager";
        };

      if (!email || !password)
        throw new ApiError(400, "email and password are required");

      const allowedRoles = [
        "admin",
        "customer_service",
        "customer_service_manager",
      ];
      const assignedRole = allowedRoles.includes(role ?? "")
        ? (role as "admin" | "customer_service" | "customer_service_manager")
        : "admin";

      const user = await authService.createAdmin({
        email,
        password,
        phoneNumber,
        firstName,
        lastName,
        role: assignedRole,
      });

      successResponse(res, 201, "Staff user created successfully", user);
    } catch (e) {
      next(e);
    }
  }

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

  async updateSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School updated",
        await adminService.updateSchool(
          String(req.params.id),
          req.body as never,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  async createSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "School created",
        await adminService.createSchool(req.body as never),
      );
    } catch (e) {
      next(e);
    }
  }

  async createSchoolLoginAccess(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Login access created",
        await adminService.createSchoolLoginAccess(String(req.params.id)),
      );
    } catch (e) {
      next(e);
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
    } catch (e) {
      next(e);
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
    } catch (e) {
      next(e);
    }
  }

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

  async listDisbursementRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = (req.query.status as string | undefined) ?? "all";
      const page = qInt(req.query.page, 1);
      const limit = qInt(req.query.limit, 20);
      successResponse(
        res,
        200,
        "Disbursement requests fetched",
        await adminService.listDisbursementRequests(status, page, limit),
      );
    } catch (e) {
      next(e);
    }
  }

  async assignDisbursementPartner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { fundingPartnerId, contactId, note } = req.body as {
        fundingPartnerId: string;
        contactId?: string;
        note?: string;
      };
      if (!fundingPartnerId)
        throw new ApiError(400, "fundingPartnerId is required");
      successResponse(
        res,
        200,
        "Disbursement partner assigned",
        await adminService.assignDisbursementPartner(
          String(req.params.id),
          fundingPartnerId,
          contactId,
          note,
        ),
      );
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

  async getParentEligibilityStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await parentService.getEligibilityStatus(
        String(req.params.parentId),
      );
      successResponse(res, 200, "Eligibility status fetched", result);
    } catch (e) {
      next(e);
    }
  }

  async getParentEligibilityProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await parentService.getEligibilityProfile(
        String(req.params.parentId),
      );
      successResponse(res, 200, "Eligibility profile fetched", result);
    } catch (e) {
      next(e);
    }
  }

  async updateParentEligibilityProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await parentService.updateEligibilityProfile(
        String(req.params.parentId),
        req.body as {
          photoUrl?: string;
          phoneNumber?: string;
          employerType?: string;
          yearsInRole?: string;
          monthlyIncome?: string;
        },
      );
      successResponse(res, 200, "Eligibility profile updated", result);
    } catch (e) {
      next(e);
    }
  }

  async adminConfirmServiceCharge(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await parentService.confirmServiceCharge(
        String(req.params.parentId),
        String(req.params.loanId),
        (req.body as { paystackReference?: string }).paystackReference,
      );
      successResponse(res, 200, "Service charge confirmed", result);
    } catch (e) {
      next(e);
    }
  }

  async adminSetupRepayment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await parentService.setupRepayment(
        String(req.params.parentId),
        String(req.params.loanId),
        { debitDay: (req.body as { debitDay?: number }).debitDay },
      );
      successResponse(res, 200, "Repayment plan set up successfully", result);
    } catch (e) {
      next(e);
    }
  }

  async adminGetMandatePreview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const debitDay = req.query.debitDay ? Number(req.query.debitDay) : 1;
      const appData = await parentService.getRepaymentSchedule(
        String(req.params.parentId),
        String(req.params.loanId),
      );
      const app = appData as {
        tenor: number;
        amountApproved: number | null;
        amountRequested: number;
      };
      const totalAmount = Number(app.amountApproved ?? app.amountRequested);
      const preview = parentService.getMandatePreview(
        app.tenor,
        totalAmount,
        debitDay,
      );
      successResponse(res, 200, "Mandate preview generated", {
        tenor: app.tenor,
        totalAmount,
        debitDay: Math.min(Math.max(Math.round(debitDay), 1), 28),
        installmentAmount: Math.round(totalAmount / app.tenor),
        preview,
      });
    } catch (e) {
      next(e);
    }
  }

  async adminPayInstallment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { paystackReference, scheduleIds, type } = req.body as {
        paystackReference: string;
        scheduleIds: string[];
        type: "scheduled" | "early_partial" | "early_full";
      };
      if (!paystackReference || !scheduleIds?.length) {
        throw new ApiError(
          400,
          "paystackReference and scheduleIds are required",
        );
      }
      const result = await parentService.payInstallment(
        String(req.params.parentId),
        String(req.params.loanId),
        {
          paystackReference,
          scheduleIds,
          type: type ?? "scheduled",
        },
      );
      successResponse(res, 200, "Repayment recorded successfully", result);
    } catch (e) {
      next(e);
    }
  }

  async adminCheckLoanScore(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { bvn, requestedAmount, location } = req.body as {
        bvn: string;
        requestedAmount?: number;
        location?: string;
      };
      if (!bvn || !/^\d{11}$/.test(bvn)) {
        throw new ApiError(400, "Valid 11-digit BVN is required");
      }
      const result = await parentService.checkLoanScore(
        String(req.params.parentId),
        bvn,
        requestedAmount ?? 100,
        location ?? "Lagos",
      );
      successResponse(res, 200, "Score check complete", result);
    } catch (e) {
      next(e);
    }
  }

  async adminVerifyEnrollment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await schoolService.verifyEnrollment(
        String(req.params.schoolUserId),
        String(req.params.loanId),
        req.body as {
          action: "confirm" | "reject";
          confirmedTuitionAmount?: number;
          note?: string;
        },
      );
      const action =
        (req.body as { action: string }).action === "confirm"
          ? "confirmed"
          : "rejected";
      successResponse(res, 200, `Enrollment ${action} successfully`, result);
    } catch (e) {
      next(e);
    }
  }

  async adminGetSchoolDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await schoolService.getDashboard(
        String(req.params.schoolUserId),
      );
      successResponse(
        res,
        200,
        "School dashboard fetched successfully",
        result,
      );
    } catch (e) {
      next(e);
    }
  }

  async adminGetCurrentTerm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const term = await schoolTermService.getActiveTerm();
      if (!term) {
        successResponse(res, 200, "No active term", {
          isOpen: false,
          term: null,
        });
        return;
      }
      const effectiveTenor = schoolTermService.computeEffectiveTenor(term);
      successResponse(res, 200, "Current term fetched", {
        isOpen: true,
        term: {
          id: term.id,
          termId: term.termId,
          name: term.termName,
          termCode: term.termCode,
          sessionName: term.sessionName,
          portalOpenDate: term.portalOpeningDate,
          portalCloseDate: term.portalCloseDate,
          maxTenorMonths: term.maxRepaymentMonths,
          effectiveTenor,
          applicationWindows: term.applicationWindows,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async adminListUserNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
      const limit = Math.min(
        50,
        Math.max(1, parseInt(String(req.query.limit ?? 20))),
      );
      const result = await notificationService.getForUser(
        String(req.params.userId),
        page,
        limit,
      );
      successResponse(res, 200, "Notifications fetched", result);
    } catch (e) {
      next(e);
    }
  }

  async adminMarkNotificationRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const notification = await notificationService.markRead(
        String(req.params.userId),
        String(req.params.notificationId),
      );
      if (!notification) throw new ApiError(404, "Notification not found");
      successResponse(res, 200, "Notification marked as read", notification);
    } catch (e) {
      next(e);
    }
  }

  async adminMarkAllNotificationsRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await notificationService.markAllRead(
        String(req.params.userId),
      );
      successResponse(res, 200, "All notifications marked as read", result);
    } catch (e) {
      next(e);
    }
  }

  async adminReplyToNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { message } = req.body as { message: string };
      if (!message?.trim()) throw new ApiError(400, "message is required");
      const result = await notificationService.replyToNotification(
        String(req.params.userId),
        String(req.params.notificationId),
        message.trim(),
      );
      successResponse(res, 201, "Reply sent", result);
    } catch (e) {
      next(e);
    }
  }

  async getSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Settings fetched",
        await adminService.getAllSettings(),
      );
    } catch (e) {
      next(e);
    }
  }

  async getSettingsSection(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const section = String(req.params.section);
      const VALID = [
        "security",
        "database",
        "notifications",
        "platform",
        "audit",
      ];
      if (!VALID.includes(section))
        throw new ApiError(400, `Invalid section: ${section}`);
      successResponse(
        res,
        200,
        "Settings fetched",
        await adminService.getSection(section),
      );
    } catch (e) {
      next(e);
    }
  }

  async updateSettingsSection(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const section = String(req.params.section);
      const VALID = [
        "security",
        "database",
        "notifications",
        "platform",
        "audit",
      ];
      if (!VALID.includes(section))
        throw new ApiError(400, `Invalid section: ${section}`);
      const user = (req as any).user;
      const updatedBy = user?.email ?? user?.id ?? "admin";
      successResponse(
        res,
        200,
        "Settings updated",
        await adminService.upsertSection(section, req.body, updatedBy),
      );
    } catch (e) {
      next(e);
    }
  }

  async exportDatabase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const child = adminService.exportDatabase();
      const stderrChunks: Buffer[] = [];
      child.stderr!.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
      child.on("error", (err) => next(err));
      child.on("close", (code) => {
        if (code !== 0 && !res.headersSent) {
          const msg = Buffer.concat(stderrChunks).toString().trim();
          next(new ApiError(500, `pg_dump failed: ${msg || "unknown error"}`));
        }
      });
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="skulcredit.sql"',
      );
      child.stdout!.pipe(res);
    } catch (e) {
      next(e);
    }
  }

  async backupDatabase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Backup completed",
        await adminService.backupDatabase(),
      );
    } catch (e) {
      next(e);
    }
  }

  async testEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await adminService.testEmail(req.body);
      successResponse(res, 200, "Test email sent", {});
    } catch (e) {
      next(e);
    }
  }

  async exportAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { AuditLog } = await import("../models/index");
      const logs = await AuditLog.findAll({ order: [["createdAt", "DESC"]] });
      const header =
        "id,category,action,eventStatus,severity,actorId,actorRole,method,path,statusCode,ipAddress,createdAt\n";
      const rows = logs
        .map((l) =>
          [
            l.id,
            l.category,
            l.action,
            l.eventStatus,
            l.severity,
            l.actorId ?? "",
            l.actorRole,
            l.method ?? "",
            l.path ?? "",
            l.statusCode ?? "",
            l.ipAddress ?? "",
            l.createdAt?.toISOString() ?? "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="audit-logs.csv"',
      );
      res.send(header + rows);
    } catch (e) {
      next(e);
    }
  }

  async getAdminProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      successResponse(
        res,
        200,
        "Profile fetched",
        await adminService.getAdminProfile(userId),
      );
    } catch (e) {
      next(e);
    }
  }

  async updateAdminProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { fullName, phone, avatarUrl } = req.body as {
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
      };
      successResponse(
        res,
        200,
        "Profile updated",
        await adminService.updateAdminProfile(userId, {
          fullName,
          phone,
          avatarUrl,
        }),
      );
    } catch (e) {
      next(e);
    }
  }

  async updateAdminPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };
      if (!currentPassword || !newPassword)
        throw new ApiError(400, "currentPassword and newPassword are required");
      if (newPassword.length < 8)
        throw new ApiError(400, "New password must be at least 8 characters");
      await adminService.updateAdminPassword(
        userId,
        currentPassword,
        newPassword,
      );
      successResponse(res, 200, "Password updated", {});
    } catch (e) {
      next(e);
    }
  }

  async createMandate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { debitDay } = req.body as { debitDay?: number };
      // Look up the application's parent to get the userId
      const application = await LoanApplication.findByPk(id);
      if (!application) throw new ApiError(404, "Application not found");
      const parent = await ParentRepository.findOne({
        id: application.parentId,
      });
      if (!parent) throw new ApiError(404, "Parent not found");
      successResponse(
        res,
        201,
        "Mandate created",
        await parentService.createMandateForApplication(
          parent.userId,
          id,
          debitDay,
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  async activateMandate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const application = await LoanApplication.findByPk(id);
      if (!application) throw new ApiError(404, "Application not found");
      const parent = await ParentRepository.findOne({
        id: application.parentId,
      });
      if (!parent) throw new ApiError(404, "Parent not found");
      successResponse(
        res,
        200,
        "Mandate activated",
        await parentService.updateMandateStatus(parent.userId, id, "activate"),
      );
    } catch (e) {
      next(e);
    }
  }

  async deactivateMandate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const application = await LoanApplication.findByPk(id);
      if (!application) throw new ApiError(404, "Application not found");
      const parent = await ParentRepository.findOne({
        id: application.parentId,
      });
      if (!parent) throw new ApiError(404, "Parent not found");
      successResponse(
        res,
        200,
        "Mandate deactivated",
        await parentService.updateMandateStatus(
          parent.userId,
          id,
          "deactivate",
        ),
      );
    } catch (e) {
      next(e);
    }
  }

  async cancelMandate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const application = await LoanApplication.findByPk(id);
      if (!application) throw new ApiError(404, "Application not found");
      const parent = await ParentRepository.findOne({
        id: application.parentId,
      });
      if (!parent) throw new ApiError(404, "Parent not found");
      successResponse(
        res,
        200,
        "Mandate cancelled",
        await parentService.updateMandateStatus(parent.userId, id, "cancel"),
      );
    } catch (e) {
      next(e);
    }
  }

  async getApplicationMandates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const application = await LoanApplication.findByPk(id);
      if (!application) throw new ApiError(404, "Application not found");
      const parent = await ParentRepository.findOne({
        id: application.parentId,
      });
      if (!parent) throw new ApiError(404, "Parent not found");
      const user = await UserRepository.findOne({ id: parent.userId });
      if (!user) throw new ApiError(404, "User not found");
      successResponse(
        res,
        200,
        "Mandates fetched",
        await parentService.getMandatesForParent(user.id),
      );
    } catch (e) {
      next(e);
    }
  }
}
export default new AdminController();
