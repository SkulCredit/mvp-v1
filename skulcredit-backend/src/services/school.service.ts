import { Op, fn, col } from "sequelize";
import { SchoolRepository } from "../repositories";
import {
  Student,
  LoanApplication,
  ApplicationEvent,
  User,
  Parent,
  CatalogSchool,
  SchoolRequest,
  SchoolBankAccount,
  RepaymentSchedule,
  School,
  Disbursement,
} from "../models/index";
import ApiError from "../utils/apiError";
import sendEmail from "../utils/email";
import { NotificationPublisher } from "../notifications/rabbitmq.publisher";
import { ParentRepository, UserRepository } from "../repositories";
import logger from "../config/logger";
import env from "../config/env";

interface GetApplicationsQuery {
  status?: string;
  page?: number | string;
  limit?: number | string;
}

interface GetStudentsQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
}

interface UpdateStudentData {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  gradeLevel?: string;
  tuitionAmount?: number;
}

interface CreateStudentData {
  firstName: string;
  lastName: string;
  studentId?: string;
  gradeLevel: string;
  tuitionAmount: number;
  parentId: string;
}

interface GetDisbursementsQuery {
  page?: number | string;
  limit?: number | string;
  status?: string;
}

interface VerifyEnrollmentData {
  action: "confirm" | "reject";
  confirmedTuitionAmount?: number;
  note?: string;
}

