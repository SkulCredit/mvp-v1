import { Op, fn, col, literal, QueryTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sequelize } from "../config/db";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";
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
  FundingPartnerContact,
  AdminProfile,
  SystemSetting,
  SchoolVerificationLink,
} from "../models/index";
import ApiError from "../utils/apiError";
import emailService from "../emails/email.service";
import { formatNaira, formatTenorLabel } from "../utils/format";
import env from "../config/env";
import ledgerService from "./ledger.service";
import logger from "../config/logger";
import eventNotifier from "../notifications/event.notifier";

const DEFAULT_SETTINGS: Record<string, unknown> = {
  security: {
    twoFa: true,
    twoFaMethod: "totp",
    jwtExpiry: "24",
    refreshExpiry: "30",
    sessionTimeout: "60",
    maxAttempts: "5",
    lockout: "15",
    minPwLen: "8",
    reqUpper: true,
    reqNum: true,
    reqSym: true,
    ipWhitelist: false,
    ipList: "",
    forcedRoles: ["super_admin", "admin"],
  },
  database: {
    backupEnabled: true,
    backupSchedule: "daily",
    backupTime: "02:00",
    backupRetention: "30",
    backupDest: "s3",
    s3Bucket: "skulcredit-backups",
  },
  notifications: {
    emailNotifs: true,
    smsNotifs: false,
    inAppNotifs: true,
    alertApp: true,
    alertDisb: true,
    alertRepay: true,
    alertKyc: true,
    alertLogin: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "noreply@skulcredit.com",
    smtpFrom: "SkulCredit",
  },
  platform: {
    maintenance: false,
    maintMsg: "We are performing scheduled maintenance.",
    newAppsOn: true,
    disbOn: true,
    platformName: "SkulCredit",
    brand: "#7A0E42",
    supportEmail: "support@skulcredit.com",
    supportPhone: "+234 800 000 0000",
    maxLoan: "5000000",
    defCharge: "23.5",
  },
  audit: {
    auditRetention: "365",
    logAdmin: true,
    logApi: false,
    logExports: true,
  },
};

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
      from.setTime(0);
  }
  return { from, to };
}

class AdminService {
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
      LoanApplication.sum("serviceChargeAmount" as never, {
        where: { status: { [Op.in]: ["disbursed", "repaid"] } },
      }),
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

    const potentialStudents = nonRegisteredSchools * 50;
    const avgAmount = Number(
      (avgLoanAmount as { avg?: string } | null)?.avg ?? 0,
    );
    const potentialRevenue = potentialStudents * avgAmount * 0.235;

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

  async listUsers(role?: string, search?: string) {
    const STAFF_ROLES = [
      "admin",
      "customer_service",
      "customer_service_manager",
      "risk_management",
      "accountant",
    ];
    const where: Record<string, unknown> = {
      role: role ? role : { [Op.in]: STAFF_ROLES },
    };
    if (search) {
      where.email = { [Op.iLike]: `%${search}%` };
    }
    return User.findAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
          attributes: ["fullName", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async getUser(id: string) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: AdminProfile,
          as: "adminProfile",
          attributes: ["fullName", "phone"],
        },
      ],
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

