import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { ParentRepository, UserRepository } from "../repositories";
import sendEmail from "../utils/email";
import schoolTermService from "./schoolTerm.service";
import {
  Student,
  LoanApplication,
  LoanLedger,
  Document,
  School,
  SchoolRequest,
  ApplicationEvent,
  User,
  CatalogSchool,
  RepaymentSchedule,
  SchoolBankAccount,
  FundingPartner,
} from "../models/index";
import ApiError from "../utils/apiError";
import env from "../config/env";
import identityService, {
  NinVerificationResponse,
} from "../integrations/lendsqr/identity.service";
import customerService, {
  CustomerPayload,
} from "../integrations/lendsqr/customer.service";
import localStorageService from "../integrations/storage/local.service";
import logger from "../config/logger";
import { buildInitialStateMachine } from "../models/LoanLedger";
import { publishLoanBooking } from "../queues/loan.queue";
import type { BookLoanPayload } from "../integrations/lendsqr/application.service";
import applicationService from "../integrations/lendsqr/application.service";
import { NotificationPublisher } from "../notifications/rabbitmq.publisher";

const LENDSQR_PRODUCT_ID = parseInt(process.env.LENDSQR_PRODUCT_ID ?? "74", 10);

interface SchoolDirectoryQuery {
  search?: string;
  city?: string;
  state?: string;
  page?: number | string;
  limit?: number | string;
}