class SchoolService {
  async getProfile(userId: string) {
    const school = await SchoolRepository.findOne(
      { userId },
      {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email", "phoneNumber", "isEmailVerified"],
          },
        ],
      },
    );
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });

    return {
      ...school.toJSON(),
      catalogSchoolId: catalogSchool?.id ?? null,
    };
  }

  async completeRegistration(userId: string, data: Record<string, unknown>) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");
    if (school.status === "approved")
      throw new ApiError(400, "School is already approved");
    return school.update({ ...data, status: "under_review" });
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const allowed = [
      "contactPerson",
      "website",
      "population",
      "addressStreet",
      "addressCity",
      "addressState",
      "addressCountry",
    ];

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k)),
    );
    return school.update(filtered);
  }

  async updateBankDetails(
    userId: string,
    bankDetails: {
      bankName: string;
      accountName: string;
      accountNumber: string;
    },
  ) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");
    return school.update({
      bankName: bankDetails.bankName,
      bankAccountName: bankDetails.accountName,
      bankAccountNumber: bankDetails.accountNumber,
    });
  }

  async getApplications(
    userId: string,
    { status, page = 1, limit = 20 }: GetApplicationsQuery = {},
  ) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });

    const whereConditions: import("sequelize").WhereOptions[] = [
      { schoolId: school.id },
    ];
    if (catalogSchool) {
      whereConditions.push({ catalogSchoolId: catalogSchool.id });
    }

    const where: Record<string, unknown> = { [Op.or]: whereConditions };
    if (status) where.status = status;

    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const { count, rows } = await LoanApplication.findAndCountAll({
      where,
      include: [
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
          include: [
            {
              model: Parent,
              as: "parent",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(String(limit)),
      offset,
    });

    return {
      applications: rows,
      pagination: {
        total: count,
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        totalPages: Math.ceil(count / parseInt(String(limit))),
      },
    };
  }

  async getApplication(userId: string, applicationId: string) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });

    const application = await LoanApplication.findOne({
      where: {
        id: applicationId,
        [Op.or]: [
          { schoolId: school.id },
          ...(catalogSchool ? [{ catalogSchoolId: catalogSchool.id }] : []),
        ],
      },
      include: [
        {
          model: Student,
          as: "student",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "gradeLevel",
            "studentId",
            "tuitionAmount",
          ],
          include: [
            {
              model: Parent,
              as: "parent",
              attributes: ["id", "firstName", "lastName"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["email", "phoneNumber"],
                },
              ],
            },
          ],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: [
            "id",
            "name",
            "tier",
            "serviceChargeRate",
            "isRegistered",
          ],
        },
        {
          model: School,
          as: "school",
          attributes: [
            "id",
            "schoolName",
            "contactPerson",
            "addressStreet",
            "addressCity",
            "addressState",
            "bankName",
            "bankAccountName",
            "bankAccountNumber",
          ],
        },
        {
          model: ApplicationEvent,
          as: "events",
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!application) throw new ApiError(404, "Application not found");
    return application;
  }

  async verifyEnrollment(
    userId: string,
    applicationId: string,
    { action, confirmedTuitionAmount, note }: VerifyEnrollmentData,
  ) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });

    const application = await LoanApplication.findOne({
      where: {
        id: applicationId,
        [Op.or]: [
          { schoolId: school.id },
          ...(catalogSchool ? [{ catalogSchoolId: catalogSchool.id }] : []),
        ],
      },
    });
    if (!application) throw new ApiError(404, "Application not found");

    if (!["school_verification", "pending"].includes(application.status)) {
      throw new ApiError(
        400,
        `Application is in '${application.status}' status and is not awaiting school verification`,
      );
    }

    if (!application.schoolId && school.id) {
      await application.update({ schoolId: school.id });
    }

    if (action === "confirm") {
      await application.update({
        schoolVerificationStatus: "confirmed",
        schoolVerifiedAt: new Date(),
        schoolVerificationNote: note ?? null,
        ...(confirmedTuitionAmount && {
          amountRequested: confirmedTuitionAmount,
        }),
        status: "under_review",
      });
      await ApplicationEvent.create({
        loanApplicationId: application.id,
        actor: "school",
        actorId: school.id,
        status: "under_review",
        note: note ?? "Enrollment and fee amount confirmed by school",
      });

      this._sendParentServiceChargeEmail(application.id).catch((err) =>
        logger.warn(
          `[school.service] Parent service-charge email failed: ${(err as Error).message}`,
        ),
      );

      NotificationPublisher.applicationApproved(
        application.parentId,
        application.id,
      );
    } else {
      await application.update({
        schoolVerificationStatus: "rejected",
        schoolVerifiedAt: new Date(),
        schoolVerificationNote: note ?? null,
        status: "rejected",
        rejectionReason:
          note ?? "Enrollment could not be confirmed by the school",
      });
      await ApplicationEvent.create({
        loanApplicationId: application.id,
        actor: "school",
        actorId: school.id,
        status: "rejected",
        note: note ?? "Enrollment rejected by school",
      });

      NotificationPublisher.applicationRejected(
        application.parentId,
        application.id,
        note,
      );

      this._sendParentRejectionEmail(
        application.id,
        note ?? "Enrollment could not be confirmed by the school",
      ).catch((err) =>
        logger.warn(
          `[school.service] Parent rejection email failed: ${(err as Error).message}`,
        ),
      );
    }

    return LoanApplication.findByPk(applicationId);
  }

  async getDashboard(userId: string) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });

    const schoolWhere = catalogSchool
      ? {
          [Op.or]: [
            { schoolId: school.id },
            { catalogSchoolId: catalogSchool.id },
          ],
        }
      : { schoolId: school.id };

    const [
      totalStudents,
      totalApplications,
      pendingVerification,
      recentApplications,
    ] = await Promise.all([
      Student.count({ where: { schoolId: school.id } }),
      LoanApplication.count({ where: schoolWhere }),
      LoanApplication.count({
        where: {
          ...schoolWhere,
          status: { [Op.in]: ["school_verification", "pending"] },
        },
      }),
      LoanApplication.findAll({
        where: schoolWhere,
        include: [
          {
            model: Student,
            as: "student",
            attributes: ["id", "firstName", "lastName", "gradeLevel"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    return {
      profile: school,
      stats: { totalStudents, totalApplications, pendingVerification },
      recentApplications,
    };
  }

  async getStudents(
    userId: string,
    { page = 1, limit = 10, search }: GetStudentsQuery = {},
  ) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });

    if (!catalogSchool) {
      return {
        students: [],
        pagination: {
          total: 0,
          page: 1,
          limit: parseInt(String(limit)),
          totalPages: 0,
        },
      };
    }

    const where = search
      ? {
          schoolId: catalogSchool.id,
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { studentId: { [Op.iLike]: `%${search}%` } },
            { gradeLevel: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : { schoolId: catalogSchool.id };

    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const { count, rows } = await Student.findAndCountAll({
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
              attributes: ["email", "phoneNumber"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(String(limit)),
      offset,
    });

    return {
      students: rows,
      pagination: {
        total: count,
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        totalPages: Math.ceil(count / parseInt(String(limit))),
      },
    };
  }

  async createStudent(userId: string, data: CreateStudentData) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });
    if (!catalogSchool)
      throw new ApiError(404, "School catalog entry not found");

    if (data.parentId) {
      const parent = await Parent.findByPk(data.parentId, {
        attributes: ["id"],
      });
      if (!parent) throw new ApiError(404, "Parent not found");
    }

    return Student.create({
      firstName: data.firstName,
      lastName: data.lastName,
      studentId: data.studentId ?? null,
      gradeLevel: data.gradeLevel,
      tuitionAmount: data.tuitionAmount,
      parentId: data.parentId ?? school.userId,
      schoolId: catalogSchool.id,
    });
  }

  async updateStudent(
    userId: string,
    studentId: string,
    data: UpdateStudentData,
  ) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const catalogSchool = await CatalogSchool.findOne({
      where: { name: school.schoolName },
      attributes: ["id"],
    });
    if (!catalogSchool)
      throw new ApiError(404, "School catalog entry not found");

    const student = await Student.findOne({
      where: { id: studentId, schoolId: catalogSchool.id },
    });
    if (!student) throw new ApiError(404, "Student not found");

    const allowed: (keyof UpdateStudentData)[] = [
      "firstName",
      "lastName",
      "studentId",
      "gradeLevel",
      "tuitionAmount",
    ];
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) =>
        allowed.includes(k as keyof UpdateStudentData),
      ),
    );
    return student.update(filtered);
  }

  async getDisbursements(
    userId: string,
    { page = 1, limit = 10, status }: GetDisbursementsQuery = {},
  ) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, "School profile not found");

    const where: Record<string, unknown> = { schoolId: school.id };
    if (status) where.status = status;

    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const { count, rows } = await Disbursement.findAndCountAll({
      where,
      include: [
        {
          model: LoanApplication,
          as: "loanApplication",
          attributes: [
            "id",
            "referenceNumber",
            "amountRequested",
            "amountApproved",
            "status",
          ],
          include: [
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
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(String(limit)),
      offset,
    });

    const [totalDisbursedResult, pendingAmountResult, lastSuccessful] =
      await Promise.all([
        Disbursement.findOne({
          where: { schoolId: school.id, status: "successful" },
          attributes: [[fn("SUM", col("amount")), "totalDisbursed"]],
          raw: true,
        }),
        Disbursement.findOne({
          where: {
            schoolId: school.id,
            status: { [Op.in]: ["pending", "processing"] },
          },
          attributes: [[fn("SUM", col("amount")), "pendingAmount"]],
          raw: true,
        }),
        Disbursement.findOne({
          where: { schoolId: school.id, status: "successful" },
          order: [["disbursed_at", "DESC"]],
          attributes: ["disbursedAt"],
        }),
      ]);

    return {
      disbursements: rows,
      summary: {
        totalDisbursed: Number(
          (totalDisbursedResult as unknown as { totalDisbursed?: string })
            ?.totalDisbursed ?? 0,
        ),
        pendingDisbursement: Number(
          (pendingAmountResult as unknown as { pendingAmount?: string })
            ?.pendingAmount ?? 0,
        ),
        lastPaymentDate: lastSuccessful?.disbursedAt ?? null,
      },
      pagination: {
        total: count,
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        totalPages: Math.ceil(count / parseInt(String(limit))),
      },
    };
  }

  async getDisbursementDetails(applicationId: string) {
    const application = await LoanApplication.findByPk(applicationId, {
      include: [
        {
          model: Student,
          as: "student",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "studentId",
            "gradeLevel",
          ],
          include: [
            {
              model: Parent,
              as: "parent",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name", "tier", "serviceChargeRate"],
          include: [
            {
              model: SchoolBankAccount,
              as: "bankAccounts",
              attributes: [
                "id",
                "bankName",
                "accountNumber",
                "accountName",
                "isPrimary",
                "isVerified",
              ],
            },
          ],
        },
        {
          model: School,
          as: "school",
          attributes: [
            "bankName",
            "bankAccountName",
            "bankAccountNumber",
            "addressCity",
            "addressState",
          ],
        },
        {
          model: RepaymentSchedule,
          as: "schedule",
          attributes: [
            "installmentNumber",
            "dueDate",
            "totalAmount",
            "outstandingBalance",
            "status",
          ],
          order: [["installment_number", "ASC"]],
        },
      ],
    });

    if (!application) throw new ApiError(404, "Funding request not found");

    const parentProfile = await ParentRepository.findOne({
      id: application.parentId,
    });

    return {
      ...application.toJSON(),
      parent: parentProfile
        ? {
            firstName: parentProfile.firstName,
            lastName: parentProfile.lastName,
          }
        : undefined,
    };
  }

  async disbursementCallback(
    applicationId: string,
    action: "disbursed" | "rejected",
    note?: string,
  ) {
    const application = await LoanApplication.findByPk(applicationId, {
      include: [
        { model: Student, as: "student" },
        { model: CatalogSchool, as: "catalogSchool" },
      ],
    });
    if (!application) throw new ApiError(404, "Application not found");

    if (action === "disbursed") {
      await application.update({
        status: "disbursed",
        disbursementStatus: "successful",
      });
      await ApplicationEvent.create({
        loanApplicationId: application.id,
        actor: "system",
        actorId: null,
        status: "disbursed",
        note: note ?? "Funds disbursed to school by funding partner",
      });
      NotificationPublisher.disbursementCompleted(
        application.parentId,
        application.id,
        Number(application.amountRequested),
      );

      const parentUser = await this._getParentUser(application.parentId);
      if (parentUser?.email) {
        const amountFmt = `₦${Number(application.amountRequested).toLocaleString("en-NG")}`;
        const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
        sendEmail({
          email: parentUser.email,
          subject: `School Fees Disbursed – ${application.referenceNumber}`,
          message: `${amountFmt} has been successfully disbursed to the school.`,
          html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
            <div style="background:#16a34a;padding:28px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:22px">Funds Disbursed to School 🎉</h1>
            </div>
            <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 16px"><strong>${amountFmt}</strong> has been successfully transferred to your child's school for application <strong>${application.referenceNumber}</strong>.</p>
              <p style="margin:0 0 20px">Your repayment schedule is now active.</p>
              <div style="text-align:center;margin:24px 0">
                <a href="${frontendUrl}/parent/repayment" style="display:inline-block;background:#881337;color:#fff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">View Repayment Schedule</a>
              </div>
              <p style="font-size:13px;color:#6b7280;margin:0">The SkulCredit Team</p>
            </div>
          </div>`,
        }).catch(() => {});
      }
    } else {
      await application.update({
        status: "rejected",
        disbursementStatus: "failed",
        rejectionReason: note ?? "Disbursement rejected by funding partner",
      });
      await ApplicationEvent.create({
        loanApplicationId: application.id,
        actor: "system",
        actorId: null,
        status: "rejected",
        note:
          note ??
          "Disbursement rejected by funding partner — funds not transferred",
      });
      NotificationPublisher.disbursementFailed(
        application.parentId,
        application.id,
      );

      const parentUserForRejection = await this._getParentUser(
        application.parentId,
      );
      if (parentUserForRejection?.email) {
        const frontendUrl = process.env.FRONTEND_URL ?? env.frontendUrl;
        sendEmail({
          email: parentUserForRejection.email,
          subject: `Disbursement Issue – ${application.referenceNumber}`,
          message:
            "There was an issue with the disbursement of your tuition loan. Our team will be in touch.",
          html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
            <div style="background:#b91c1c;padding:28px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:22px">Disbursement Issue</h1>
            </div>
            <div style="background:#fff;padding:28px 32px;border:1px solid #fca5a5;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 16px">We encountered an issue processing the disbursement for application <strong>${application.referenceNumber}</strong>.</p>
              ${note ? `<div style="background:#fef2f2;border-left:4px solid #b91c1c;border-radius:6px;padding:14px 16px;margin-bottom:20px"><p style="margin:0;font-size:13px;color:#b91c1c"><strong>Reason:</strong> ${note}</p></div>` : ""}
              <p style="margin:0 0 16px;font-size:14px">Our team has been notified and will investigate. You will receive an update shortly. Please do not make any new payments until you hear from us.</p>
              <div style="text-align:center;margin:24px 0">
                <a href="${frontendUrl}/parent/applications" style="display:inline-block;background:#881337;color:#fff;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">View Application</a>
              </div>
              <p style="font-size:13px;color:#6b7280;margin:0">The SkulCredit Team</p>
            </div>
          </div>`,
        }).catch(() => {});
      }
    }

    return LoanApplication.findByPk(applicationId);
  }

  private async _sendParentRejectionEmail(
    applicationId: string,
    reason: string,
  ): Promise<void> {
    const application = await LoanApplication.findByPk(applicationId, {
      include: [
        { model: Student, as: "student" },
        { model: CatalogSchool, as: "catalogSchool" },
      ],
    });
    if (!application) return;

    const parentUser = await this._getParentUser(application.parentId);
    if (!parentUser?.email) return;

    const parent = await ParentRepository.findOne({ id: application.parentId });
    if (!parent) return;

    const frontendUrl = process.env.FRONTEND_URL ?? env.frontendUrl;
    const student = (
      application as unknown as {
        student?: { firstName?: string; lastName?: string };
      }
    ).student;
    const catalogSchool = (
      application as unknown as { catalogSchool?: { name?: string } }
    ).catalogSchool;

    await sendEmail({
      email: parentUser.email,
      subject: `Application Update – ${application.referenceNumber}`,
      message: `Your application for ${student?.firstName ?? ""} ${student?.lastName ?? ""} could not be accepted.`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:#b91c1c;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Application Not Accepted</h1>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #fca5a5;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${parent.firstName}</strong>,</p>
          <p style="margin:0 0 20px">Your tuition application for <strong>${student?.firstName ?? ""} ${student?.lastName ?? ""}</strong> at <strong>${catalogSchool?.name ?? "your school"}</strong> (ref: <strong>${application.referenceNumber}</strong>) has not been accepted by the school.</p>
          <div style="background:#fef2f2;border-left:4px solid #b91c1c;border-radius:6px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:14px;color:#b91c1c"><strong>Reason provided by school:</strong></p>
            <p style="margin:8px 0 0;font-size:14px;color:#7f1d1d">${reason}</p>
          </div>
          <p style="margin:0 0 20px;font-size:14px;color:#4b5563">The SkulCredit team will follow up with the school on your behalf. You may start a new application or contact our support team for assistance.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${frontendUrl}/parent/applications" style="display:inline-block;background:#881337;color:#fff;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">View My Applications</a>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0">The SkulCredit Team</p>
        </div>
      </div>`,
    });
  }

  private async _sendParentServiceChargeEmail(
    applicationId: string,
  ): Promise<void> {
    const application = await LoanApplication.findByPk(applicationId, {
      include: [
        { model: Student, as: "student" },
        { model: CatalogSchool, as: "catalogSchool" },
      ],
    });
    if (!application) return;

    const parentUser = await this._getParentUser(application.parentId);
    if (!parentUser?.email) return;

    const parent = await ParentRepository.findOne({ id: application.parentId });
    if (!parent) return;

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const serviceChargeLink = `${frontendUrl}/parent/service-charge?applicationId=${application.id}`;
    const serviceCharge = application.serviceChargeAmount
      ? `₦${Number(application.serviceChargeAmount).toLocaleString("en-NG")}`
      : "N/A";
    const tuitionFmt = `₦${Number(application.amountRequested).toLocaleString("en-NG")}`;
    const student = (
      application as unknown as {
        student?: { firstName?: string; lastName?: string };
      }
    ).student;
    const catalogSchool = (
      application as unknown as { catalogSchool?: { name?: string } }
    ).catalogSchool;

    await sendEmail({
      email: parentUser.email,
      subject: `Application Accepted – Pay Service Charge to Continue (${application.referenceNumber})`,
      message: `Your application has been accepted. Complete the next step by paying the service charge.`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
        <div style="background:#881337;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Application Accepted — Action Required</h1>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${parent.firstName}</strong>,</p>
          <p style="margin:0 0 20px">
            Your tuition application for <strong>${student?.firstName ?? ""} ${student?.lastName ?? ""}</strong>
            at <strong>${catalogSchool?.name ?? "your school"}</strong> has been accepted.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Application ID</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${application.referenceNumber}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Approved Tuition</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${tuitionFmt}</td></tr>
            <tr><td style="padding:10px 0;color:#881337;font-weight:bold;font-size:15px">Service Charge Due</td>
                <td style="padding:10px 0;color:#881337;font-weight:bold;text-align:right;font-size:15px">${serviceCharge}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0">
            <a href="${serviceChargeLink}" style="display:inline-block;background:#881337;color:#fff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">
              Pay Service Charge Now →
            </a>
          </div>
          <div style="background:#fdf4f7;border-left:4px solid #881337;border-radius:6px;padding:14px 16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#881337">
              <strong>After paying:</strong> You'll be directed to set up your repayment plan, then funds will be disbursed to the school.
            </p>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0">The SkulCredit Team</p>
        </div>
      </div>`,
    });

    logger.info(
      `[school.service] Service charge email sent to parent ${parentUser.email} for application ${applicationId}`,
    );
  }

  private async _getParentUser(parentId: string) {
    const parent = await ParentRepository.findOne({ id: parentId });
    if (!parent) return null;
    return UserRepository.findById(parent.userId);
  }
}

export default new SchoolService();
