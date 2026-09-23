/**
 * admin.service.ts
 *
 * Business logic for every admin-facing operation.
 * Covers: dashboard stats, users, parents, schools, catalog schools, students,
 * loan applications, loan ledgers, loan offers, disbursements, repayments,
 * repayment schedules, documents, school requests, notifications, application
 * events, catalog management, school bank accounts, revenue analytics and
 * market projections.
 */

import { Op, fn, col, literal, QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import {
  ParentRepository,
  SchoolRepository,
  UserRepository,
} from "../repositories";
import {
  LoanApplication,
  LoanLedger,
  LoanOffer,
  Student,
  School,
  Parent,
  User,
  Document,
  Disbursement,
  Repayment,
  RepaymentSchedule,
  ApplicationEvent,
  SchoolRequest,
  Notification,
  CatalogSchool,
  CatalogInstitutionType,
  CatalogSchoolClassLevel,
  SchoolBankAccount,
  AcademicSession,
  AcademicTerm,
  DeviceToken,
  Term,
  FundingPartner,
} from "../models/index";
import ApiError from "../utils/apiError";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute date range from a period filter string */
function periodRange(period?: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "week":
      from.setDate(from.getDate() - 7);
      break;
    case "month":
      from.setMonth(from.getMonth() - 1);
      break;
    case "quarter":
      from.setMonth(from.getMonth() - 3);
      break;
    case "year":
      from.setFullYear(from.getFullYear() - 1);
      break;
    default:
      // all-time — use epoch
      from.setTime(0);
  }
  return { from, to };
}

// ── Service class ─────────────────────────────────────────────────────────────

class AdminService {
  // ════════════════════════════════════════════════════════════════════════════
  // DASHBOARD & ANALYTICS
  // ════════════════════════════════════════════════════════════════════════════

  async getDashboard() {
    const [
      totalParents,
      totalSchools,
      pendingSchools,
      pendingLoans,
      approvedLoans,
      disbursedLoans,
      totalApplications,
      totalRevenue,
      totalDisbursed,
    ] = await Promise.all([
      ParentRepository.count(),
      SchoolRepository.count(),
      SchoolRepository.count({ status: "under_review" }),
      LoanApplication.count({ where: { status: "pending" } }),
      LoanApplication.count({ where: { status: "approved" } }),
      LoanApplication.count({ where: { status: "disbursed" } }),
      LoanApplication.count(),
      // Revenue = sum of service charge amounts on disbursed applications
      LoanApplication.sum("serviceChargeAmount" as never, {
        where: { status: { [Op.in]: ["disbursed", "repaid"] } },
      }),
      // Total disbursed principal
      Disbursement.sum("amount" as never, {
        where: { status: "successful" },
      }),
    ]);

    return {
      stats: {
        totalParents,
        totalSchools,
        pendingSchools,
        pendingLoans,
        approvedLoans,
        disbursedLoans,
        totalApplications,
        totalRevenue: Number(totalRevenue ?? 0),
        totalDisbursed: Number(totalDisbursed ?? 0),
      },
    };
  }

  // ── Applications over time (filter by day/month/year) ────────────────────

  async getApplicationStats(
    period?: string,
    groupBy: "day" | "month" | "year" = "month",
  ) {
    const { from, to } = periodRange(period);

    const formatMap = { day: "YYYY-MM-DD", month: "YYYY-MM", year: "YYYY" };
    const fmt = formatMap[groupBy];

    const rows = await sequelize.query<{
      period: string;
      total: string;
      approved: string;
      rejected: string;
      disbursed: string;
      pending: string;
    }>(
      `SELECT
         TO_CHAR(created_at, '${fmt}')    AS period,
         COUNT(*)                          AS total,
         COUNT(*) FILTER (WHERE status = 'approved')  AS approved,
         COUNT(*) FILTER (WHERE status = 'rejected')  AS rejected,
         COUNT(*) FILTER (WHERE status = 'disbursed') AS disbursed,
         COUNT(*) FILTER (WHERE status = 'pending')   AS pending
       FROM loan_applications
       WHERE created_at >= :from AND created_at <= :to
       GROUP BY period
       ORDER BY period ASC`,
      {
        replacements: { from, to },
        type: QueryTypes.SELECT,
      },
    );

    return rows.map((r) => ({
      period: r.period,
      total: Number(r.total),
      approved: Number(r.approved),
      rejected: Number(r.rejected),
      disbursed: Number(r.disbursed),
      pending: Number(r.pending),
    }));
  }