  async updateStaffUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      role?: string;
    },
  ) {
    const user = await User.findByPk(id);
    if (!user) throw new ApiError(404, "User not found");

    const STAFF_ROLES = [
      "admin",
      "customer_service",
      "customer_service_manager",
      "risk_management",
      "accountant",
    ];

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) throw new ApiError(409, "Email already in use");
      await user.update({ email: data.email });
    }

    if (data.phoneNumber !== undefined) {
      await user.update({ phoneNumber: data.phoneNumber });
    }

    if (data.role && STAFF_ROLES.includes(data.role)) {
      await user.update({
        role: data.role as
          | "admin"
          | "customer_service"
          | "customer_service_manager"
          | "risk_management"
          | "accountant",
      });
    }

    const fullName =
      [data.firstName, data.lastName].filter(Boolean).join(" ") || null;
    if (
      fullName !== null ||
      data.firstName !== undefined ||
      data.lastName !== undefined
    ) {
      await AdminProfile.upsert({
        userId: id,
        fullName,
        phone: data.phoneNumber ?? null,
      } as never);
    }

    return this.getUser(id);
  }

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
        {
          model: Student,
          as: "students",
          include: [
            {
              model: CatalogSchool,
              as: "school",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: LoanApplication,
          as: "loanApplications",
          include: [
            {
              model: CatalogSchool,
              as: "catalogSchool",
              attributes: ["id", "name"],
            },
            {
              model: Student,
              as: "student",
              attributes: ["id", "firstName", "lastName", "studentId"],
            },
          ],
        },
        { model: Document, as: "documents" },
      ],
      order: [
        [
          { model: LoanApplication, as: "loanApplications" },
          "createdAt",
          "DESC",
        ],
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

  async createSchoolLoginAccess(
    id: string,
  ): Promise<{ email: string; password: string; schoolName: string }> {
    const school = await School.findByPk(id, {
      include: [{ model: User, as: "user", attributes: { exclude: [] } }],
    } as never);
    if (!school) throw new ApiError(404, "School not found");

    const schoolWithUser = school as typeof school & {
      user: typeof User.prototype;
    };
    const user = schoolWithUser.user;
    if (!user) throw new ApiError(400, "School has no associated user account");

    const charset =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    const hashed = await bcrypt.hash(password, 10);

    await user.update({ password: hashed, isActive: true });

    return {
      email: user.email,
      password,
      schoolName: school.schoolName,
    };
  }

  async updateSchool(
    id: string,
    payload: {
      schoolName?: string;
      contactPerson?: string;
      website?: string;
      population?: string;
      addressStreet?: string;
      addressCity?: string;
      addressState?: string;
      addressCountry?: string;
      bankName?: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      logoUrl?: string;
      status?: string;
      email?: string;
      phoneNumber?: string;
    },
  ) {
    const school = await SchoolRepository.findById(id);
    if (!school) throw new ApiError(404, "School not found");

    const { email, phoneNumber, ...schoolFields } = payload;

    const schoolUpdate: Record<string, unknown> = {};
    const allowedStatuses = ["pending", "under_review", "approved", "rejected"];

    for (const [k, v] of Object.entries(schoolFields)) {
      if (v === undefined || v === "") continue;
      if (k === "status") {
        if (!allowedStatuses.includes(v as string)) {
          throw new ApiError(
            400,
            `status must be one of: ${allowedStatuses.join(", ")}`,
          );
        }
      }
      schoolUpdate[k] = v;
    }

    if (Object.keys(schoolUpdate).length)
      await school.update(schoolUpdate as never);

    if ((email || phoneNumber) && school.userId) {
      const user = await User.findByPk(school.userId);
      if (user) {
        const userUpdate: Record<string, string> = {};
        if (email) userUpdate.email = email;
        if (phoneNumber) userUpdate.phoneNumber = phoneNumber;
        await user.update(userUpdate);
      }
    }

    return SchoolRepository.findById(id);
  }

  async createSchool(payload: {
    schoolName: string;
    contactPerson: string;
    email: string;
    password: string;
    phoneNumber: string;
    website?: string;
    population?: string;
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressCountry?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    logoUrl?: string;
  }) {
    const existing = await User.findOne({ where: { email: payload.email } });
    if (existing) throw new ApiError(400, "Email already in use");

    const hashed = await bcrypt.hash(payload.password, 10);

    const user = await User.create({
      email: payload.email,
      password: hashed,
      phoneNumber: payload.phoneNumber,
      role: "school",
      isActive: true,
      isEmailVerified: true,
    } as never);

    const school = await School.create({
      userId: user.id,
      schoolName: payload.schoolName,
      contactPerson: payload.contactPerson,
      website: payload.website ?? null,
      population: payload.population ?? null,
      addressStreet: payload.addressStreet ?? null,
      addressCity: payload.addressCity ?? null,
      addressState: payload.addressState ?? null,
      addressCountry: payload.addressCountry ?? "Nigeria",
      bankName: payload.bankName ?? null,
      bankAccountName: payload.bankAccountName ?? null,
      bankAccountNumber: payload.bankAccountNumber ?? null,
      logoUrl: payload.logoUrl ?? null,
      status: "pending",
    } as never);

    return school;
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

  async getLoanApplications(filters?: {
    status?: string;
    parentId?: string;
    studentId?: string;
    catalogSchoolId?: string;
    isUnknownSchool?: boolean;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    const {
      status,
      parentId,
      studentId,
      catalogSchoolId,
      isUnknownSchool,
      fromDate,
      toDate,
    } = filters ?? {};

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

    const catalogSchoolWhere: Record<string, unknown> = {};
    if (isUnknownSchool === true) catalogSchoolWhere.isRegistered = false;

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
          where: Object.keys(catalogSchoolWhere).length
            ? catalogSchoolWhere
            : undefined,
          required: isUnknownSchool === true,
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

    const appAny = app as any;
    const isUnknownSchool =
      appAny.catalogSchool && !appAny.catalogSchool.isRegistered;
    let schoolRequest = null;
    if (isUnknownSchool) {
      schoolRequest = await SchoolRequest.findOne({
        where: {
          parentId: app.parentId,
          schoolName: appAny.catalogSchool.name,
        },
        order: [["createdAt", "DESC"]],
        attributes: [
          "id",
          "schoolName",
          "schoolAddress",
          "schoolCity",
          "schoolState",
          "contactPerson",
          "contactPhone",
          "contactEmail",
          "additionalNotes",
        ],
      } as never);
    }

    return { ...appAny.toJSON(), schoolRequest, isUnknownSchool };
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

  async listDisbursementRequests(
    statusFilter: string,
    page: number,
    limit: number,
  ) {
    const disbursableStatuses = [
      "approved",
      "disbursed",
      "repaid",
      "cancelled",
    ];
    let where: Record<string, unknown>;
    if (statusFilter === "all") {
      where = { status: { [Op.in]: disbursableStatuses } };
    } else if (statusFilter === "pending") {
      where = { status: { [Op.in]: ["approved"] } };
    } else if (statusFilter === "completed") {
      where = { status: { [Op.in]: ["disbursed", "repaid"] } };
    } else {
      where = { status: statusFilter };
    }

    const { count, rows } = await LoanApplication.findAndCountAll({
      where,
      include: [
        {
          model: Parent,
          as: "parent",
          attributes: ["id", "firstName", "lastName"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["email"],
            },
          ] as never[],
        },
        {
          model: Student,
          as: "student",
          attributes: ["id", "firstName", "lastName", "gradeLevel"],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name"],
          include: [
            {
              model: SchoolBankAccount,
              as: "bankAccounts",
            },
          ] as never[],
        },
        {
          model: Disbursement,
          as: "disbursement",
          required: false,
        },
        {
          model: School,
          as: "school",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    } as never);

    const allPartnerIds = new Set<string>();
    for (const row of rows) {
      const d = (row as never as { disbursement?: { initiatedBy?: string } })
        .disbursement;
      if (d?.initiatedBy) allPartnerIds.add(d.initiatedBy);
    }

    const partnerMap: Record<string, string> = {};
    if (allPartnerIds.size > 0) {
      const partners = await FundingPartner.findAll({
        where: { id: { [Op.in]: Array.from(allPartnerIds) } },
        attributes: ["id", "name"],
      });
      for (const p of partners) {
        partnerMap[p.id] = p.name;
      }
    }

    const applications = rows.map((row) => {
      const r = row as never as {
        id: string;
        referenceNumber: string | null;
        status: string;
        disbursementStatus: string;
        amountApproved: number | null;
        amountRequested: number;
        serviceFeePaid: boolean;
        mandateStatus: string;
        rejectionReason: string | null;
        decidedAt: Date | null;
        createdAt: Date;
        parent?: {
          firstName: string;
          lastName: string;
          user?: { email: string };
        };
        student?: {
          firstName: string;
          lastName: string;
          gradeLevel: string;
        };
        catalogSchool?: {
          name: string;
          bankAccounts?: {
            bankName: string;
            accountName: string;
            accountNumber: string;
            isPrimary: boolean;
          }[];
        };
        disbursement?: {
          status: string;
          initiatedBy: string | null;
          disbursedAt: Date | null;
          failureReason: string | null;
        };
        school?: {
          bankName?: string | null;
          bankAccountName?: string | null;
          bankAccountNumber?: string | null;
        };
      };

      const primaryBank =
        r.catalogSchool?.bankAccounts?.find((b) => b.isPrimary) ??
        r.catalogSchool?.bankAccounts?.[0] ??
        null;

      const schoolRec = r.school;
      const bankDetails = primaryBank
        ? {
            bankName: primaryBank.bankName,
            accountName: primaryBank.accountName,
            accountNumber: primaryBank.accountNumber,
          }
        : schoolRec?.bankName && schoolRec?.bankAccountNumber
          ? {
              bankName: schoolRec.bankName,
              accountName: schoolRec.bankAccountName ?? "",
              accountNumber: schoolRec.bankAccountNumber,
            }
          : null;

      return {
        id: r.id,
        referenceNumber: r.referenceNumber,
        status: r.status,
        disbursementStatus: r.disbursementStatus,
        amountApproved: r.amountApproved,
        amountRequested: r.amountRequested,
        serviceFeePaid: r.serviceFeePaid,
        mandateStatus: r.mandateStatus,
        rejectionReason: r.rejectionReason,
        decidedAt: r.decidedAt,
        createdAt: r.createdAt,
        parent: r.parent
          ? {
              firstName: r.parent.firstName,
              lastName: r.parent.lastName,
              email: r.parent.user?.email ?? "",
            }
          : null,
        student: r.student
          ? {
              firstName: r.student.firstName,
              lastName: r.student.lastName,
              gradeLevel: r.student.gradeLevel,
            }
          : null,
        school: r.catalogSchool ? { name: r.catalogSchool.name } : null,
        bankDetails: bankDetails,
        disbursement: r.disbursement
          ? {
              status: r.disbursement.status,
              initiatedBy: r.disbursement.initiatedBy,
              disbursedAt: r.disbursement.disbursedAt,
              failureReason: r.disbursement.failureReason,
            }
          : null,
        assignedPartnerName: r.disbursement?.initiatedBy
          ? (partnerMap[r.disbursement.initiatedBy] ?? null)
          : null,
      };
    });

    return {
      applications,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async assignDisbursementPartner(
    loanId: string,
    fundingPartnerId: string,
    contactId?: string,
    note?: string,
  ) {
    const app = await LoanApplication.findByPk(loanId);
    if (!app) throw new ApiError(404, "Loan application not found");

    if (app.status !== "approved" || !app.serviceFeePaid) {
      throw new ApiError(400, "Application not ready for disbursement");
    }

    const partner = await FundingPartner.findByPk(fundingPartnerId);
    if (!partner) throw new ApiError(404, "Funding partner not found");
    if (partner.status !== "active")
      throw new ApiError(400, "Funding partner is not active");

    let recipientEmail = partner.email;
    let recipientName = partner.name;

    if (contactId) {
      const contact = await FundingPartnerContact.findOne({
        where: { id: contactId, fundingPartnerId, status: "active" },
      });
      if (!contact)
        throw new ApiError(404, "Funding partner contact not found");
      recipientEmail = contact.email;
      recipientName = contact.fullName;
    } else {
      const primaryContact = await FundingPartnerContact.findOne({
        where: { fundingPartnerId, isPrimary: true, status: "active" },
      });
      const fallbackContact =
        primaryContact ??
        (await FundingPartnerContact.findOne({
          where: { fundingPartnerId, status: "active" },
        }));
      if (fallbackContact) {
        recipientEmail = fallbackContact.email;
        recipientName = fallbackContact.fullName;
      }
    }

    const fullApp = await LoanApplication.findByPk(loanId, {
      include: [
        {
          model: Student,
          as: "student",
          include: [{ model: CatalogSchool, as: "school" }] as never[],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          include: [
            { model: SchoolBankAccount, as: "bankAccounts" },
          ] as never[],
        },
        { model: School, as: "school" },
        {
          model: Parent,
          as: "parent",
          include: [
            { model: User, as: "user", attributes: ["email"] },
          ] as never[],
        },
      ],
    } as never);
    if (!fullApp) throw new ApiError(404, "Loan application not found");

    const fa = fullApp as never as {
      id: string;
      referenceNumber: string | null;
      amountRequested: number;
      amountApproved: number | null;
      serviceChargeAmount: number | null;
      tenor: number;
      schoolId: string | null;
      parentId: string;
      student?: {
        firstName?: string;
        lastName?: string;
        studentId?: string | null;
        gradeLevel?: string;
      };
      catalogSchool?: {
        name?: string;
        tier?: string | null;
        bankAccounts?: {
          bankName: string;
          accountNumber: string;
          accountName: string;
          isPrimary: boolean;
        }[];
      };
      school?: {
        bankName?: string | null;
        bankAccountName?: string | null;
        bankAccountNumber?: string | null;
      };
      parent?: {
        firstName: string;
        lastName: string;
        user?: { email: string };
      };
    };

    const primaryBank =
      fa.catalogSchool?.bankAccounts?.find((b) => b.isPrimary) ??
      fa.catalogSchool?.bankAccounts?.[0];
    const bankName = primaryBank?.bankName ?? fa.school?.bankName ?? "N/A";
    const accountNumber =
      primaryBank?.accountNumber ?? fa.school?.bankAccountNumber ?? "N/A";
    const accountName =
      primaryBank?.accountName ?? fa.school?.bankAccountName ?? "N/A";

    const amountFmt = formatNaira(fa.amountRequested);
    const serviceChargeFmt = fa.serviceChargeAmount
      ? formatNaira(fa.serviceChargeAmount)
      : "N/A";
    const tenorLabel = formatTenorLabel(fa.tenor);

    const scheduleRows_raw = await RepaymentSchedule.findAll({
      where: { loanApplicationId: loanId },
      order: [["installment_number", "ASC"]],
    });
    const scheduleRows = scheduleRows_raw.map((s) => ({
      installment: s.installmentNumber,
      dueDate: String(s.dueDate),
      amount: formatNaira(s.totalAmount),
    }));

    const frontendUrl = env.frontendUrl;
    const disbursementUrl = `${frontendUrl}/funding-partner/disbursement/${loanId}`;

    await sequelize.transaction(async (t) => {
      const existing = await Disbursement.findOne({
        where: { loanApplicationId: loanId },
        transaction: t,
      });
      if (existing) {
        await existing.update(
          { status: "processing", initiatedBy: fundingPartnerId } as never,
          { transaction: t },
        );
      } else {
        await Disbursement.create(
          {
            loanApplicationId: loanId,
            schoolId: fa.schoolId ?? "",
            parentId: fa.parentId,
            amount: Number(fa.amountApproved ?? fa.amountRequested),
            status: "processing",
            initiatedBy: fundingPartnerId,
          } as never,
          { transaction: t },
        );
      }

      await ApplicationEvent.create(
        {
          loanApplicationId: loanId,
          actor: "admin",
          actorId: fundingPartnerId,
          status: "disbursement_initiated",
          note: note ?? null,
        } as never,
        { transaction: t },
      );
    });

    await emailService.sendFundingRequest({
      email: recipientEmail,
      recipientName: recipientName,
      referenceNumber: fa.referenceNumber ?? fa.id,
      parentName:
        `${fa.parent?.firstName ?? ""} ${fa.parent?.lastName ?? ""}`.trim(),
      studentName:
        `${fa.student?.firstName ?? ""} ${fa.student?.lastName ?? ""}`.trim(),
      admissionNumber: fa.student?.studentId ?? "N/A",
      gradeLevel: fa.student?.gradeLevel ?? "N/A",
      schoolName: fa.catalogSchool?.name ?? "N/A",
      schoolTier: fa.catalogSchool?.tier
        ? `Tier ${fa.catalogSchool.tier}`
        : "N/A",
      repaymentPlan: tenorLabel,
      serviceChargePaid: serviceChargeFmt,
      amountToDisburse: amountFmt,
      bankName,
      accountNumber,
      accountName,
      scheduleRows,
      adminLink: disbursementUrl,
    });
    return LoanApplication.findByPk(loanId, {
      include: [
        { model: Student, as: "student" },
        { model: CatalogSchool, as: "catalogSchool" },
        { model: Parent, as: "parent" },
        { model: Disbursement, as: "disbursement" },
      ],
    } as never);
  }

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

    if (status === "successful") {
      try {
        const loan = await LoanApplication.findByPk(d.loanApplicationId);
        const serviceChargeAmount = loan?.serviceChargeAmount
          ? Number(loan.serviceChargeAmount)
          : 0;

        await ledgerService.postDisbursement({
          loanApplicationId: d.loanApplicationId,
          disbursementId: d.id,
          disbursementRef: d.disbursementReference ?? `DSB-${d.id.slice(0, 8)}`,
          paystackRef:
            extras?.paystackReference ?? d.paystackReference ?? undefined,
          principalAmount: Number(d.amount),
          serviceChargeAmount,
          actor: "SYSTEM",
          effectiveDate: new Date(),
        });
        logger.info(
          `[admin.service] Disbursement ledger journal posted — disbursement=${d.id} loan=${d.loanApplicationId}`,
        );
      } catch (ledgerErr) {
        logger.error(
          `[admin.service] Ledger posting failed for disbursement=${d.id} (non-fatal): ${ledgerErr}`,
        );
      }
    }

    return d;
  }

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
    const repayment = (await Repayment.create({
      ...payload,
      currency: "NGN",
      status: "successful",
      paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
    } as never)) as InstanceType<typeof Repayment>;

    try {
      await ledgerService.postRepayment({
        loanApplicationId: payload.loanApplicationId,
        repaymentId: (repayment as any).id,
        receiptNumber: payload.receiptNumber ?? undefined,
        totalAmount: payload.amount,
        principalComponent: payload.amount,
        actor: "ADMIN",
        actorId: payload.recordedBy ?? undefined,
        actorName: "Admin",
        effectiveDate: payload.paidAt ? new Date(payload.paidAt) : new Date(),
      });
      logger.info(
        `[admin.service] Repayment ledger journal posted — repayment=${(repayment as any).id} loan=${payload.loanApplicationId}`,
      );
    } catch (ledgerErr) {
      logger.error(
        `[admin.service] Ledger posting failed for manual repayment ${(repayment as any).id} (non-fatal): ${ledgerErr}`,
      );
    }

    return repayment;
  }

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
    userIds?: string[];
    role?: "parent" | "school";
    title: string;
    message: string;
    type: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    let userIds = payload.userIds ?? [];

    if (!userIds.length) {
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
    return FundingPartner.findAll({
      where,
      order: [["name", "ASC"]],
      include: [
        {
          model: FundingPartnerContact,
          as: "contacts",
          where: { status: "active" },
          required: false,
        },
      ],
    });
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

  async getAllSettings() {
    const SECTIONS = [
      "security",
      "database",
      "notifications",
      "platform",
      "audit",
    ];
    const rows = await SystemSetting.findAll();
    const map: Record<string, unknown> = {};
    for (const section of SECTIONS) {
      const row = rows.find((r) => r.section === section);
      map[section] = row ? row.settings : DEFAULT_SETTINGS[section];
    }
    return map;
  }

  async getSection(section: string) {
    const row = await SystemSetting.findOne({ where: { section } });
    return row
      ? row.settings
      : ((DEFAULT_SETTINGS as Record<string, unknown>)[section] ?? {});
  }

  async upsertSection(
    section: string,
    settings: Record<string, unknown>,
    updatedBy?: string,
  ) {
    const [row, created] = await SystemSetting.findOrCreate({
      where: { section },
      defaults: { section, settings, updatedBy: updatedBy ?? null },
    });
    if (!created) {
      await row.update({ settings, updatedBy: updatedBy ?? null });
    }
    return row.settings;
  }

  exportDatabase() {
    const child = spawn(
      "pg_dump",
      [
        "-h",
        env.db.host,
        "-p",
        String(env.db.port),
        "-U",
        env.db.user,
        "-d",
        env.db.name,
        "--no-password",
      ],
      {
        env: { ...process.env, PGPASSWORD: env.db.password },
      },
    );
    return child;
  }

  backupDatabase(): Promise<{
    filename: string;
    size: number;
    timestamp: string;
  }> {
    return new Promise((resolve, reject) => {
      const filename = `/tmp/skulcredit-backup-${Date.now()}.sql`;
      const writeStream = fs.createWriteStream(filename);
      const child = spawn(
        "pg_dump",
        [
          "-h",
          env.db.host,
          "-p",
          String(env.db.port),
          "-U",
          env.db.user,
          "-d",
          env.db.name,
          "--no-password",
        ],
        {
          env: { ...process.env, PGPASSWORD: env.db.password },
        },
      );
      child.stdout.pipe(writeStream);
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`pg_dump exited with code ${code}`));
          return;
        }
        const stats = fs.statSync(filename);
        resolve({
          filename: path.basename(filename),
          size: stats.size,
          timestamp: new Date().toISOString(),
        });
      });
    });
  }

  async testEmail(opts: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromName: string;
    toEmail: string;
  }) {
    const transporter = nodemailer.createTransport({
      host: opts.smtpHost,
      port: opts.smtpPort,
      auth: { user: opts.smtpUser, pass: opts.smtpPass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: `"${opts.fromName}" <${opts.smtpUser}>`,
      to: opts.toEmail,
      subject: "SkulCredit — Test Email",
      text: "This is a test email from SkulCredit admin settings.",
    });
  }

  async getAdminProfile(userId: string) {
    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "phoneNumber", "createdAt"],
    });
    if (!user) throw new ApiError(404, "User not found");
    const profile = await AdminProfile.findOne({ where: { userId } });
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      fullName: profile?.fullName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      phone: profile?.phone ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateAdminProfile(
    userId: string,
    data: { fullName?: string; phone?: string; avatarUrl?: string },
  ) {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(404, "User not found");
    const [profile] = await AdminProfile.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    await profile.update({
      fullName: data.fullName !== undefined ? data.fullName : profile.fullName,
      phone: data.phone !== undefined ? data.phone : profile.phone,
      avatarUrl:
        data.avatarUrl !== undefined ? data.avatarUrl : profile.avatarUrl,
    });
    return this.getAdminProfile(userId);
  }

  async updateAdminPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(404, "User not found");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new ApiError(400, "Current password is incorrect");
    await user.update({ password: await bcrypt.hash(newPassword, 10) });
  }

  async generateSchoolVerificationLink(
    loanApplicationId: string,
    generatedBy: string,
    expiryHours = 72,
  ) {
    const app = (await LoanApplication.findByPk(loanApplicationId, {
      include: [
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name", "isRegistered"],
        },
        { model: Parent, as: "parent", attributes: ["id"] },
      ],
    } as never)) as any;
    if (!app) throw new ApiError(404, "Loan application not found");

    const catalogSchool = app.catalogSchool;
    const isManualSchool = catalogSchool && !catalogSchool.isRegistered;
    if (!isManualSchool) {
      throw new ApiError(
        400,
        "Verification links can only be generated for unknown/unregistered school applications",
      );
    }

    const schoolRequest = (await SchoolRequest.findOne({
      where: { parentId: app.parentId, schoolName: catalogSchool.name },
      order: [["createdAt", "DESC"]],
    } as never)) as any;
    const contactEmail = schoolRequest?.contactEmail ?? null;

    const token = randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const link = (await SchoolVerificationLink.create({
      token,
      loanApplicationId,
      schoolName: catalogSchool.name,
      contactEmail,
      generatedBy,
      expiresAt,
      usedAt: null,
      action: null,
      rejectionNote: null,
    } as never)) as any;

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    return {
      id: link.id,
      token,
      url: `${frontendUrl}/verify-school/${token}`,
      schoolName: catalogSchool.name,
      contactEmail,
      expiresAt,
    };
  }

  async getSchoolVerificationLinkByToken(token: string) {
    const link = await SchoolVerificationLink.findOne({
      where: { token },
      include: [
        {
          model: LoanApplication,
          as: "loanApplication",
          include: [
            {
              model: CatalogSchool,
              as: "catalogSchool",
              attributes: ["id", "name"],
            },
            {
              model: Student,
              as: "student",
              attributes: [
                "id",
                "firstName",
                "lastName",
                "gradeLevel",
                "studentId",
              ],
            },
            {
              model: Parent,
              as: "parent",
              attributes: [
                "id",
                "firstName",
                "lastName",
                "addressCity",
                "addressState",
              ],
            },
            {
              model: ApplicationEvent,
              as: "events",
              order: [["createdAt", "ASC"]],
              separate: true,
            },
          ],
        },
      ],
    } as never);

    if (!link)
      throw new ApiError(404, "Verification link not found or invalid");
    if (new Date() > new Date((link as any).expiresAt))
      throw new ApiError(410, "This verification link has expired");

    return link;
  }

  async useSchoolVerificationLink(
    token: string,
    action: "confirmed" | "rejected",
    rejectionNote?: string,
  ) {
    const link = (await SchoolVerificationLink.findOne({
      where: { token },
    })) as any;
    if (!link)
      throw new ApiError(404, "Verification link not found or invalid");
    if (new Date() > new Date(link.expiresAt))
      throw new ApiError(410, "This verification link has expired");
    if (link.usedAt)
      throw new ApiError(409, "This verification link has already been used");

    const app = (await LoanApplication.findByPk(link.loanApplicationId, {
      include: [{ model: Parent, as: "parent", attributes: ["id", "userId"] }],
    } as never)) as any;
    if (!app) throw new ApiError(404, "Application not found");

    if (action === "confirmed") {
      await app.update({
        schoolVerificationStatus: "confirmed",
        schoolVerifiedAt: new Date(),
        status: "under_review",
      });
      await ApplicationEvent.create({
        loanApplicationId: app.id,
        actor: "school",
        actorId: null,
        status: "under_review",
        note: "Enrollment confirmed by unknown school via verification link",
      } as never);

      eventNotifier.notifyApplicationApproved(app.parentId, app.id);

      this._sendParentServiceChargeEmailForManual(app.id).catch((err: Error) =>
        logger.error(
          `[admin.service] Manual school parent email failed: ${err.message}`,
        ),
      );
    } else {
      const reason =
        rejectionNote ?? "Application could not be confirmed by the school";
      await app.update({
        schoolVerificationStatus: "rejected",
        schoolVerifiedAt: new Date(),
        status: "rejected",
        rejectionReason: reason,
      });
      await ApplicationEvent.create({
        loanApplicationId: app.id,
        actor: "school",
        actorId: null,
        status: "rejected",
        note: reason,
      } as never);

      eventNotifier.notifyApplicationRejected(app.parentId, app.id, reason);
    }

    await link.update({
      usedAt: new Date(),
      action,
      rejectionNote: rejectionNote ?? null,
    });

    return { success: true, action };
  }

  private async _sendParentServiceChargeEmailForManual(
    loanApplicationId: string,
  ) {
    const app = (await LoanApplication.findByPk(loanApplicationId, {
      include: [
        { model: CatalogSchool, as: "catalogSchool", attributes: ["name"] },
        {
          model: Student,
          as: "student",
          attributes: ["firstName", "lastName"],
        },
        {
          model: Parent,
          as: "parent",
          include: [{ model: User, as: "user", attributes: ["email"] }],
        },
      ],
    } as never)) as any;
    if (!app) return;

    const parentEmail = app.parent?.user?.email;
    if (!parentEmail) return;

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

    await emailService.sendServiceCharge({
      email: parentEmail,
      parentName: app.parent?.firstName ?? "Parent",
      studentName:
        `${app.student?.firstName ?? ""} ${app.student?.lastName ?? ""}`.trim(),
      schoolName: app.catalogSchool?.name ?? "—",
      referenceNumber: app.referenceNumber ?? "",
      tuitionAmount: formatNaira(Number(app.amountRequested)),
      serviceCharge: formatNaira(Number(app.serviceChargeAmount ?? 0)),
      serviceChargeLink: `${frontendUrl}/parent/service-charge?ref=${app.referenceNumber ?? app.id}`,
    });
  }
}

export default new AdminService();
