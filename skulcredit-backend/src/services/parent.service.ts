import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { ParentRepository, UserRepository } from "../repositories";
import sendEmail from "../utils/email";
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
} from "../models/index";
import ApiError from "../utils/apiError";
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
    return parent.update(profileData);
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
    });
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
      await user.update({ isActive: false });
      logger.warn(
        `Loan score FAILED for userId=${userId} — decision="${dd?.decision}" — account deactivated.`,
      );
    }

    return {
      pass,
      decision: dd?.decision ?? "unknown",
      creditScore: scoreRes.data?.credit_score ?? "0%",
      advisoryAmount: dd?.advisory_amount ?? 0,
    };
  }

  async addStudent(userId: string, studentData: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const school = await CatalogSchool.findByPk(studentData.schoolId as string);
    if (!school) throw new ApiError(404, "School not found");
    if (!school.isActive)
      throw new ApiError(400, "School is not currently active");

    return Student.create({
      parentId: parent.id,
      tuitionAmount: 0,
      ...studentData,
    } as never);
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
      throw new ApiError(
        400,
        "You already have a pending request for a school with this name",
      );
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
      where: { schoolName: catalogSchoolForWizard.name, status: "approved" },
    });

    let photoUrl: string | null = parent.profilePhotoUrl ?? null;

    if (payload.photo) {
      const file = payload.photo;
      const filePath = `uploads/photos/${file.filename}`;
      const publicUrl = `${process.env.APP_URL?.replace(/\/$/, "") ?? ""}/${filePath}`;
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
      const publicUrl = `${process.env.APP_URL?.replace(/\/$/, "") ?? ""}/${filePath}`;

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

    const catalogSchool = await CatalogSchool.findByPk(payload.schoolId);
    if (!catalogSchool) throw new ApiError(404, "School not found");
    if (!catalogSchool.isActive)
      throw new ApiError(400, "School is not currently active");

    const partnerSchool = await School.findOne({
      where: { schoolName: catalogSchool.name, status: "approved" },
    });

    // ── Duplicate application guard — one application per student per term ───
    // A "term" is a rolling 4-month window anchored to the calendar year:
    //   Term 1: Jan–Apr  |  Term 2: May–Aug  |  Term 3: Sep–Dec
    const checkTime = new Date();
    const termMonthStart = Math.floor(checkTime.getMonth() / 4) * 4; // 0, 4, or 8
    const termStart = new Date(checkTime.getFullYear(), termMonthStart, 1);
    const termEnd = new Date(checkTime.getFullYear(), termMonthStart + 4, 1);

    const existingApplication = await LoanApplication.findOne({
      where: {
        studentId: student.id,
        // Guard is per-student per-term regardless of school —
        // a student's fees can only be financed once per term
        status: { [Op.notIn]: ["rejected", "cancelled"] },
        createdAt: { [Op.gte]: termStart, [Op.lt]: termEnd },
      },
    });

    if (existingApplication) {
      throw new ApiError(
        409,
        `You've already submitted an application for ${student.firstName} ${student.lastName} this term. A student's fees can only be financed once per term.`,
      );
    }

    const referenceNumber = `SKC-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    const application = await LoanApplication.create({
      referenceNumber,
      parentId: parent.id,
      studentId: student.id,
      catalogSchoolId: payload.schoolId,
      schoolId: partnerSchool?.id ?? null,
      amountRequested: payload.tuitionAmount,
      tenor: payload.tenor,
      status: "pending",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    // ── Email notification ────────────────────────────────────────────────────
    // Fire-and-forget — don't block the response if email fails
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
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${catalogSchool.name}</td></tr>
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
            `[parent.service] Email send failed: ${(err as Error).message}`,
          ),
        );
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
      ledgerId: ledger.id,
      queued: !!parent.bvn,
    };
  }
}

export default new ParentService();