  // ── Revenue analytics ────────────────────────────────────────────────────

  async getRevenueStats(
    period?: string,
    groupBy: "day" | "month" | "year" = "month",
  ) {
    const { from, to } = periodRange(period);

    const formatMap = { day: "YYYY-MM-DD", month: "YYYY-MM", year: "YYYY" };
    const fmt = formatMap[groupBy];

    const rows = await sequelize.query<{
      period: string;
      revenue: string;
      disbursed_amount: string;
      application_count: string;
    }>(
      `SELECT
         TO_CHAR(la.created_at, '${fmt}')          AS period,
         SUM(la.service_charge_amount)              AS revenue,
         COALESCE(SUM(d.amount), 0)                 AS disbursed_amount,
         COUNT(la.id)                               AS application_count
       FROM loan_applications la
       LEFT JOIN disbursements d
         ON d.loan_application_id = la.id AND d.status = 'successful'
       WHERE la.status IN ('disbursed', 'repaid')
         AND la.created_at >= :from AND la.created_at <= :to
       GROUP BY period
       ORDER BY period ASC`,
      {
        replacements: { from, to },
        type: QueryTypes.SELECT,
      },
    );

    return rows.map((r) => ({
      period: r.period,
      revenue: Number(r.revenue ?? 0),
      disbursedAmount: Number(r.disbursed_amount ?? 0),
      applicationCount: Number(r.application_count),
    }));
  }

  // ── Market projection ────────────────────────────────────────────────────