class ParentService {
  async getProfile(userId: string) {
    const parent = await ParentRepository.findOne(
      { userId },
      {
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "email",
              "phoneNumber",
              "isEmailVerified",
              "lastLogin",
            ],
          },
        ],
      },
    );
    if (!parent) throw new ApiError(404, "Parent profile not found");
    return parent;
  }

  async completeProfile(userId: string, profileData: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");
    const updated = await parent.update(profileData);
    NotificationPublisher.accountAction(
      userId,
      "Your profile has been updated successfully.",
    );
    return updated;
  }

  async changePassword(
    userId: string,
    {
      currentPassword,
      newPassword,
    }: { currentPassword: string; newPassword: string },
  ) {
    const user = await UserRepository.findOne(
      { id: userId },
      { attributes: { include: ["password"] } },
    );
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, "Current password is incorrect");

    await user.update({ password: await bcrypt.hash(newPassword, 10) });
  }

  async verifyKYC(
    userId: string,
    kycData: {
      bvn?: string;
      nin?: string;
      dob?: string;
      state?: string;
      lga?: string;
      city?: string;
      address?: string;
      photoUrl?: string;
      accountNumber?: string;
      bankCode?: string;
      documents?: Array<{ url: string; type_id: number; sub_type_id?: number }>;
      relationship?: string;
      employerType?: string;
      yearsInRole?: string;
      monthlyIncome?: string;
    },
  ) {
    const parent = await ParentRepository.findOne({ userId });
    const user = await UserRepository.findById(userId);
    if (!parent) throw new ApiError(404, "Parent profile not found");
    const customerPayload: CustomerPayload = {
      phone_number: user!.phoneNumber ?? "",
      email: user!.email,
      bvn: kycData.bvn,
      bvn_phone_number: kycData.bvn ? (user!.phoneNumber ?? "") : undefined,
      dob: kycData.dob,
      state: kycData.state,
      lga: kycData.lga,
      city: kycData.city,
      address: kycData.address,
      photo_url: kycData.photoUrl,
      account_number: kycData.accountNumber,
      bank_code: kycData.bankCode,
      documents: kycData.documents,
    };

    const lendsqrResponse =
      await customerService.createCustomer(customerPayload);
    logger.info(
      "Lendsqr createCustomer response: " + JSON.stringify(lendsqrResponse),
    );

    const lendsqrUser =
      lendsqrResponse.data?.users?.[0] ??
      lendsqrResponse.data?.user ??
      (lendsqrResponse.data?.id ? lendsqrResponse.data : null);

    const lendsqrCustomerId = lendsqrUser
      ? String((lendsqrUser as { id?: unknown }).id ?? "registered")
      : "registered";

    return parent.update({
      bvn: kycData.bvn ?? parent.bvn,
      nin: kycData.nin ?? parent.nin,
      dob: kycData.dob ?? null,
      addressState: kycData.state ?? null,
      addressLga: kycData.lga ?? null,
      addressCity: kycData.city ?? null,
      addressStreet: kycData.address ?? null,
      profilePhotoUrl: kycData.photoUrl ?? null,
      kycStatus: "approved",
      lendsqrCustomerId,
      ...(kycData.relationship !== undefined && {
        relationship: kycData.relationship,
      }),
      ...(kycData.employerType !== undefined && {
        employerType: kycData.employerType,
      }),
      ...(kycData.yearsInRole !== undefined && {
        yearsInRole: kycData.yearsInRole,
      }),
      ...(kycData.monthlyIncome !== undefined && {
        monthlyIncome: kycData.monthlyIncome,
      }),
    });
    NotificationPublisher.accountAction(
      userId,
      "Your identity has been verified and KYC is complete. You can now apply for school fee financing.",
    );
    return parent;
  }

  async verifyNin(nin: string): Promise<NinVerificationResponse["data"]> {
    const response = await identityService.verifyNin(nin);
    if (response.status !== "success" || !response.data) {
      throw new ApiError(400, "NIN verification failed");
    }
    return response.data;
  }

  async checkLoanScore(
    userId: string,
    bvn: string,
    requestedAmount: number,
    location: string,
  ): Promise<{
    pass: boolean;
    decision: string;
    creditScore: string;
    advisoryAmount: number;
  }> {
    const parent = await ParentRepository.findOne({ userId });
    const user = await UserRepository.findById(userId);
    if (!parent || !user) throw new ApiError(404, "Parent profile not found");

    const payload = {
      product_id: LENDSQR_PRODUCT_ID,
      bvn,
      requested_amount: requestedAmount,
      location: location || "Lagos",
    };

    let scoreRes;
    try {
      scoreRes = await applicationService.checkLoanScore(payload);
    } catch (err) {
      logger.error("Loan score check failed (non-fatal): " + String(err));
      return {
        pass: true,
        decision: "score_unavailable",
        creditScore: "N/A",
        advisoryAmount: 0,
      };
    }

    const dd = scoreRes.data?.decision_data;
    const pass = dd?.pass ?? true;

    if (!pass) {
      const nextTerm = await schoolTermService.getNextTerm();
      const blockedUntil = nextTerm?.portalOpeningDate ?? null;
      await parent.update({ eligibilityBlockedUntil: blockedUntil });
      logger.warn(
        `Loan score FAILED for userId=${userId} — decision="${dd?.decision}" — blocked until ${blockedUntil ?? "next term"}.`,
      );
    }

    return {
      pass,
      decision: dd?.decision ?? "unknown",
      creditScore: scoreRes.data?.credit_score ?? "0%",
      advisoryAmount: dd?.advisory_amount ?? 0,
    };
  }

  async getEligibilityStatus(userId: string): Promise<{
    kycStatus: string;
    isBlocked: boolean;
    blockedUntil: string | null;
  }> {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const today = new Date().toISOString().split("T")[0];
    const isBlocked =
      !!parent.eligibilityBlockedUntil &&
      parent.eligibilityBlockedUntil > today;

    return {
      kycStatus: parent.kycStatus,
      isBlocked,
      blockedUntil: parent.eligibilityBlockedUntil,
    };
  }

  async getEligibilityProfile(userId: string) {
    const parent = await ParentRepository.findOne(
      { userId },
      {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email", "phoneNumber"],
          },
        ],
      },
    );
    if (!parent) throw new ApiError(404, "Parent profile not found");

    return {
      firstName: parent.firstName,
      lastName: parent.lastName,
      middleName: parent.middleName,
      dob: parent.dob,
      addressStreet: parent.addressStreet,
      addressCity: parent.addressCity,
      addressLga: parent.addressLga,
      addressState: parent.addressState,
      addressCountry: parent.addressCountry,
      profilePhotoUrl: parent.profilePhotoUrl,
      kycStatus: parent.kycStatus,
      relationship: parent.relationship,
      employerType: parent.employerType,
      yearsInRole: parent.yearsInRole,
      monthlyIncome: parent.monthlyIncome,
      eligibilityBlockedUntil: parent.eligibilityBlockedUntil,
      email:
        (parent as unknown as { user?: { email: string } }).user?.email ?? "",
      phoneNumber:
        (parent as unknown as { user?: { phoneNumber: string } }).user
          ?.phoneNumber ?? "",
    };
  }

  async updateEligibilityProfile(
    userId: string,
    payload: {
      photoUrl?: string;
      phoneNumber?: string;
      employerType?: string;
      yearsInRole?: string;
      monthlyIncome?: string;
    },
  ) {
    const parent = await ParentRepository.findOne({ userId });
    const user = await UserRepository.findById(userId);
    if (!parent || !user) throw new ApiError(404, "Parent profile not found");

    if (payload.phoneNumber !== undefined) {
      await user.update({ phoneNumber: payload.phoneNumber });
    }

    await parent.update({
      ...(payload.photoUrl !== undefined && {
        profilePhotoUrl: payload.photoUrl,
      }),
      ...(payload.employerType !== undefined && {
        employerType: payload.employerType,
      }),
      ...(payload.yearsInRole !== undefined && {
        yearsInRole: payload.yearsInRole,
      }),
      ...(payload.monthlyIncome !== undefined && {
        monthlyIncome: payload.monthlyIncome,
      }),
    });

    return this.getEligibilityProfile(userId);
  }

  async addStudent(userId: string, studentData: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const school = await CatalogSchool.findByPk(studentData.schoolId as string);
    if (!school) throw new ApiError(404, "School not found");
    if (!school.isActive)
      throw new ApiError(400, "School is not currently active");

    const student = await Student.create({
      parentId: parent.id,
      tuitionAmount: 0,
      ...studentData,
    } as never);
    NotificationPublisher.general(
      userId,
      "Student Added",
      `A new student has been added to your account successfully.`,
    );
    return student;
  }

  async getStudents(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    return Student.findAll({
      where: { parentId: parent.id },
      include: [
        {
          model: CatalogSchool,
          as: "school",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async getStudent(userId: string, studentId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const student = await Student.findOne({
      where: { id: studentId, parentId: parent.id },
      include: [
        {
          model: CatalogSchool,
          as: "school",
          attributes: ["id", "name"],
        },
      ],
    });
    if (!student) throw new ApiError(404, "Student not found");
    return student;
  }

  async updateStudent(
    userId: string,
    studentId: string,
    data: Record<string, unknown>,
  ) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const student = await Student.findOne({
      where: { id: studentId, parentId: parent.id },
    });
    if (!student) throw new ApiError(404, "Student not found");

    if (data.schoolId && data.schoolId !== student.schoolId) {
      const school = await CatalogSchool.findByPk(data.schoolId as string);
      if (!school) throw new ApiError(404, "School not found");
      if (!school.isActive)
        throw new ApiError(400, "School is not currently active");
    }

    return student.update(data);
  }

  async deleteStudent(userId: string, studentId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const student = await Student.findOne({
      where: { id: studentId, parentId: parent.id },
    });
    if (!student) throw new ApiError(404, "Student not found");

    const activeLoans = await LoanApplication.count({
      where: {
        studentId: student.id,
        status: { [Op.notIn]: ["rejected", "repaid", "cancelled"] },
      },
    });
    if (activeLoans > 0) {
      throw new ApiError(
        400,
        "Cannot delete a student with active loan applications",
      );
    }

    await student.destroy();
  }

  async getApplications(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    return LoanApplication.findAll({
      where: { parentId: parent.id },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "firstName", "lastName", "gradeLevel"],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async getApplication(userId: string, applicationId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
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
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name"],
        },
        {
          model: ApplicationEvent,
          as: "events",
          order: [["createdAt", "ASC"]],
        },
        {
          model: RepaymentSchedule,
          as: "schedule",
          order: [["installmentNumber", "ASC"]],
        },
      ],
    });
    if (!application) throw new ApiError(404, "Application not found");
    return application;
  }

  async getRepaymentSchedule(userId: string, applicationId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
      attributes: [
        "id",
        "referenceNumber",
        "amountRequested",
        "amountApproved",
        "tenor",
        "status",
        "serviceFeePaid",
        "serviceChargeAmount",
        "disbursementStatus",
        "mandateDebitDay",
        "mandateStatus",
      ],
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "firstName", "lastName", "gradeLevel"],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          attributes: ["id", "name"],
        },
        {
          model: RepaymentSchedule,
          as: "schedule",
          order: [["installmentNumber", "ASC"]],
        },
      ],
    });

    if (!application) throw new ApiError(404, "Application not found");
    return application;
  }

  async getSchoolDirectory({
    search,
    city,
    state,
    page = 1,
    limit = 20,
  }: SchoolDirectoryQuery) {
    const where: Record<string, unknown> = { status: "approved" };
    if (city) where.addressCity = city;
    if (state) where.addressState = state;
    if (search) where.schoolName = { [Op.iLike]: `%${search}%` };

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await School.findAndCountAll({
      where,
      attributes: [
        "id",
        "schoolName",
        "website",
        "addressStreet",
        "addressCity",
        "addressState",
        "addressCountry",
        "population",
      ],
      order: [["schoolName", "ASC"]],
      limit: Number(limit),
      offset,
    });

    return {
      schools: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async requestSchool(userId: string, data: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const existing = await SchoolRequest.findOne({
      where: {
        parentId: parent.id,
        schoolName: { [Op.iLike]: String(data.schoolName).trim() },
        status: { [Op.in]: ["pending", "in_progress"] },
      },
    });

    if (existing) {
      return existing.update({
        schoolAddress:
          (data.schoolAddress as string | undefined) ?? existing.schoolAddress,
        schoolCity:
          (data.schoolCity as string | undefined) ?? existing.schoolCity,
        schoolState:
          (data.schoolState as string | undefined) ?? existing.schoolState,
        contactPerson:
          (data.contactPerson as string | undefined) ?? existing.contactPerson,
        contactPhone:
          (data.contactPhone as string | undefined) ?? existing.contactPhone,
        contactEmail:
          (data.contactEmail as string | undefined) ?? existing.contactEmail,
        additionalNotes:
          (data.additionalNotes as string | undefined) ??
          existing.additionalNotes,
        documentUrl:
          (data.documentUrl as string | undefined) ?? existing.documentUrl,
      });
    }

    return SchoolRequest.create({ parentId: parent.id, ...data } as never);
  }

  async getSchoolRequests(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    return SchoolRequest.findAll({
      where: { parentId: parent.id },
      order: [["createdAt", "DESC"]],
    });
  }

  async getDashboard(userId: string) {
    const parent = await ParentRepository.findOne(
      { userId },
      {
        include: [
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
                model: Student,
                as: "student",
                attributes: ["id", "firstName", "lastName"],
              },
            ],
            order: [["createdAt", "DESC"]],
            limit: 5,
          },
        ],
      },
    );

    if (!parent) throw new ApiError(404, "Parent profile not found");

    const [
      totalApplications,
      activeLoans,
      pendingApplications,
      schoolRequests,
      approvedLoans,
    ] = await Promise.all([
      LoanApplication.count({ where: { parentId: parent.id } }),
      LoanApplication.count({
        where: { parentId: parent.id, status: "disbursed" },
      }),
      LoanApplication.count({
        where: {
          parentId: parent.id,
          status: {
            [Op.in]: [
              "pending",
              "under_review",
              "info_requested",
              "school_verification",
            ],
          },
        },
      }),
      SchoolRequest.findAll({
        where: { parentId: parent.id },
        attributes: ["id", "schoolName", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
      }),
      LoanApplication.findAll({
        where: { parentId: parent.id, status: "approved" },
        attributes: ["amountApproved"],
      }),
    ]);

    const totalApprovedAmount = (
      approvedLoans as unknown as Array<{ amountApproved: number | null }>
    ).reduce((sum, loan) => sum + (loan.amountApproved ?? 0), 0);

    const hasSchoolRequest = schoolRequests.length > 0;

    return {
      profile: parent,
      kycStatus: parent.kycStatus,
      stats: {
        totalApplications,
        activeLoans,
        pendingApplications,
        totalApprovedAmount,
      },
      schoolRequests,
      hasSchoolRequest,
    };
  }

  async submitApplication(
    userId: string,
    payload: {
      dob: string;
      addressStreet: string;
      addressCity: string;
      addressState: string;
      addressLga: string;
      addressCountry?: string;
      relationship: string;
      employerType: string;
      yearsInRole: string;
      monthlyIncome: string;
      photo?: Express.Multer.File;
      bvn?: string;
      nin?: string;
      accountNumber?: string;
      bankCode?: string;
      kycDocuments: Array<
        Express.Multer.File & {
          docType: string;
          lendsqrTypeId?: number;
          lendsqrSubTypeId?: number;
        }
      >;
      schoolId: string;
      institutionType: string;
      gradeLevel: string;
      repaymentPlan: string;
      academicSession: string;
      tuitionAmount: number;
      tenor: number;
      students: Array<{
        fullName: string;
        dob: string;
        gender: string;
        admissionNumber: string;
      }>;
      termsConfirmed: boolean;
    },
  ) {
    const parent = await ParentRepository.findOne({ userId });
    const user = await UserRepository.findById(userId);
    if (!parent) throw new ApiError(404, "Parent profile not found");
    if (!user) throw new ApiError(404, "User not found");

    const catalogSchoolForWizard = await CatalogSchool.findByPk(
      payload.schoolId,
    );
    if (!catalogSchoolForWizard) throw new ApiError(404, "School not found");
    if (!catalogSchoolForWizard.isActive)
      throw new ApiError(400, "School is not currently active");

    const partnerSchoolForWizard = await School.findOne({
      where: { schoolName: catalogSchoolForWizard.name },
    });

    let photoUrl: string | null = parent.profilePhotoUrl ?? null;

    if (payload.photo) {
      const file = payload.photo;
      const filePath = `uploads/photos/${file.filename}`;
      const publicUrl = `/${filePath}`;
      const existingPhoto = await Document.findOne({
        where: { parentId: parent.id, category: "photo" },
      });
      if (existingPhoto) {
        localStorageService.deleteFile(existingPhoto.filePath);
        await existingPhoto.update({ filePath, fileUrl: publicUrl });
      } else {
        await Document.create({
          parentId: parent.id,
          category: "photo",
          docType: "Profile Photo",
          filePath,
          fileUrl: publicUrl,
          mimeType: file.mimetype,
          fileSize: file.size,
          lendsqrTypeId: 1,
          lendsqrSubTypeId: null,
        });
      }

      photoUrl = publicUrl;
    }

    const uploadedDocUrls: Array<{
      url: string;
      type_id: number;
      sub_type_id?: number;
    }> = [];

    for (const doc of payload.kycDocuments) {
      const filePath = `uploads/kyc_docs/${doc.filename}`;
      const publicUrl = `/${filePath}`;

      await Document.create({
        parentId: parent.id,
        category: "kyc_document",
        docType: doc.docType,
        filePath,
        fileUrl: publicUrl,
        mimeType: doc.mimetype,
        fileSize: doc.size,
        lendsqrTypeId: doc.lendsqrTypeId ?? 1,
        lendsqrSubTypeId: doc.lendsqrSubTypeId ?? null,
      });

      uploadedDocUrls.push({
        url: publicUrl,
        type_id: doc.lendsqrTypeId ?? 1,
        sub_type_id: doc.lendsqrSubTypeId,
      });
    }

    await parent.update({
      dob: payload.dob,
      addressStreet: payload.addressStreet,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
      addressLga: payload.addressLga,
      addressCountry: payload.addressCountry ?? null,
      ...(photoUrl ? { profilePhotoUrl: photoUrl } : {}),
    });
    if (!parent.lendsqrCustomerId) {
      const customerPayload: CustomerPayload = {
        phone_number: user.phoneNumber ?? "",
        email: user.email,
        bvn: payload.bvn,
        bvn_phone_number: payload.bvn ? (user.phoneNumber ?? "") : undefined,
        dob: payload.dob,
        state: payload.addressState,
        lga: payload.addressLga,
        city: payload.addressCity,
        address: payload.addressStreet,
        photo_url: photoUrl ?? undefined,
        account_number: payload.accountNumber,
        bank_code: payload.bankCode,
        documents: uploadedDocUrls,
      };

      const lendsqrRes = await customerService.createCustomer(customerPayload);
      logger.info(
        "Lendsqr createCustomer response: " + JSON.stringify(lendsqrRes),
      );
      const lendsqrUser =
        lendsqrRes.data?.users?.[0] ??
        lendsqrRes.data?.user ??
        (lendsqrRes.data?.id ? lendsqrRes.data : null);

      const lendsqrCustomerId = lendsqrUser
        ? String((lendsqrUser as { id?: unknown }).id ?? "registered")
        : "registered";

      await parent.update({
        bvn: payload.bvn ?? parent.bvn,
        nin: payload.nin ?? parent.nin,
        kycStatus: "approved",
        lendsqrCustomerId,
      });
    }

    const freshParent = await ParentRepository.findOne({ userId }, {
      scope: "withSensitive",
    } as never);

    const createdApplications: (typeof LoanApplication.prototype)[] = [];

    for (const studentData of payload.students) {
      const parts = studentData.fullName.trim().split(/\s+/);
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ") || firstName;

      const student = await Student.create({
        parentId: parent.id,
        schoolId: payload.schoolId,
        firstName,
        lastName,
        studentId: studentData.admissionNumber || null,
        gradeLevel: payload.gradeLevel,
        tuitionAmount: payload.tuitionAmount,
      });

      const referenceNumber = `SKC-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;

      const application = await LoanApplication.create({
        referenceNumber,
        parentId: parent.id,
        studentId: student.id,
        catalogSchoolId: payload.schoolId,
        schoolId: partnerSchoolForWizard?.id ?? null,
        amountRequested: payload.tuitionAmount,
        tenor: payload.tenor,
        status: "pending",
        termsAccepted: payload.termsConfirmed,
        termsAcceptedAt: payload.termsConfirmed ? new Date() : null,
      });

      createdApplications.push(application);
      const now = new Date().toISOString();
      const stateMachine = buildInitialStateMachine(now);

      const ledger = await LoanLedger.create({
        loanApplicationId: application.id,
        lendsqrProductId: LENDSQR_PRODUCT_ID,
        bvnLast4: freshParent?.bvn ? freshParent.bvn.slice(-4) : null,
        status: "INITIATED",
        stateMachine,
        statusHistory: [
          {
            status: "INITIATED" as const,
            timestamp: now,
            actor: "SYSTEM" as const,
            message: "Loan booking initiated via full wizard submission",
          },
        ],
        settlement: {
          settledAt: null,
          settlementReference: null,
          status: "PENDING",
        },
        webhookPayloads: [],
        queuedAt: null,
      });

      if (freshParent?.bvn) {
        const bookLoanPayload: BookLoanPayload = {
          bvn: freshParent.bvn,
          requested_amount: payload.tuitionAmount,
          proposed_tenor: payload.tenor,
          proposed_tenor_period: "months",
          purpose: `School Fees for ${student.firstName} ${student.lastName}`,
          product_id: LENDSQR_PRODUCT_ID,
          disburse_to: "bank",
          location: freshParent.addressState ?? undefined,
          monthly_net_income: payload.monthlyIncome,
          employment_status: payload.employerType.toLowerCase().includes("self")
            ? "Self Employed"
            : "Employed",
          employment_category: payload.employerType,
        };

        await ledger.update({ queuedAt: new Date().toISOString() });

        await publishLoanBooking({
          loanApplicationId: application.id,
          loanLedgerId: ledger.id,
          bookLoanPayload,
        });

        logger.info(
          `[parent.service] Loan booking queued | application=${application.id} | ledger=${ledger.id}`,
        );
      } else {
        logger.warn(
          `[parent.service] No BVN for parent ${parent.id} — loan booking job skipped for application ${application.id}`,
        );
      }
    }

    return {
      applications: createdApplications,
      lendsqrCustomerId: parent.lendsqrCustomerId,
      referenceNumbers: createdApplications.map((a) => a.referenceNumber),
    };
  }

  async submitWizardApplicationJson(
    userId: string,
    payload: {
      childId: string;
      schoolId: string;
      institutionTypeId: string;
      institutionTypeName: string;
      gradeLevel: string;
      tuitionAmount: number;
      repaymentPlanId: "full" | "3month" | "6month";
      tenor: number;
      academicSession?: string;
      term?: string;
    },
  ) {
    const parent = await ParentRepository.findOne({ userId }, {
      scope: "withSensitive",
    } as never);
    if (!parent) throw new ApiError(404, "Parent profile not found");

    if (!parent.lendsqrCustomerId) {
      throw new ApiError(
        400,
        "KYC not completed. Please complete the eligibility test before applying.",
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.childId)) {
      throw new ApiError(
        404,
        "Student not found. Please ensure you are logged in and have registered a child.",
      );
    }

    const student = await Student.findOne({
      where: { id: payload.childId, parentId: parent.id },
    });
    if (!student) throw new ApiError(404, "Student not found");

    const isManualSchool = payload.schoolId === "manual";

    let catalogSchool: InstanceType<typeof CatalogSchool> | null = null;
    let manualSchoolName: string | null = null;

    if (isManualSchool) {
      const schoolRequest = await SchoolRequest.findOne({
        where: { parentId: parent.id },
        order: [["createdAt", "DESC"]],
      });
      if (!schoolRequest) {
        throw new ApiError(
          400,
          "No school request found. Please complete the manual school form first.",
        );
      }
      manualSchoolName = schoolRequest.schoolName;

      const [manualCatalogSchool] = await CatalogSchool.findOrCreate({
        where: { name: schoolRequest.schoolName },
        defaults: {
          name: schoolRequest.schoolName,
          isRegistered: false,
          tier: null,
          serviceChargeRate: 0.235,
          isActive: true,
        },
      });
      catalogSchool = manualCatalogSchool;
    } else {
      catalogSchool = await CatalogSchool.findByPk(payload.schoolId);
      if (!catalogSchool) throw new ApiError(404, "School not found");
      if (!catalogSchool.isActive)
        throw new ApiError(400, "School is not currently active");
    }

    const partnerSchool = catalogSchool
      ? await School.findOne({
          where: { schoolName: catalogSchool.name },
        })
      : null;

    const activeTerm = await schoolTermService.getActiveTerm();

    if (!activeTerm) {
      throw new ApiError(
        403,
        "The application portal is currently closed. Please check back when the next school term opens.",
      );
    }

    const existingApplication = await LoanApplication.findOne({
      where: {
        studentId: student.id,
        status: { [Op.notIn]: ["rejected", "cancelled"] },
        createdAt: {
          [Op.gte]: new Date(activeTerm.portalOpeningDate),
          [Op.lt]: new Date(
            new Date(activeTerm.portalCloseDate).getTime() +
              24 * 60 * 60 * 1000,
          ),
        },
      },
    });

    if (existingApplication) {
      throw new ApiError(
        409,
        `You've already submitted an application for ${student.firstName} ${student.lastName} this term (${activeTerm.termName} ${activeTerm.sessionName}). A student's fees can only be financed once per term.`,
      );
    }

    const effectiveTenor = schoolTermService.computeEffectiveTenor(activeTerm);

    const referenceNumber = `SKC-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    const application = await LoanApplication.create({
      referenceNumber,
      parentId: parent.id,
      studentId: student.id,
      catalogSchoolId: catalogSchool!.id,
      schoolId: partnerSchool?.id ?? null,
      amountRequested: payload.tuitionAmount,
      tenor: effectiveTenor,
      status: partnerSchool ? "school_verification" : "pending",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      serviceChargeRate: Number(catalogSchool!.serviceChargeRate ?? 0.235),
      serviceChargeAmount: Math.round(
        payload.tuitionAmount *
          Number(catalogSchool!.serviceChargeRate ?? 0.235),
      ),
      adminNote: isManualSchool ? `Manual school: ${manualSchoolName}` : null,
    });

    await ApplicationEvent.create({
      loanApplicationId: application.id,
      actor: "parent",
      actorId: parent.id,
      status: application.status,
      note: null,
    });

    UserRepository.findById(userId)
      .then((user) => {
        if (!user?.email) return;
        const planLabel =
          payload.tenor === 1 ? "Full payment" : `${payload.tenor}-month plan`;
        const amountFormatted = `₦${Number(payload.tuitionAmount).toLocaleString("en-NG")}`;

        sendEmail({
          email: user.email,
          subject: `Application Received – ${application.referenceNumber}`,
          message: `Your application for ${student.firstName} ${student.lastName} has been received and is under review.`,
          html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
            <div style="background:#881337;padding:28px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:22px">Application Received</h1>
            </div>
            <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 16px">Hi <strong>${parent.firstName}</strong>,</p>
              <p style="margin:0 0 20px">We've received your tuition application and it's now under review. Here's a summary:</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
                <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Application ID</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${application.referenceNumber}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Student</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${student.firstName} ${student.lastName}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">School</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${catalogSchool?.name ?? manualSchoolName ?? "—"}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Repayment Plan</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${planLabel}</td></tr>
                <tr><td style="padding:10px 0;color:#881337;font-weight:bold;font-size:15px">Total Amount</td>
                    <td style="padding:10px 0;color:#881337;font-weight:bold;text-align:right;font-size:15px">${amountFormatted}</td></tr>
              </table>
              <div style="background:#fdf4f7;border-left:4px solid #881337;border-radius:6px;padding:14px 16px;margin-bottom:24px">
                <p style="margin:0;font-size:13px;color:#881337">
                  <strong>Status: Under Review</strong><br>
                  You'll receive another email once a decision has been made.
                </p>
              </div>
              <p style="font-size:13px;color:#6b7280;margin:0">
                If you have questions, reply to this email or contact support.<br><br>
                The SkulCredit Team
              </p>
            </div>
          </div>
        `,
        }).catch((err) =>
          logger.warn(
            `[parent.service] Parent confirmation email failed: ${(err as Error).message}`,
          ),
        );

        if (!isManualSchool && catalogSchool) {
          this._sendSchoolVerificationEmail({
            application,
            catalogSchool,
            partnerSchool,
            student,
            parent,
            parentEmail: user.email,
          }).catch((err) =>
            logger.warn(
              `[parent.service] School verification email failed: ${(err as Error).message}`,
            ),
          );
        }
      })
      .catch(() => {
        /* silent */
      });

    const now = new Date().toISOString();
    const stateMachine = buildInitialStateMachine(now);

    const ledger = await LoanLedger.create({
      loanApplicationId: application.id,
      lendsqrProductId: LENDSQR_PRODUCT_ID,
      bvnLast4: parent.bvn ? parent.bvn.slice(-4) : null,
      status: "INITIATED",
      stateMachine,
      statusHistory: [
        {
          status: "INITIATED" as const,
          timestamp: now,
          actor: "SYSTEM" as const,
          message: "Loan booking initiated via student details wizard",
        },
      ],
      settlement: {
        settledAt: null,
        settlementReference: null,
        status: "PENDING",
      },
      webhookPayloads: [],
      queuedAt: null,
    });

    if (parent.bvn) {
      const bookLoanPayload: BookLoanPayload = {
        bvn: parent.bvn,
        requested_amount: payload.tuitionAmount,
        proposed_tenor: payload.tenor,
        proposed_tenor_period: "months",
        purpose: `School Fees – ${payload.institutionTypeName} – ${payload.academicSession} ${payload.term}`,
        product_id: LENDSQR_PRODUCT_ID,
        disburse_to: "bank",
        location: parent.addressState ?? undefined,
      };

      await ledger.update({ queuedAt: new Date().toISOString() });

      await publishLoanBooking({
        loanApplicationId: application.id,
        loanLedgerId: ledger.id,
        bookLoanPayload,
      });

      logger.info(
        `[parent.service] Wizard loan booking queued | application=${application.id} | ledger=${ledger.id}`,
      );
    } else {
      logger.warn(
        `[parent.service] No BVN for parent ${parent.id} — wizard booking job skipped`,
      );
    }

    return {
      application,
      referenceNumber,
      tenor: effectiveTenor,
      termName: activeTerm.termName,
      termAcademicYear: activeTerm.sessionName,
      ledgerId: ledger.id,
      queued: !!parent.bvn,
    };
  }

  async confirmServiceCharge(
    userId: string,
    applicationId: string,
    paystackReference?: string,
  ): Promise<typeof LoanApplication.prototype> {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
    });
    if (!application) throw new ApiError(404, "Application not found");

    if (application.serviceFeePaid) {
      return application;
    }

    await application.update({ serviceFeePaid: true });

    await ApplicationEvent.create({
      loanApplicationId: application.id,
      actor: "parent",
      actorId: parent.id,
      status: "service_charge_paid",
      note: paystackReference
        ? `Service charge paid via Paystack (ref: ${paystackReference})`
        : "Service charge confirmed",
    });

    NotificationPublisher.general(
      userId,
      "Service Charge Paid",
      "Service charge paid — set up your repayment plan to complete the process.",
    );

    logger.info(
      `[parent.service] Service charge confirmed | application=${application.id} | ref=${paystackReference ?? "manual"}`,
    );

    return application;
  }

  getMandatePreview(
    tenor: number,
    totalAmount: number,
    debitDay: number,
  ): {
    installmentNumber: number;
    dueDate: string;
    amount: number;
    outstandingBalance: number;
  }[] {
    const clampedDay = Math.min(Math.max(Math.round(debitDay), 1), 28);
    const installmentAmount = Math.round(totalAmount / tenor);
    const lastInstallmentAmount = totalAmount - installmentAmount * (tenor - 1);

    const now = new Date();
    const baseMonth =
      now.getDate() >= clampedDay ? now.getMonth() + 1 : now.getMonth();
    const baseYear = now.getFullYear() + (baseMonth > 11 ? 1 : 0);
    const normalizedBaseMonth = baseMonth % 12;

    const preview: {
      installmentNumber: number;
      dueDate: string;
      amount: number;
      outstandingBalance: number;
    }[] = [];
    let outstandingBalance = totalAmount;

    for (let i = 0; i < tenor; i++) {
      const rawMonth = normalizedBaseMonth + i;
      const year = baseYear + Math.floor((normalizedBaseMonth + i) / 12);
      const month = rawMonth % 12;
      const isLast = i === tenor - 1;
      const amount = isLast ? lastInstallmentAmount : installmentAmount;
      outstandingBalance -= amount;

      const dueDate = new Date(year, month, clampedDay);
      preview.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split("T")[0],
        amount,
        outstandingBalance: Math.max(0, outstandingBalance),
      });
    }

    return preview;
  }

  async setupRepayment(
    userId: string,
    applicationId: string,
    opts: { debitDay?: number } = {},
  ): Promise<{
    application: typeof LoanApplication.prototype;
    schedule: (typeof RepaymentSchedule.prototype)[];
  }> {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
      include: [
        { model: Student, as: "student" },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          include: [{ model: SchoolBankAccount, as: "bankAccounts" }],
        },
        { model: School, as: "school" },
      ],
    });

    if (!application) throw new ApiError(404, "Application not found");

    if (!application.serviceFeePaid) {
      throw new ApiError(
        400,
        "Service charge must be paid before setting up a repayment plan.",
      );
    }

    const allowedStatuses: string[] = ["under_review", "approved"];
    if (!allowedStatuses.includes(application.status)) {
      throw new ApiError(
        400,
        `Cannot set up repayment: application is in '${application.status}' status.`,
      );
    }

    const existingSchedule = await RepaymentSchedule.findAll({
      where: { loanApplicationId: application.id },
    });
    if (existingSchedule.length > 0) {
      throw new ApiError(
        409,
        "Repayment schedule has already been set up for this application.",
      );
    }

    const tenor = application.tenor;
    const totalAmount = Number(
      application.amountApproved ?? application.amountRequested,
    );
    const debitDay = opts.debitDay
      ? Math.min(Math.max(Math.round(opts.debitDay), 1), 28)
      : 1;

    const preview = this.getMandatePreview(tenor, totalAmount, debitDay);

    const scheduleRecords: (typeof RepaymentSchedule.prototype)[] = [];

    for (const item of preview) {
      const record = await RepaymentSchedule.create({
        loanApplicationId: application.id,
        parentId: parent.id,
        installmentNumber: item.installmentNumber,
        dueDate: item.dueDate,
        principalAmount: item.amount,
        interestAmount: 0,
        totalAmount: item.amount,
        outstandingBalance: item.outstandingBalance,
        status: "upcoming",
      });
      scheduleRecords.push(record);
    }

    await application.update({
      status: "approved",
      decidedAt: new Date(),
      decidedBy: parent.id,
      mandateDebitDay: debitDay,
      mandateStatus: "pending",
    });

    await ApplicationEvent.create({
      loanApplicationId: application.id,
      actor: "parent",
      actorId: parent.id,
      status: "approved",
      note: `Repayment plan confirmed: ${tenor}-month schedule, debit day ${debitDay}, starting ${scheduleRecords[0]?.dueDate ?? "—"}`,
    });

    logger.info(
      `[parent.service] Repayment schedule created | application=${application.id} | installments=${tenor} | debitDay=${debitDay}`,
    );

    this._notifyFundingPartner(application, parent).catch((err) =>
      logger.warn(
        `[parent.service] Funding partner email failed: ${(err as Error).message}`,
      ),
    );

    const refreshed = await LoanApplication.findByPk(application.id);
    return {
      application: refreshed ?? application,
      schedule: scheduleRecords,
    };
  }

  private async _notifyFundingPartner(
    application: typeof LoanApplication.prototype,
    parent: { id: string; firstName: string; lastName: string },
  ): Promise<void> {
    const activePartners = await FundingPartner.findAll({
      where: { status: "active" },
    });

    const fallbackEmail = env.fundingPartner.email;
    const recipients: { email: string; name: string }[] = activePartners.length
      ? activePartners.map((p) => ({ email: p.email, name: p.name }))
      : fallbackEmail
        ? [{ email: fallbackEmail, name: env.fundingPartner.name }]
        : [];

    if (recipients.length === 0) {
      logger.warn(
        "[parent.service] No active funding partners and FUNDING_PARTNER_EMAIL not set — skipping notification",
      );
      return;
    }

    const app = await LoanApplication.findByPk(application.id, {
      include: [
        {
          model: Student,
          as: "student",
          include: [{ model: CatalogSchool, as: "school" }],
        },
        {
          model: CatalogSchool,
          as: "catalogSchool",
          include: [{ model: SchoolBankAccount, as: "bankAccounts" }],
        },
        { model: School, as: "school" },
      ],
    });
    if (!app) return;

    const frontendUrl = env.frontendUrl;
    const disbursementUrl = `${frontendUrl}/funding-partner/disbursement/${app.id}`;
    const loginThenDisbursement = `${frontendUrl}/auth?next=${encodeURIComponent(`/funding-partner/disbursement/${app.id}`)}`;

    const student = (
      app as unknown as {
        student?: {
          firstName?: string;
          lastName?: string;
          studentId?: string | null;
          gradeLevel?: string;
        };
      }
    ).student;
    const catalogSchool = (
      app as unknown as {
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
      }
    ).catalogSchool;
    const registeredSchool = (
      app as unknown as {
        school?: {
          bankName?: string | null;
          bankAccountName?: string | null;
          bankAccountNumber?: string | null;
          addressCity?: string | null;
          addressState?: string | null;
        };
      }
    ).school;

    const primaryBankAccount =
      catalogSchool?.bankAccounts?.find((b) => b.isPrimary) ??
      catalogSchool?.bankAccounts?.[0];
    const bankName =
      primaryBankAccount?.bankName ?? registeredSchool?.bankName ?? "N/A";
    const accountNumber =
      primaryBankAccount?.accountNumber ??
      registeredSchool?.bankAccountNumber ??
      "N/A";
    const accountName =
      primaryBankAccount?.accountName ??
      registeredSchool?.bankAccountName ??
      "N/A";

    const amountFmt = `₦${Number(app.amountRequested).toLocaleString("en-NG")}`;
    const serviceChargeFmt = app.serviceChargeAmount
      ? `₦${Number(app.serviceChargeAmount).toLocaleString("en-NG")}`
      : "N/A";
    const tenorLabel = `${app.tenor}-month plan`;

    const schedule = await RepaymentSchedule.findAll({
      where: { loanApplicationId: app.id },
      order: [["installment_number", "ASC"]],
    });

    const scheduleRows = schedule
      .map(
        (s) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">#${s.installmentNumber}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">${s.dueDate}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:bold">₦${Number(s.totalAmount).toLocaleString("en-NG")}</td>
          </tr>`,
      )
      .join("");

    const emailSubject = `Funding Request – ${catalogSchool?.name ?? "School"} – ${app.referenceNumber}`;
    const emailMessage = `A tuition financing application is ready for funding. Please review the details and confirm disbursement.`;

    for (const recipient of recipients) {
      await sendEmail({
        email: recipient.email,
        subject: emailSubject,
        message: emailMessage,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#333">
        <div style="background:#881337;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Funding Request Ready for Disbursement</h1>
          <p style="color:#fce7f3;margin:8px 0 0;font-size:14px">Application ${app.referenceNumber ?? app.id}</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 20px">Hello <strong>${recipient.name}</strong>,</p>
          <p style="margin:0 0 20px">
            A tuition financing application has been fully processed and is ready for disbursement.
            The parent has paid the service charge and confirmed their repayment plan.
            Please review the details below and action the disbursement.
          </p>

          <h2 style="font-size:15px;color:#881337;border-bottom:2px solid #fce7f3;padding-bottom:8px;margin-bottom:12px">Application Summary</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:45%">Application ID</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${app.referenceNumber ?? app.id}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Parent Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${parent.firstName} ${parent.lastName}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Student Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${student?.firstName ?? "—"} ${student?.lastName ?? ""}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Admission Number</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${student?.studentId ?? "N/A"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Grade / Level</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${student?.gradeLevel ?? "N/A"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">School</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${catalogSchool?.name ?? "N/A"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">School Tier</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${catalogSchool?.tier ? `Tier ${catalogSchool.tier}` : "N/A"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Repayment Plan</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${tenorLabel}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Service Charge Paid</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${serviceChargeFmt}</td></tr>
            <tr><td style="padding:10px 0;color:#881337;font-weight:bold;font-size:15px">Amount to Disburse</td>
                <td style="padding:10px 0;color:#881337;font-weight:bold;font-size:15px">${amountFmt}</td></tr>
          </table>

          <h2 style="font-size:15px;color:#881337;border-bottom:2px solid #fce7f3;padding-bottom:8px;margin-bottom:12px">School Bank Account Details</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:45%">Bank Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${bankName}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Account Number</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold">${accountNumber}</td></tr>
            <tr><td style="padding:10px 0;color:#6b7280;font-size:14px">Account Name</td>
                <td style="padding:10px 0;font-weight:bold">${accountName}</td></tr>
          </table>

          ${
            scheduleRows.length > 0
              ? `
          <h2 style="font-size:15px;color:#881337;border-bottom:2px solid #fce7f3;padding-bottom:8px;margin-bottom:12px">Parent Repayment Schedule</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <thead>
              <tr style="background:#fdf4f7">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#881337;text-transform:uppercase">Installment</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#881337;text-transform:uppercase">Due Date</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#881337;text-transform:uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>${scheduleRows}</tbody>
          </table>`
              : ""
          }

          <div style="background:#fdf4f7;border-left:4px solid #881337;border-radius:6px;padding:16px;margin-bottom:28px">
            <p style="margin:0;font-size:13px;color:#881337">
              <strong>Action Required:</strong> Transfer <strong>${amountFmt}</strong> to the school bank account above.
              Then confirm disbursement using one of the buttons below.
            </p>
          </div>

          <div style="text-align:center;margin-bottom:16px">
            <a href="${disbursementUrl}"
               style="display:inline-block;background:#16a34a;color:#fff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;margin-right:12px">
              ✓ Disbursement Complete
            </a>
          </div>

          <p style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:24px">
            Not logged in? <a href="${loginThenDisbursement}" style="color:#881337">Click here to log in</a> and you'll be redirected to this request automatically.
          </p>

          <hr style="border:none;border-top:1px solid #f3f4f6;margin-bottom:20px"/>
          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">
            This email is for application <strong>${app.referenceNumber ?? app.id}</strong>.
            If you have any questions, contact the SkulCredit operations team.
          </p>
        </div>
      </div>`,
      });
      logger.info(
        `[parent.service] Funding partner email sent to ${recipient.email} for application ${app.id}`,
      );
    }
  }

  private async _sendSchoolVerificationEmail(args: {
    application: typeof LoanApplication.prototype;
    catalogSchool: typeof CatalogSchool.prototype;
    partnerSchool: typeof School.prototype | null;
    student: typeof Student.prototype;
    parent: { id: string; firstName: string; lastName: string };
    parentEmail: string;
  }): Promise<void> {
    const { application, catalogSchool, partnerSchool, student, parent } = args;

    const amountFormatted = `₦${Number(application.amountRequested).toLocaleString("en-NG")}`;
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

    const applicationDetailsHtml = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Parent Request</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">Requesting to pay child school fees</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Parent Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${parent.firstName} ${parent.lastName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Student</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${student.firstName} ${student.lastName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Admission Number</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${student.studentId ?? "N/A"}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">School Fees Amount</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right;color:#881337">${amountFormatted}</td></tr>
        <tr><td style="padding:10px 0;color:#6b7280;font-size:14px">Application ID</td>
            <td style="padding:10px 0;font-weight:bold;text-align:right">${application.referenceNumber}</td></tr>
      </table>
    `;

    if (partnerSchool) {
      const schoolUser = await User.findOne({
        where: { id: partnerSchool.userId },
        attributes: ["email"],
      });
      if (!schoolUser?.email) {
        logger.warn(
          `[parent.service] School user ${partnerSchool.userId} has no email for school ${partnerSchool.id}`,
        );
        return;
      }

      const verifyLink = `${frontendUrl}/school/applications?highlight=${application.id}`;
      const loginThenVerifyLink = `${frontendUrl}/auth/school?next=${encodeURIComponent("/school/applications")}`;

      await sendEmail({
        email: schoolUser.email,
        subject: `SkulCredit: Parent Application Verification Required – ${application.referenceNumber}`,
        message: `A parent has applied to pay school fees for a student at your school. Please log in to verify.`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#333">
          <div style="background:#881337;padding:28px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">New Parent Application — Action Required</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 12px">Hello <strong>${catalogSchool.name}</strong>,</p>
            <p style="margin:0 0 20px">
              A parent has submitted a tuition financing application for a student at your school through <strong>SkulCredit</strong>.
              Please review the details below and confirm or reject the application.
            </p>
            ${applicationDetailsHtml}
            <div style="margin:24px 0;text-align:center">
              <a href="${verifyLink}"
                 style="display:inline-block;background:#881337;color:#fff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">
                Review &amp; Verify Application
              </a>
            </div>
            <p style="font-size:12px;color:#6b7280;margin:0 0 8px">
              Not logged in? <a href="${loginThenVerifyLink}" style="color:#881337">Click here to log in</a> — after login you'll be redirected automatically to this application.
            </p>
            <p style="font-size:12px;color:#9ca3af;margin:0">
              This link is specific to application <strong>${application.referenceNumber}</strong>. If you have questions, contact SkulCredit support.
            </p>
          </div>
        </div>
        `,
      });

      logger.info(
        `[parent.service] School verification email sent to registered school ${partnerSchool.id} (${schoolUser.email})`,
      );

      NotificationPublisher.newApplicationForSchool(
        partnerSchool.userId,
        application.id,
        `${parent.firstName} ${parent.lastName}`,
        `${student.firstName} ${student.lastName}`,
        Number(application.amountRequested),
      );
    } else {
      const schoolRequest = await SchoolRequest.findOne({
        where: { parentId: parent.id, schoolName: catalogSchool.name },
        order: [["createdAt", "DESC"]],
      });

      const contactEmail = schoolRequest?.contactEmail;
      if (!contactEmail) {
        logger.warn(
          `[parent.service] No contact email for non-registered school "${catalogSchool.name}" (parentId=${parent.id})`,
        );
        return;
      }

      await sendEmail({
        email: contactEmail,
        subject: `SkulCredit: Tuition Financing Application for a Student at Your School`,
        message: `A parent has applied to pay school fees for a student at your school through SkulCredit.`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#333">
          <div style="background:#881337;padding:28px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">Tuition Financing Notification</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 12px">Hello,</p>
            <p style="margin:0 0 20px">
              A parent has applied to pay school fees for a student at <strong>${catalogSchool.name}</strong> through <strong>SkulCredit</strong>, a school fee financing platform.
              The details of the application are below. Our team will be in touch to guide your school through the verification process.
            </p>
            ${applicationDetailsHtml}
            <div style="background:#fdf4f7;border-left:4px solid #881337;border-radius:6px;padding:14px 16px;margin:24px 0">
              <p style="margin:0;font-size:13px;color:#881337">
                <strong>Next Steps:</strong><br>
                A SkulCredit representative will contact you at this email to verify the student's enrollment and fee details before any funds are disbursed.
              </p>
            </div>
            <p style="font-size:13px;color:#6b7280;margin:0">
              For questions, please reply to this email or call the SkulCredit support line.<br><br>
              The SkulCredit Team
            </p>
          </div>
        </div>
        `,
      });

      logger.info(
        `[parent.service] School verification email sent to non-registered school contact ${contactEmail}`,
      );
    }
  }
}

export default new ParentService();
