import bcrypt from "bcryptjs";
import { Op, UniqueConstraintError } from "sequelize";
import { ParentRepository, UserRepository } from "../repositories";
import emailService from "../emails/email.service";
import schoolTermService from "./schoolTerm.service";
import { formatNaira, formatTenorLabel } from "../utils/format";
import { generateReference } from "../utils/reference";
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
  Repayment,
  SchoolBankAccount,
  FundingPartner,
} from "../models/index";
import ApiError from "../utils/apiError";
import env from "../config/env";
import paystackService from "../integrations/paystack/paystack.service";
import aletpayService from "../integrations/aletpay/aletpay.service";
import lendsqrCustomerService from "../integrations/lendsqr/customer.service";
import directDebitService from "../integrations/lendsqr/directDebit.service";
import identityService, {
  NinVerificationResponse,
  BvnVerificationData,
} from "../integrations/lendsqr/identity.service";
import logger from "../config/logger";
import storageService from "../storage/storage.service";
import type { DocumentCreationAttributes } from "../models/Document";
import { buildInitialStateMachine } from "../models/LoanLedger";
import { publishLoanBooking } from "../queues/loan.queue";
import type { BookLoanPayload } from "../integrations/lendsqr/application.service";
import applicationService from "../integrations/lendsqr/application.service";
import { evaluateCreditScore } from "../credit/creditPolicy";
import eventNotifier from "../notifications/event.notifier";

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
    eventNotifier.notifyProfileUpdated(userId);
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
      bvnPhoneNumber?: string;
      employerName?: string;
      spouseFullName?: string;
      spouseEmail?: string;
      spousePhone?: string;
      spouseEmployerType?: string;
      documents?: Array<{ url: string; type_id: number; sub_type_id?: number }>;
      relationship?: string;
      employerType?: string;
      yearsInRole?: string;
      monthlyIncome?: string;
    },
  ) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const updated = await parent.update({
      bvn: kycData.bvn ?? parent.bvn,
      nin: kycData.nin ?? parent.nin,
      dob: kycData.dob ?? null,
      addressState: kycData.state ?? null,
      addressLga: kycData.lga ?? null,
      addressCity: kycData.city ?? null,
      addressStreet: kycData.address ?? null,
      profilePhotoUrl: kycData.photoUrl ?? null,
      kycStatus: "approved",
      lendsqrCustomerId: parent.lendsqrCustomerId,
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
      ...(kycData.accountNumber !== undefined && {
        bankAccountNumber: kycData.accountNumber,
      }),
      ...(kycData.bankCode !== undefined && {
        bankCode: kycData.bankCode,
      }),
      ...(kycData.bvnPhoneNumber !== undefined && {
        bvnPhoneNumber: kycData.bvnPhoneNumber,
      }),
      ...(kycData.employerName !== undefined && {
        employerName: kycData.employerName,
      }),
      ...(kycData.spouseFullName !== undefined && {
        spouseFullName: kycData.spouseFullName,
      }),
      ...(kycData.spouseEmail !== undefined && {
        spouseEmail: kycData.spouseEmail,
      }),
      ...(kycData.spousePhone !== undefined && {
        spousePhone: kycData.spousePhone,
      }),
      ...(kycData.spouseEmployerType !== undefined && {
        spouseEmployerType: kycData.spouseEmployerType,
      }),
    });

    // Persist KYC documents to the documents table (JSON flow)
    if (kycData.documents && kycData.documents.length > 0) {
      for (const doc of kycData.documents) {
        await Document.create({
          parentId: parent.id,
          category: "kyc_document",
          fileUrl: doc.url,
          filePath: doc.url,
          lendsqrTypeId: doc.type_id,
          lendsqrSubTypeId: doc.sub_type_id ?? null,
        } as never);
      }
    }

    // Adjutor customer registration (non-blocking)
    try {
      const isRegistered = parent.lendsqrCustomerId && parent.lendsqrCustomerId !== "registered";
      if (!isRegistered) {
        const user = await UserRepository.findOne({ id: userId });
        if (user) {
          const rawPhone = user.phoneNumber ?? "";
          const phone234 = rawPhone.startsWith("0")
            ? "234" + rawPhone.slice(1)
            : rawPhone.startsWith("+")
            ? rawPhone.slice(1)
            : rawPhone;
          const adjutorPayload = {
            phone_number: phone234,
            email: user.email,
            bvn: kycData.bvn ?? parent.bvn ?? undefined,
            bvn_phone_number: kycData.bvnPhoneNumber,
            dob: kycData.dob,
            account_number: kycData.accountNumber,
            bank_code: kycData.bankCode,
            city: kycData.city,
            address: kycData.address,
            state: kycData.state,
            photo_url: kycData.photoUrl,
            documents: kycData.documents?.map((d) => ({
              url: d.url,
              type_id: d.type_id,
              sub_type_id: d.sub_type_id,
            })),
          };
          const response = await lendsqrCustomerService.createCustomer(adjutorPayload) as any;
          const adjutorId =
            response?.data?.users?.[0]?.id ??
            response?.data?.id ??
            response?.data?.user?.id;
          if (adjutorId != null) {
            await lendsqrCustomerService.activateCustomer(adjutorId);
            await parent.update({ lendsqrCustomerId: String(adjutorId) });
            logger.info(`Adjutor customer registered and activated for parent ${parent.id}: adjutorId=${adjutorId}`);
          } else {
            logger.warn(`Adjutor customer created but no ID returned for parent ${parent.id}`);
          }
        }
      }
    } catch (adjutorErr) {
      logger.error(`Adjutor registration failed for parent ${parent.id} (non-fatal): ${adjutorErr}`);
    }

    eventNotifier.notifyKycVerified(userId);

    return updated;
  }

  async verifyNin(nin: string): Promise<NinVerificationResponse["data"]> {
    const response = await identityService.verifyNin(nin);
    if (response.status !== "success" || !response.data) {
      throw new ApiError(400, "NIN verification failed");
    }
    return response.data;
  }

  async initBvnConsent(bvn: string, contact: string): Promise<{ maskedContact: string }> {
    const response = await identityService.initBvnConsent(bvn, contact);
    if (response.status !== "otp") {
      throw new ApiError(400, response.message ?? "Failed to send OTP");
    }
    return { maskedContact: response.data };
  }

  async completeBvnConsent(bvn: string, otp: string): Promise<BvnVerificationData> {
    const response = await identityService.completeBvnConsent(bvn, otp);
    if (response.status !== "success" || !response.data) {
      throw new ApiError(400, response.message ?? "BVN consent verification failed");
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
      return evaluateCreditScore(null);
    }

    const evaluation = evaluateCreditScore(scoreRes.data);

    if (!evaluation.pass) {
      const nextTerm = await schoolTermService.getNextTerm();
      const blockedUntil = nextTerm?.portalOpeningDate ?? null;
      await parent.update({ eligibilityBlockedUntil: blockedUntil });
      logger.warn(
        `Loan score FAILED for userId=${userId} — decision="${evaluation.decision}" — blocked until ${blockedUntil ?? "next term"}.`,
      );
    }

    return evaluation;
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
    eventNotifier.notifyStudentAdded(userId, `${studentData.firstName} ${studentData.lastName}`);
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
          attributes: [
            "id",
            "name",
            "isRegistered",
            "tier",
            "isActive",
            "serviceChargeRate",
          ],
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
          attributes: [
            "id",
            "name",
            "isRegistered",
            "tier",
            "isActive",
            "serviceChargeRate",
          ],
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

  async getApplications(
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
  ) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await LoanApplication.findAndCountAll({
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
      limit: Number(limit),
      offset,
    });

    return {
      applications: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
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
      // Upload to Cloudinary with deterministic public_id so re-uploads overwrite
      const photoResult = await storageService.uploadBuffer(
        file.buffer,
        file.originalname,
        'skulcredit_photos',
        { public_id: `skulcredit_photos/parent_${userId}`, overwrite: true },
      );
      const existingPhoto = await Document.findOne({
        where: { parentId: parent.id, category: "photo" },
      });
      if (existingPhoto) {
        // Guard against pre-migration rows that hold a local path (e.g. 'uploads/photos/abc.jpg').
        // Cloudinary public_ids never start with 'uploads/', so skip deletion for legacy records.
        const currentPath = existingPhoto.filePath as string | null;
        if (currentPath && !currentPath.startsWith('uploads/') && !currentPath.startsWith('/uploads/')) {
          await storageService.deleteFile(currentPath);
        }
        await existingPhoto.update({
          filePath: photoResult.publicId,
          fileUrl: photoResult.publicUrl,
        });
      } else {
        await Document.create({
          parentId: parent.id,
          category: "photo",
          docType: "Profile Photo",
          filePath: photoResult.publicId,
          fileUrl: photoResult.publicUrl,
          mimeType: file.mimetype,
          fileSize: file.size,
          lendsqrTypeId: 1,
          lendsqrSubTypeId: null,
        } as DocumentCreationAttributes);
      }

      photoUrl = photoResult.publicUrl;
    }

    const uploadedDocUrls: Array<{
      url: string;
      type_id: number;
      sub_type_id?: number;
    }> = [];

    for (const doc of payload.kycDocuments) {
      const docResult = await storageService.uploadMulterFile(doc, 'skulcredit_documents');

      await Document.create({
        parentId: parent.id,
        category: "kyc_document",
        docType: doc.docType,
        filePath: docResult.publicId,
        fileUrl: docResult.publicUrl,
        mimeType: doc.mimetype,
        fileSize: doc.size,
        lendsqrTypeId: doc.lendsqrTypeId ?? 1,
        lendsqrSubTypeId: doc.lendsqrSubTypeId ?? null,
      } as DocumentCreationAttributes);

      uploadedDocUrls.push({
        url: docResult.publicUrl,
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
      await parent.update({
        bvn: payload.bvn ?? parent.bvn,
        nin: payload.nin ?? parent.nin,
        kycStatus: "approved",
        lendsqrCustomerId: "registered",
      });
    }

    const freshParent = await ParentRepository.findOne({ userId }, {
      scope: "withSensitive",
    } as never);

    const activeTerm = await schoolTermService.getActiveTerm();

    if (!activeTerm) {
      throw new ApiError(
        403,
        "The application portal is currently closed. Please check back when the next school term opens.",
      );
    }

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
          `An application for ${student.firstName} ${student.lastName} already exists this term (${activeTerm.termName} ${activeTerm.sessionName}). A student's fees can only be financed once per term.`,
        );
      }

      const referenceNumber = generateReference();

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
          `[parent.service] No BVN for parent ${parent.id} � loan booking job skipped for application ${application.id}`,
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
      repaymentPlanId: "full" | "2month" | "3month" | "6month";
      tenor: number;
      academicSession?: string;
      term?: string;
    },
  ) {
    const parent = await ParentRepository.findOne({ userId }, {
      scope: "withSensitive",
    } as never);
    if (!parent) throw new ApiError(404, "Parent profile not found");

    // Build a detailed list of what is missing so the parent knows exactly what to fix
    if (parent.kycStatus !== "approved") {
      const missing: string[] = [];

      if (!parent.bvn && !parent.nin)
        missing.push("BVN or NIN verification");
      if (!parent.dob)
        missing.push("Date of birth");
      if (!parent.addressState || !parent.addressCity || !parent.addressStreet)
        missing.push("Residential address (state, city, street)");
      if (!parent.profilePhotoUrl)
        missing.push("Profile photo");
      if (!parent.relationship)
        missing.push("Relationship to student");
      if (!parent.employerType)
        missing.push("Employment type");
      if (!parent.yearsInRole)
        missing.push("Years in current role");
      if (!parent.monthlyIncome)
        missing.push("Monthly income range");
      if (!parent.bankAccountNumber || !parent.bankCode)
        missing.push("Bank account details (account number and bank)");

      const missingMsg =
        missing.length > 0
          ? ` Missing: ${missing.join("; ")}.`
          : "";

      throw new ApiError(
        400,
        `KYC not completed. Please complete the eligibility test before applying.${missingMsg}`,
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

    const referenceNumber = generateReference();

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
        const planLabel      = formatTenorLabel(payload.tenor);
        const amountFormatted = formatNaira(payload.tuitionAmount);

        emailService.sendApplicationReceived({
          email:           user.email,
          parentName:      parent.firstName,
          referenceNumber: application.referenceNumber ?? "",
          studentName:     `${student.firstName} ${student.lastName}`,
          schoolName:      catalogSchool?.name ?? manualSchoolName ?? "—",
          repaymentPlan:   planLabel,
          totalAmount:     amountFormatted,
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
        purpose: `School Fees � ${payload.institutionTypeName} � ${payload.academicSession} ${payload.term}`,
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
        `[parent.service] No BVN for parent ${parent.id} � wizard booking job skipped`,
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
    transactionReference?: string,
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
      note: transactionReference
        ? `Service charge paid via Aletpay (bank transfer) (ref: ${transactionReference})`
        : "Service charge confirmed",
    });

    eventNotifier.notifyServiceChargePaid(userId, application.id);

    logger.info(
      `[parent.service] Service charge confirmed | application=${application.id} | ref=${transactionReference ?? "manual"}`,
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
      note: `Repayment plan confirmed: ${tenor}-month schedule, debit day ${debitDay}, starting ${scheduleRecords[0]?.dueDate ?? "�"}`,
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
        "[parent.service] No active funding partners and FUNDING_PARTNER_EMAIL not set � skipping notification",
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

    const amountFmt       = formatNaira(app.amountRequested);
    const serviceChargeFmt = app.serviceChargeAmount ? formatNaira(app.serviceChargeAmount) : "N/A";
    const tenorLabel      = formatTenorLabel(app.tenor);

    const schedule = await RepaymentSchedule.findAll({
      where: { loanApplicationId: app.id },
      order: [["installment_number", "ASC"]],
    });

    const scheduleRows = schedule.map((s) => ({
      installment: s.installmentNumber,
      dueDate:     String(s.dueDate),
      amount:      formatNaira(s.totalAmount),
    }));

    for (const recipient of recipients) {
      await emailService.sendFundingRequest({
        email:            recipient.email,
        recipientName:    recipient.name,
        referenceNumber:  app.referenceNumber ?? app.id,
        parentName:       `${parent.firstName} ${parent.lastName}`,
        studentName:      `${student?.firstName ?? "—"} ${student?.lastName ?? ""}`,
        admissionNumber:  student?.studentId ?? "N/A",
        gradeLevel:       student?.gradeLevel ?? "N/A",
        schoolName:       catalogSchool?.name ?? "N/A",
        schoolTier:       catalogSchool?.tier ? `Tier ${catalogSchool.tier}` : "N/A",
        repaymentPlan:    tenorLabel,
        serviceChargePaid: serviceChargeFmt,
        amountToDisburse: amountFmt,
        bankName:         bankName,
        accountNumber:    accountNumber,
        accountName:      accountName,
        scheduleRows,
        adminLink:        disbursementUrl,
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

    const amountFormatted = formatNaira(application.amountRequested);
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

      await emailService.sendSchoolVerificationRegistered({
        email:           schoolUser.email,
        schoolName:      catalogSchool.name,
        studentName:     `${student.firstName} ${student.lastName}`,
        admissionNumber: student.studentId ?? "N/A",
        gradeLevel:      student.gradeLevel ?? "N/A",
        parentName:      `${parent.firstName} ${parent.lastName}`,
        tuitionAmount:   formatNaira(application.amountRequested),
        referenceNumber: application.referenceNumber ?? "",
        verifyLink,
        loginLink:       loginThenVerifyLink,
      });

      logger.info(
        `[parent.service] School verification email sent to registered school ${partnerSchool.id} (${schoolUser.email})`,
      );

      eventNotifier.notifyNewApplicationForSchool(
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

      await emailService.sendSchoolVerificationUnregistered({
        email:           contactEmail,
        schoolName:      catalogSchool.name,
        studentName:     `${student.firstName} ${student.lastName}`,
        admissionNumber: student.studentId ?? "N/A",
        gradeLevel:      student.gradeLevel ?? "N/A",
        parentName:      `${parent.firstName} ${parent.lastName}`,
        tuitionAmount:   formatNaira(application.amountRequested),
        referenceNumber: application.referenceNumber ?? "",
      });

      logger.info(
        `[parent.service] School verification email sent to non-registered school contact ${contactEmail}`,
      );
    }
  }

  /**
   * Records a repayment installment payment.
   * Verifies via Aletpay for bank-transfer payments.
   * Card payments use a CARD-{timestamp} synthetic reference that bypasses
   * Aletpay verification; amount is derived from the selected schedule rows.
   */
  async payInstallment(
    userId: string,
    applicationId: string,
    payload: {
      transactionReference?: string;
      paystackReference?: string;
      scheduleIds: string[];
      type: "scheduled" | "early_partial" | "early_full";
    },
  ) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
    });
    if (!application) throw new ApiError(404, "Application not found");

    // Resolve the reference — prefer Aletpay transactionReference, fall back to legacy paystackReference
    const ref = payload.transactionReference ?? payload.paystackReference;
    if (!ref) throw new ApiError(400, "A transaction reference is required");

    let amountPaid: number;

    // ── Step 1: fetch schedules early so the expected amount is available
    //   for both the Aletpay tolerance check and the CARD-* fallback.
    const schedules = await RepaymentSchedule.findAll({
      where: {
        id: { [Op.in]: payload.scheduleIds },
        loanApplicationId: applicationId,
        parentId: parent.id,
      },
    });

    if (schedules.length === 0) {
      throw new ApiError(404, "No matching schedule installments found");
    }

    const expectedTotal = schedules.reduce(
      (sum, s) => sum + Number(s.totalAmount ?? 0),
      0,
    );

    if (ref.startsWith("CARD-")) {
      // Synthetic card reference — skip Aletpay; amount derived from schedules below
      amountPaid = 0;
    } else {
      const txn = await aletpayService.getTransaction(ref);
      const txnStatus = String(txn.status ?? "").toLowerCase();
      if (txnStatus !== "successful") {
        throw new ApiError(
          400,
          `Payment verification failed — transaction status: ${txn.status}`,
        );
      }
      amountPaid = Number(txn.amountSent ?? (txn as Record<string, unknown>).amount ?? 0);

      // ── Finding #2: tolerance check — reject if transferred amount differs
      //   from expected schedule total by more than ₦1.
      if (amountPaid > 0 && Math.abs(amountPaid - expectedTotal) > 1) {
        throw new ApiError(
          400,
          `Amount transferred (₦${amountPaid.toLocaleString()}) does not match the expected repayment total (₦${expectedTotal.toLocaleString()}). Please contact support if the funds have already left your account.`,
        );
      }
    }

    // If Aletpay returned zero amount (or card payment), derive from schedules
    if (amountPaid === 0) {
      amountPaid = expectedTotal;
    }

    // ── Finding #1: idempotency guard — use findOrCreate so a race between
    //   the 30-second auto-poll and a manual button tap never causes a
    //   UniqueConstraintError on paystackReference.
    let repayment: Repayment;
    try {
      const [record] = await Repayment.findOrCreate({
        where: { paystackReference: ref },
        defaults: {
          loanApplicationId: applicationId,
          parentId: parent.id,
          repaymentScheduleId: schedules.length === 1 ? schedules[0].id : null,
          amount: amountPaid,
          currency: "NGN",
          paymentMethod: ref.startsWith("CARD-") ? "card" : "bank_transfer",
          status: "successful",
          paidAt: new Date(),
          paystackReference: ref,
          type: payload.type,
        } as never,
      });
      repayment = record;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        // Another concurrent request already created this repayment — fetch it.
        const existing = await Repayment.findOne({ where: { paystackReference: ref } });
        if (!existing) throw new ApiError(500, "Repayment reference conflict; please try again.");
        repayment = existing;
      } else {
        throw err;
      }
    }

    for (const schedule of schedules) {
      await schedule.update({
        status: "paid",
        paidAt: new Date(),
        amountPaid: Number(schedule.totalAmount),
      });
    }

    const remaining = await RepaymentSchedule.count({
      where: {
        loanApplicationId: applicationId,
        status: { [Op.notIn]: ["paid", "waived"] },
      },
    });

    if (remaining === 0) {
      await application.update({ status: "repaid" });
      await ApplicationEvent.create({
        loanApplicationId: applicationId,
        actor: "parent",
        actorId: parent.id,
        status: "repaid",
        note: `All installments cleared. Final payment ref: ${ref}`,
      });
    } else {
      await ApplicationEvent.create({
        loanApplicationId: applicationId,
        actor: "parent",
        actorId: parent.id,
        status: application.status,
        note: `Payment of ${amountPaid} recorded. Ref: ${ref}. ${remaining} installment(s) remaining.`,
      });
    }

    logger.info(
      `[parent.service] Repayment recorded | application=${applicationId} | ref=${ref} | amount=${amountPaid}`,
    );

    return repayment;
  }

  async createMandateForApplication(
    userId: string,
    applicationId: string,
    debitDay?: number,
  ) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");
    if (!parent.lendsqrCustomerId || parent.lendsqrCustomerId === "registered") {
      throw new ApiError(400, "Parent is not registered in Adjutor — complete KYC first");
    }
    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
    });
    if (!application) throw new ApiError(404, "Loan application not found");
    if (!parent.bankAccountNumber || !parent.bankCode) {
      throw new ApiError(400, "Parent bank account details are incomplete");
    }
    const mandateRes = await directDebitService.createMandate({
      account_number: parent.bankAccountNumber,
      bank_code: parent.bankCode,
      amount: Number(application.amountApproved ?? application.amountRequested),
      start_date: new Date().toISOString().split("T")[0],
      user_id: parent.lendsqrCustomerId,
    }) as any;
    const mandateId =
      mandateRes?.data?.id ?? mandateRes?.id;
    const mandateRef =
      mandateRes?.data?.reference ?? mandateRes?.reference ?? null;
    await application.update({
      adjutorMandateId: mandateId != null ? String(mandateId) : null,
      mandateReference: mandateRef,
      mandateStatus: "pending",
      ...(debitDay != null && { mandateDebitDay: debitDay }),
    });
    return application;
  }

  async getMandatesForParent(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");
    if (!parent.lendsqrCustomerId || parent.lendsqrCustomerId === "registered") {
      throw new ApiError(400, "Parent is not registered in Adjutor");
    }
    return directDebitService.getMandates(parent.lendsqrCustomerId);
  }

  async updateMandateStatus(
    userId: string,
    applicationId: string,
    action: "activate" | "deactivate" | "cancel",
  ) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");
    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
    });
    if (!application) throw new ApiError(404, "Loan application not found");
    if (!application.adjutorMandateId) {
      throw new ApiError(400, "No mandate found for this application");
    }
    if (action === "activate") {
      await directDebitService.activateMandate(application.adjutorMandateId);
      await application.update({ mandateStatus: "active" });
    } else if (action === "deactivate") {
      await directDebitService.deactivateMandate(application.adjutorMandateId);
      await application.update({ mandateStatus: "pending" });
    } else {
      await directDebitService.cancelMandate(application.adjutorMandateId);
      await application.update({ mandateStatus: "cancelled" });
    }
    return application;
  }
}
export default new ParentService();
