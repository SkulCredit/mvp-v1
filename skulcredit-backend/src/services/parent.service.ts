import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { ParentRepository, UserRepository } from "../repositories";
import {
  Student,
  LoanApplication,
  Document,
  School,
  SchoolRequest,
  ApplicationEvent,
  User,
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
      bvn: string;
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

    const bvnResponse = (await identityService.verifyBvn(kycData.bvn)) as {
      data?: { status?: string };
    };
    if (!bvnResponse?.data || bvnResponse.data.status !== "successful") {
      throw new ApiError(400, "BVN verification failed");
    }

    const customerPayload: CustomerPayload = {
      phone_number: user!.phoneNumber ?? "",
      email: user!.email,
      bvn: kycData.bvn,
      bvn_phone_number: user!.phoneNumber ?? "",
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
    const lendsqrUser = lendsqrResponse.data?.users?.[0];
    if (!lendsqrUser)
      throw new ApiError(502, "Lendsqr customer registration failed");

    return parent.update({
      bvn: kycData.bvn,
      nin: kycData.nin ?? null,
      dob: kycData.dob ?? null,
      addressState: kycData.state ?? null,
      addressLga: kycData.lga ?? null,
      addressCity: kycData.city ?? null,
      addressStreet: kycData.address ?? null,
      profilePhotoUrl: kycData.photoUrl ?? null,
      kycStatus: "approved",
      lendsqrCustomerId: String(lendsqrUser.id),
    });
  }

  async verifyNin(nin: string): Promise<NinVerificationResponse["data"]> {
    const response = await identityService.verifyNin(nin);
    if (response.status !== "success" || !response.data) {
      throw new ApiError(400, "NIN verification failed");
    }
    return response.data;
  }

  async addStudent(userId: string, studentData: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    const school = await School.findByPk(studentData.schoolId as string);
    if (!school) throw new ApiError(404, "School not found");
    if (school.status !== "approved")
      throw new ApiError(400, "School is not an active partner");

    return Student.create({ parentId: parent.id, ...studentData } as never);
  }

  async getStudents(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, "Parent profile not found");

    return Student.findAll({
      where: { parentId: parent.id },
      include: [
        {
          model: School,
          as: "school",
          attributes: ["id", "schoolName", "addressCity", "addressState"],
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
          model: School,
          as: "school",
          attributes: ["id", "schoolName", "addressCity", "addressState"],
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
      const school = await School.findByPk(data.schoolId as string);
      if (!school) throw new ApiError(404, "School not found");
      if (school.status !== "approved")
        throw new ApiError(400, "School is not an active partner");
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
        { model: School, as: "school", attributes: ["id", "schoolName"] },
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
          model: School,
          as: "school",
          attributes: ["id", "schoolName", "addressCity", "addressState"],
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
              { model: School, as: "school", attributes: ["id", "schoolName"] },
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
      // ── Step 1 ────
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
      // ── Step 1 photo (multer file) ────
      photo?: Express.Multer.File;
      // ── Step 2 ────
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
      // ── Step 3 ────
      schoolId: string;
      institutionType: string;
      gradeLevel: string;
      repaymentPlan: string;
      academicSession: string;
      tuitionAmount: number;
      tenor: number;
      // ── Step 4 ────
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

    const school = await School.findByPk(payload.schoolId);
    if (!school) throw new ApiError(404, "School not found");
    if (school.status !== "approved")
      throw new ApiError(400, "School is not an active partner");

    // ── 1. Save profile photo to local disk ──────────────────────────────────
    let photoUrl: string | null = parent.profilePhotoUrl ?? null;

    if (payload.photo) {
      const file = payload.photo;
      // multer diskStorage already wrote the file — derive the paths
      const filePath = `uploads/photos/${file.filename}`;
      const publicUrl = `${process.env.APP_URL?.replace(/\/$/, "") ?? ""}/${filePath}`;

      // Upsert: delete old file + DB row if one already exists
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

    // ── 2. Save KYC documents to local disk ──────────────────────────────────
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

    // ── 3. Save parent profile ────────────────────────────────────────────────
    await parent.update({
      dob: payload.dob,
      addressStreet: payload.addressStreet,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
      addressLga: payload.addressLga,
      addressCountry: payload.addressCountry ?? null,
      ...(photoUrl ? { profilePhotoUrl: photoUrl } : {}),
    });

    // ── 4. Register with Lendsqr (idempotent — skip if already done) ─────────
    if (!parent.lendsqrCustomerId) {
      // BVN verification first if BVN supplied
      if (payload.bvn) {
        const bvnRes = (await identityService.verifyBvn(payload.bvn)) as {
          data?: { status?: string };
        };
        if (!bvnRes?.data || bvnRes.data.status !== "successful") {
          throw new ApiError(
            400,
            "BVN verification failed. Please check your BVN.",
          );
        }
      }

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
      const lendsqrUser = lendsqrRes.data?.users?.[0];
      if (!lendsqrUser)
        throw new ApiError(502, "Lendsqr customer registration failed.");

      await parent.update({
        bvn: payload.bvn ?? parent.bvn,
        nin: payload.nin ?? parent.nin,
        kycStatus: "approved",
        lendsqrCustomerId: String(lendsqrUser.id),
      });
    }

    // ── 5 & 6. Create students + loan applications ────────────────────────────
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

      const referenceNumber = `SC-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;

      const application = await LoanApplication.create({
        referenceNumber,
        parentId: parent.id,
        studentId: student.id,
        schoolId: payload.schoolId,
        amountRequested: payload.tuitionAmount,
        tenor: payload.tenor,
        status: "pending",
        termsAccepted: payload.termsConfirmed,
        termsAcceptedAt: payload.termsConfirmed ? new Date() : null,
      });

      createdApplications.push(application);
    }

    return {
      applications: createdApplications,
      lendsqrCustomerId: parent.lendsqrCustomerId,
      referenceNumbers: createdApplications.map((a) => a.referenceNumber),
    };
  }
}

export default new ParentService();