  async getMarketProjection() {
    const [
      registeredSchools,
      nonRegisteredSchools,
      totalStudents,
      totalLoansValue,
      avgLoanAmount,
      schoolRequestsPending,
    ] = await Promise.all([
      CatalogSchool.count({ where: { isRegistered: true, isActive: true } }),
      CatalogSchool.count({ where: { isRegistered: false, isActive: true } }),
      Student.count(),
      LoanApplication.sum("amountRequested" as never, {
        where: { status: { [Op.in]: ["approved", "disbursed", "repaid"] } },
      }),
      LoanApplication.findOne({
        attributes: [[fn("AVG", col("amount_requested")), "avg"]],
        where: { status: { [Op.in]: ["approved", "disbursed", "repaid"] } },
        raw: true,
      }),
      SchoolRequest.count({
        where: { status: { [Op.in]: ["pending", "in_progress"] } },
      }),
    ]);

    // Potential reach: if all non-registered schools converted with avg 50 students each
    const potentialStudents = nonRegisteredSchools * 50;
    const avgAmount = Number(
      (avgLoanAmount as { avg?: string } | null)?.avg ?? 0,
    );
    const potentialRevenue = potentialStudents * avgAmount * 0.235; // non-registered rate

    return {
      current: {
        registeredSchools,
        nonRegisteredSchools,
        totalStudents,
        totalLoansValue: Number(totalLoansValue ?? 0),
      },
      projection: {
        potentialNewStudents: potentialStudents,
        potentialNewRevenue: potentialRevenue,
        pendingSchoolRequests: schoolRequestsPending,
      },
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // USERS
  // ════════════════════════════════════════════════════════════════════════════

  async listUsers(role?: string, search?: string) {
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.email = { [Op.iLike]: `%${search}%` };
    }
    return User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
  }

  async getUser(id: string) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  async toggleUserActive(id: string, isActive: boolean) {
    const user = await User.findByPk(id);
    if (!user) throw new ApiError(404, "User not found");
    return user.update({ isActive });
  }

  async resetUserEmail(id: string, email: string) {
    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== id)
      throw new ApiError(409, "Email already in use");
    const user = await User.findByPk(id);
    if (!user) throw new ApiError(404, "User not found");
    return user.update({ email, isEmailVerified: false });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PARENTS
  // ════════════════════════════════════════════════════════════════════════════

  async listParents(search?: string, kycStatus?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (kycStatus) where.kycStatus = kycStatus;

    const include = [
      {
        model: User,
        as: "user",
        attributes: [
          "email",
          "phoneNumber",
          "isActive",
          "isEmailVerified",
          "createdAt",
        ],
        ...(search ? { where: { email: { [Op.iLike]: `%${search}%` } } } : {}),
      },
    ];

    const { count, rows } = await Parent.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getParent(id: string) {
    const parent = await Parent.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
        { model: Student, as: "students" },
        {
          model: LoanApplication,
          as: "loanApplications",
          include: [
            {
              model: CatalogSchool,
              as: "catalogSchool",
              attributes: ["id", "name"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
        { model: Document, as: "documents" },
      ],
    } as never);
    if (!parent) throw new ApiError(404, "Parent not found");
    return parent;
  }

  async updateParentKyc(id: string, kycStatus: string, adminNote?: string) {
    const parent = await Parent.findByPk(id);
    if (!parent) throw new ApiError(404, "Parent not found");
    const allowed = ["pending", "submitted", "approved", "rejected"];
    if (!allowed.includes(kycStatus)) {
      throw new ApiError(
        400,
        `kycStatus must be one of: ${allowed.join(", ")}`,
      );
    }
    return parent.update({ kycStatus: kycStatus as never });
  }

  async getParents() {
    return ParentRepository.find(
      {},
      {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email", "phoneNumber", "isActive"],
          },
        ],
      },
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PARTNER SCHOOLS (registered school accounts)
  // ════════════════════════════════════════════════════════════════════════════

  async getSchools(status?: string) {
    const where = status ? { status } : {};
    return SchoolRepository.find(where, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "phoneNumber", "isActive"],
        },
      ],
    });
  }

  async getSchool(id: string) {
    const school = await School.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
        {
          model: LoanApplication,
          as: "loanApplications",
          order: [["createdAt", "DESC"]],
          limit: 20,
        },
        { model: Term, as: "terms" },
      ],
    } as never);
    if (!school) throw new ApiError(404, "School not found");
    return school;
  }

  async approveSchool(schoolId: string) {
    const school = await SchoolRepository.findById(schoolId);
    if (!school) throw new ApiError(404, "School not found");
    return school.update({ status: "approved" });
  }

  async rejectSchool(schoolId: string) {
    const school = await SchoolRepository.findById(schoolId);
    if (!school) throw new ApiError(404, "School not found");
    return school.update({ status: "rejected" });
  }

  async updateSchoolStatus(id: string, status: string, adminNote?: string) {
    const allowed = ["pending", "under_review", "approved", "rejected"];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
    }
    const school = await SchoolRepository.findById(id);
    if (!school) throw new ApiError(404, "School not found");
    return school.update({ status: status as never });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CATALOG SCHOOLS (browsable school directory)
  // ════════════════════════════════════════════════════════════════════════════

  async listCatalogSchools(search?: string, isRegistered?: boolean) {
    const where: Record<string, unknown> = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (isRegistered !== undefined) where.isRegistered = isRegistered;

    return CatalogSchool.findAll({
      where,
      include: [{ model: SchoolBankAccount, as: "bankAccounts" }],
      order: [["name", "ASC"]],
    } as never);
  }

  async getCatalogSchool(id: string) {
    const school = await CatalogSchool.findByPk(id, {
      include: [
        { model: SchoolBankAccount, as: "bankAccounts" },
        {
          model: CatalogSchoolClassLevel,
          as: "classLevels",
          include: [
            {
              model: CatalogInstitutionType,
              as: "institutionType",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    } as never);
    if (!school) throw new ApiError(404, "Catalog school not found");
    return school;
  }

  async updateCatalogSchool(
    id: string,
    payload: {
      name?: string;
      tier?: string | null;
      isRegistered?: boolean;
      serviceChargeRate?: number;
      isActive?: boolean;
    },
  ) {
    const school = await CatalogSchool.findByPk(id);
    if (!school) throw new ApiError(404, "Catalog school not found");
    return school.update(payload as never);
  }

  // ── Class levels ─────────────────────────────────────────────────────────

  async listClassLevels(schoolId?: string, institutionTypeId?: string) {
    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;
    if (institutionTypeId) where.institutionTypeId = institutionTypeId;

    return CatalogSchoolClassLevel.findAll({
      where,
      include: [
        { model: CatalogSchool, as: "school", attributes: ["id", "name"] },
        {
          model: CatalogInstitutionType,
          as: "institutionType",
          attributes: ["id", "name"],
        },
      ],
      order: [["sortOrder", "ASC"]],
    } as never);
  }

  async createClassLevel(payload: {
    schoolId: string;
    institutionTypeId: string;
    subLevelGroup?: string | null;
    className: string;
    sortOrder?: number;
  }) {
    return CatalogSchoolClassLevel.create(payload as never);
  }

  async updateClassLevel(
    id: string,
    payload: {
      subLevelGroup?: string | null;
      className?: string;
      sortOrder?: number;
    },
  ) {
    const level = await CatalogSchoolClassLevel.findByPk(id);
    if (!level) throw new ApiError(404, "Class level not found");
    return level.update(payload as never);
  }

  async deleteClassLevel(id: string) {
    const level = await CatalogSchoolClassLevel.findByPk(id);
    if (!level) throw new ApiError(404, "Class level not found");
    await level.destroy();
  }

  // ── Institution types ─────────────────────────────────────────────────────

  async listInstitutionTypes() {
    return CatalogInstitutionType.findAll({ order: [["sortOrder", "ASC"]] });
  }

  async createInstitutionType(payload: { name: string; sortOrder?: number }) {
    return CatalogInstitutionType.create(payload as never);
  }

  async updateInstitutionType(
    id: string,
    payload: { name?: string; sortOrder?: number },
  ) {
    const type = await CatalogInstitutionType.findByPk(id);
    if (!type) throw new ApiError(404, "Institution type not found");
    return type.update(payload);
  }

  async deleteInstitutionType(id: string) {
    const type = await CatalogInstitutionType.findByPk(id);
    if (!type) throw new ApiError(404, "Institution type not found");
    await type.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STUDENTS
  // ════════════════════════════════════════════════════════════════════════════

  async listStudents(
    parentId?: string,
    schoolId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: Record<string, unknown> = {};
    if (parentId) where.parentId = parentId;
    if (schoolId) where.schoolId = schoolId;

    const { count, rows } = await Student.findAndCountAll({
      where,
      include: [
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: CatalogSchool, as: "school", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getStudent(id: string) {
    const student = await Student.findByPk(id, {
      include: [
        { model: Parent, as: "parent" },
        { model: CatalogSchool, as: "school" },
        {
          model: LoanApplication,
          as: "loanApplications",
          order: [["createdAt", "DESC"]],
        },
      ],
    } as never);
    if (!student) throw new ApiError(404, "Student not found");
    return student;
  }

  async updateStudent(
    id: string,
    payload: {
      firstName?: string;
      lastName?: string;
      studentId?: string;
      gradeLevel?: string;
      tuitionAmount?: number;
    },
  ) {
    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");
    return student.update(payload);
  }

  async deleteStudent(id: string) {
    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");
    // Guard — cannot delete if active loan exists
    const activeApp = await LoanApplication.findOne({
      where: {
        studentId: id,
        status: { [Op.notIn]: ["rejected", "cancelled", "repaid"] },
      },
    });
    if (activeApp) {
      throw new ApiError(
        400,
        "Cannot delete student with an active loan application",
      );
    }
    await student.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOAN APPLICATIONS
  // ════════════════════════════════════════════════════════════════════════════

  async getLoanApplications(filters?: {
    status?: string;
    parentId?: string;
    studentId?: string;
    catalogSchoolId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    const { status, parentId, studentId, catalogSchoolId, fromDate, toDate } =
      filters ?? {};

    if (status) where.status = status;
    if (parentId) where.parentId = parentId;
    if (studentId) where.studentId = studentId;
    if (catalogSchoolId) where.catalogSchoolId = catalogSchoolId;

    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range[Op.gte as never] = new Date(fromDate);
      if (toDate) range[Op.lte as never] = new Date(toDate + "T23:59:59");
      where.createdAt = range;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const { count, rows } = await LoanApplication.findAndCountAll({
      where,
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "firstName", "lastName", "gradeLevel"],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name", "tier", "isRegistered"],
        },
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getLoanApplication(id: string) {
    const app = await LoanApplication.findByPk(id, {
      include: [
        { model: Student, as: "student" },
        { model: CatalogSchool, as: "catalogSchool" },
        {
          model: Parent,
          as: "parent",
          include: [
            { model: User, as: "user", attributes: ["email", "phoneNumber"] },
          ],
        },
        {
          model: ApplicationEvent,
          as: "events",
          order: [["createdAt", "ASC"]],
        },
        { model: LoanLedger, as: "ledger" },
        { model: LoanOffer, as: "offer" },
        { model: Disbursement, as: "disbursement" },
        {
          model: RepaymentSchedule,
          as: "schedule",
          order: [["installmentNumber", "ASC"]],
        },
        { model: Repayment, as: "repayments", order: [["createdAt", "DESC"]] },
      ],
    } as never);
    if (!app) throw new ApiError(404, "Loan application not found");
    return app;
  }

  async updateApplicationStatus(
    id: string,
    status: string,
    options?: {
      rejectionReason?: string;
      adminNote?: string;
      decidedBy?: string;
    },
  ) {
    const allowed = [
      "pending",
      "under_review",
      "info_requested",
      "school_verification",
      "approved",
      "rejected",
      "disbursed",
      "repaid",
      "cancelled",
    ];
    if (!allowed.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status. Must be one of: ${allowed.join(", ")}`,
      );
    }

    const app = await LoanApplication.findByPk(id);
    if (!app) throw new ApiError(404, "Loan application not found");

    await app.update({
      status: status as never,
      ...(options?.rejectionReason
        ? { rejectionReason: options.rejectionReason }
        : {}),
      ...(options?.adminNote ? { adminNote: options.adminNote } : {}),
      ...(options?.decidedBy
        ? { decidedBy: options.decidedBy, decidedAt: new Date() }
        : {}),
    });

    // Record event
    await ApplicationEvent.create({
      loanApplicationId: id,
      actor: "admin",
      actorId: options?.decidedBy ?? null,
      status,
      note: options?.adminNote ?? null,
    } as never);

    return app;
  }

  async updateApplicationNote(id: string, adminNote: string) {
    const app = await LoanApplication.findByPk(id);
    if (!app) throw new ApiError(404, "Loan application not found");
    return app.update({ adminNote });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOAN LEDGERS
  // ════════════════════════════════════════════════════════════════════════════

  async getLoanLedger(loanApplicationId: string) {
    const ledger = await LoanLedger.findOne({
      where: { loanApplicationId },
    });
    if (!ledger) throw new ApiError(404, "Loan ledger not found");
    return ledger;
  }

  async listLoanLedgers(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const { count, rows } = await LoanLedger.findAndCountAll({
      where,
      include: [
        {
          model: LoanApplication,
          as: "loanApplication",
          attributes: ["id", "referenceNumber", "status", "amountRequested"],
          include: [
            {
              model: Parent,
              as: "parent",
              attributes: ["id", "firstName", "lastName"],
            },
          ] as never[],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);
    return { total: count, page, limit, data: rows };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOAN OFFERS
  // ════════════════════════════════════════════════════════════════════════════

  async getLoanOffer(loanApplicationId: string) {
    const offer = await LoanOffer.findOne({ where: { loanApplicationId } });
    if (!offer) throw new ApiError(404, "Loan offer not found");
    return offer;
  }

  async listLoanOffers(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const { count, rows } = await LoanOffer.findAndCountAll({
      where,
      include: [
        {
          model: LoanApplication,
          as: "application",
          attributes: ["id", "referenceNumber", "amountRequested", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);
    return { total: count, page, limit, data: rows };
  }

  async updateLoanOfferStatus(id: string, status: string) {
    const allowed = ["pending", "accepted", "declined", "expired"];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
    }
    const offer = await LoanOffer.findByPk(id);
    if (!offer) throw new ApiError(404, "Loan offer not found");
    const update: Record<string, unknown> = { status };
    if (status === "accepted") update.acceptedAt = new Date();
    if (status === "declined") update.declinedAt = new Date();
    return offer.update(update as never);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DISBURSEMENTS
  // ════════════════════════════════════════════════════════════════════════════

  async listDisbursements(filters?: {
    status?: string;
    schoolId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.schoolId) where.schoolId = filters.schoolId;

    if (filters?.fromDate || filters?.toDate) {
      const range: Record<string, Date> = {};
      if (filters.fromDate) range[Op.gte as never] = new Date(filters.fromDate);
      if (filters.toDate)
        range[Op.lte as never] = new Date(filters.toDate + "T23:59:59");
      where.createdAt = range;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const { count, rows } = await Disbursement.findAndCountAll({
      where,
      include: [
        {
          model: LoanApplication,
          as: "loanApplication",
          attributes: ["id", "referenceNumber", "amountRequested"],
          include: [
            {
              model: Student,
              as: "student",
              attributes: ["id", "firstName", "lastName"],
            },
          ] as never[],
        },
        { model: School, as: "school", attributes: ["id", "schoolName"] },
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getDisbursement(id: string) {
    const d = await Disbursement.findByPk(id, {
      include: [
        { model: LoanApplication, as: "loanApplication" },
        { model: School, as: "school" },
        { model: Parent, as: "parent" },
      ],
    } as never);
    if (!d) throw new ApiError(404, "Disbursement not found");
    return d;
  }

  async updateDisbursementStatus(
    id: string,
    status: string,
    extras?: {
      paystackTransferCode?: string;
      paystackTransferId?: string;
      paystackReference?: string;
      failureReason?: string;
      notes?: string;
    },
  ) {
    const allowed = [
      "pending",
      "processing",
      "successful",
      "failed",
      "reversed",
    ];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
    }
    const d = await Disbursement.findByPk(id);
    if (!d) throw new ApiError(404, "Disbursement not found");
    await d.update({ status: status as never, ...extras } as never);
    return d;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REPAYMENTS
  // ════════════════════════════════════════════════════════════════════════════

  async listRepayments(filters?: {
    loanApplicationId?: string;
    parentId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters?.loanApplicationId)
      where.loanApplicationId = filters.loanApplicationId;
    if (filters?.parentId) where.parentId = filters.parentId;
    if (filters?.status) where.status = filters.status;

    if (filters?.fromDate || filters?.toDate) {
      const range: Record<string, Date> = {};
      if (filters.fromDate) range[Op.gte as never] = new Date(filters.fromDate);
      if (filters.toDate)
        range[Op.lte as never] = new Date(filters.toDate + "T23:59:59");
      where.createdAt = range;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const { count, rows } = await Repayment.findAndCountAll({
      where,
      include: [
        {
          model: LoanApplication,
          as: "loanApplication",
          attributes: ["id", "referenceNumber"],
        },
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getRepayment(id: string) {
    const r = await Repayment.findByPk(id, {
      include: [
        { model: LoanApplication, as: "loanApplication" },
        { model: Parent, as: "parent" },
        { model: RepaymentSchedule, as: "installment" },
      ],
    } as never);
    if (!r) throw new ApiError(404, "Repayment not found");
    return r;
  }

  async recordManualRepayment(payload: {
    loanApplicationId: string;
    parentId: string;
    amount: number;
    paymentMethod: string;
    type: string;
    paidAt?: string;
    notes?: string;
    recordedBy?: string;
    receiptNumber?: string;
  }) {
    return Repayment.create({
      ...payload,
      currency: "NGN",
      status: "successful",
      paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
    } as never);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REPAYMENT SCHEDULES
  // ════════════════════════════════════════════════════════════════════════════

  async getRepaymentSchedule(loanApplicationId: string) {
    const schedule = await RepaymentSchedule.findAll({
      where: { loanApplicationId },
      order: [["installmentNumber", "ASC"]],
    });
    if (!schedule.length)
      throw new ApiError(404, "Repayment schedule not found");
    return schedule;
  }

  async updateScheduleInstallment(
    id: string,
    payload: {
      status?: string;
      amountPaid?: number;
      paidAt?: string;
      lateFeeApplied?: boolean;
    },
  ) {
    const item = await RepaymentSchedule.findByPk(id);
    if (!item) throw new ApiError(404, "Schedule installment not found");
    return item.update({
      ...payload,
      ...(payload.paidAt ? { paidAt: new Date(payload.paidAt) } : {}),
    } as never);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DOCUMENTS (KYC)
  // ════════════════════════════════════════════════════════════════════════════

  async listDocuments(
    parentId?: string,
    category?: string,
    page = 1,
    limit = 20,
  ) {
    const where: Record<string, unknown> = {};
    if (parentId) where.parentId = parentId;
    if (category) where.category = category;

    const { count, rows } = await Document.findAndCountAll({
      where,
      include: [
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getDocument(id: string) {
    const doc = await Document.findByPk(id, {
      include: [{ model: Parent, as: "parent" }],
    } as never);
    if (!doc) throw new ApiError(404, "Document not found");
    return doc;
  }

  async deleteDocument(id: string) {
    const doc = await Document.findByPk(id);
    if (!doc) throw new ApiError(404, "Document not found");
    await doc.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCHOOL REQUESTS (parent-submitted requests to onboard unregistered schools)
  // ════════════════════════════════════════════════════════════════════════════

  async listSchoolRequests(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : {};

    const { count, rows } = await SchoolRequest.findAndCountAll({
      where,
      include: [
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async getSchoolRequest(id: string) {
    const req = await SchoolRequest.findByPk(id, {
      include: [{ model: Parent, as: "parent" }],
    } as never);
    if (!req) throw new ApiError(404, "School request not found");
    return req;
  }

  async updateSchoolRequestStatus(
    id: string,
    status: string,
    adminNote?: string,
  ) {
    const allowed = ["pending", "in_progress", "onboarded", "rejected"];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
    }
    const req = await SchoolRequest.findByPk(id);
    if (!req) throw new ApiError(404, "School request not found");
    return req.update({
      status: status as never,
      ...(adminNote ? { adminNote } : {}),
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // APPLICATION EVENTS (audit log)
  // ════════════════════════════════════════════════════════════════════════════

  async listApplicationEvents(loanApplicationId: string) {
    return ApplicationEvent.findAll({
      where: { loanApplicationId },
      order: [["createdAt", "ASC"]],
    });
  }

  async createApplicationEvent(payload: {
    loanApplicationId: string;
    actor: string;
    actorId?: string;
    status: string;
    note?: string;
  }) {
    return ApplicationEvent.create(payload as never);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════

  async listNotifications(
    userId?: string,
    isRead?: boolean,
    page = 1,
    limit = 20,
  ) {
    const where: Record<string, unknown> = {};
    if (userId !== undefined) where.userId = userId;
    if (isRead !== undefined) where.isRead = isRead;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "email"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    } as never);

    return { total: count, page, limit, data: rows };
  }

  async broadcastNotification(payload: {
    userIds?: string[]; // specific users; if empty → broadcast to all parents
    role?: "parent" | "school";
    title: string;
    message: string;
    type: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    let userIds = payload.userIds ?? [];

    if (!userIds.length) {
      // Fetch all users of the given role (or all if no role)
      const where = payload.role
        ? { role: payload.role, isActive: true }
        : { isActive: true };
      const users = await User.findAll({
        where: where as never,
        attributes: ["id"],
      });
      userIds = users.map((u) => u.id);
    }

    const notifications = userIds.map((userId) => ({
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      referenceId: payload.referenceId ?? null,
      referenceType: payload.referenceType ?? null,
      isRead: false,
    }));

    await Notification.bulkCreate(notifications as never);
    return { sent: userIds.length };
  }

  async deleteNotification(id: string) {
    const n = await Notification.findByPk(id);
    if (!n) throw new ApiError(404, "Notification not found");
    await n.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DEVICE TOKENS (push notifications)
  // ════════════════════════════════════════════════════════════════════════════

  async listDeviceTokens(userId?: string) {
    const where = userId ? { userId } : {};
    return DeviceToken.findAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "email"] }],
    } as never);
  }

  async deleteDeviceToken(id: string) {
    const token = await DeviceToken.findByPk(id);
    if (!token) throw new ApiError(404, "Device token not found");
    await token.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCHOOL TERMS (legacy per-school terms)
  // ════════════════════════════════════════════════════════════════════════════

  async listSchoolTerms(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};
    return Term.findAll({
      where,
      include: [
        { model: School, as: "school", attributes: ["id", "schoolName"] },
      ],
      order: [
        ["academicSession", "DESC"],
        ["name", "ASC"],
      ],
    } as never);
  }

  async getSchoolTerm(id: string) {
    const t = await Term.findByPk(id, {
      include: [{ model: School, as: "school" }],
    } as never);
    if (!t) throw new ApiError(404, "School term not found");
    return t;
  }

  async deleteSchoolTerm(id: string) {
    const t = await Term.findByPk(id);
    if (!t) throw new ApiError(404, "School term not found");
    await t.destroy();
  }

  async listFundingPartners(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    return FundingPartner.findAll({ where, order: [["name", "ASC"]] });
  }

  async getFundingPartner(id: string) {
    const fp = await FundingPartner.findByPk(id);
    if (!fp) throw new ApiError(404, "Funding partner not found");
    return fp;
  }

  async createFundingPartner(payload: {
    name: string;
    email: string;
    phone?: string | null;
    contactPerson?: string | null;
    status?: "active" | "inactive";
    notes?: string | null;
  }) {
    const existing = await FundingPartner.findOne({
      where: { email: payload.email },
    });
    if (existing)
      throw new ApiError(
        409,
        "A funding partner with this email already exists",
      );
    return FundingPartner.create(payload as never);
  }

  async updateFundingPartner(
    id: string,
    payload: {
      name?: string;
      email?: string;
      phone?: string | null;
      contactPerson?: string | null;
      status?: "active" | "inactive";
      notes?: string | null;
    },
  ) {
    const fp = await FundingPartner.findByPk(id);
    if (!fp) throw new ApiError(404, "Funding partner not found");
    if (payload.email && payload.email !== fp.email) {
      const conflict = await FundingPartner.findOne({
        where: { email: payload.email },
      });
      if (conflict)
        throw new ApiError(409, "Email is already in use by another partner");
    }
    return fp.update(payload as never);
  }

  async deleteFundingPartner(id: string) {
    const fp = await FundingPartner.findByPk(id);
    if (!fp) throw new ApiError(404, "Funding partner not found");
    await fp.destroy();
  }
}

export default new AdminService();
