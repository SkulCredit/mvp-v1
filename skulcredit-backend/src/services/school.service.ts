import { SchoolRepository } from '../repositories';
import { Student, LoanApplication, ApplicationEvent, User, Parent } from '../models/index';
import ApiError from '../utils/apiError';

interface GetApplicationsQuery {
  status?: string;
  page?: number | string;
  limit?: number | string;
}

interface VerifyEnrollmentData {
  action: 'confirm' | 'reject';
  confirmedTuitionAmount?: number;
  note?: string;
}

class SchoolService {
  async getProfile(userId: string) {
    const school = await SchoolRepository.findOne({ userId }, {
      include: [{ model: User, as: 'user', attributes: ['email', 'phoneNumber', 'isEmailVerified'] }],
    });
    if (!school) throw new ApiError(404, 'School profile not found');
    return school;
  }

  async completeRegistration(userId: string, data: Record<string, unknown>) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, 'School profile not found');
    if (school.status === 'approved') throw new ApiError(400, 'School is already approved');
    return school.update({ ...data, status: 'under_review' });
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, 'School profile not found');

    const allowed = ['contactPerson', 'website', 'population',
      'addressStreet', 'addressCity', 'addressState', 'addressCountry'];

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k))
    );
    return school.update(filtered);
  }

  async updateBankDetails(userId: string, bankDetails: { bankName: string; accountName: string; accountNumber: string }) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, 'School profile not found');
    return school.update({
      bankName:          bankDetails.bankName,
      bankAccountName:   bankDetails.accountName,
      bankAccountNumber: bankDetails.accountNumber,
    });
  }

  async getApplications(userId: string, { status, page = 1, limit = 20 }: GetApplicationsQuery = {}) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, 'School profile not found');

    const where: Record<string, unknown> = { schoolId: school.id };
    if (status) where.status = status;

    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const { count, rows } = await LoanApplication.findAndCountAll({
      where,
      include: [{
        model: Student, as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'gradeLevel', 'studentId'],
        include: [{ model: Parent, as: 'parent', attributes: ['id', 'firstName', 'lastName'] }],
      }],
      order: [['createdAt', 'DESC']],
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
    if (!school) throw new ApiError(404, 'School profile not found');

    const application = await LoanApplication.findOne({
      where: { id: applicationId, schoolId: school.id },
      include: [
        {
          model: Student, as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'gradeLevel', 'studentId', 'tuitionAmount'],
          include: [{ model: Parent, as: 'parent', attributes: ['id', 'firstName', 'lastName'] }],
        },
        { model: ApplicationEvent, as: 'events', order: [['createdAt', 'ASC']] },
      ],
    });

    if (!application) throw new ApiError(404, 'Application not found');
    return application;
  }

  async verifyEnrollment(userId: string, applicationId: string, { action, confirmedTuitionAmount, note }: VerifyEnrollmentData) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, 'School profile not found');

    const application = await LoanApplication.findOne({ where: { id: applicationId, schoolId: school.id } });
    if (!application) throw new ApiError(404, 'Application not found');

    if (application.status !== 'school_verification') {
      throw new ApiError(400, `Application is in '${application.status}' status and is not awaiting school verification`);
    }

    if (action === 'confirm') {
      await application.update({
        schoolVerificationStatus: 'confirmed',
        schoolVerifiedAt: new Date(),
        schoolVerificationNote: note ?? null,
        ...(confirmedTuitionAmount && { amountRequested: confirmedTuitionAmount }),
        status: 'under_review',
      });
      await ApplicationEvent.create({
        loanApplicationId: application.id,
        actor: 'school',
        actorId: school.id,
        status: 'under_review',
        note: note ?? 'Enrollment and fee amount confirmed by school',
      });
    } else {
      await application.update({
        schoolVerificationStatus: 'rejected',
        schoolVerifiedAt: new Date(),
        schoolVerificationNote: note ?? null,
        status: 'rejected',
        rejectionReason: note ?? 'Enrollment could not be confirmed by the school',
      });
      await ApplicationEvent.create({
        loanApplicationId: application.id,
        actor: 'school',
        actorId: school.id,
        status: 'rejected',
        note: note ?? 'Enrollment rejected by school',
      });
    }

    return LoanApplication.findByPk(applicationId);
  }

  async getDashboard(userId: string) {
    const school = await SchoolRepository.findOne({ userId });
    if (!school) throw new ApiError(404, 'School profile not found');

    const [totalStudents, totalApplications, pendingVerification, recentApplications] = await Promise.all([
      Student.count({ where: { schoolId: school.id } }),
      LoanApplication.count({ where: { schoolId: school.id } }),
      LoanApplication.count({ where: { schoolId: school.id, status: 'school_verification' } }),
      LoanApplication.findAll({
        where: { schoolId: school.id },
        include: [{ model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'gradeLevel'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
    ]);

    return { profile: school, stats: { totalStudents, totalApplications, pendingVerification }, recentApplications };
  }
}

export default new SchoolService();
