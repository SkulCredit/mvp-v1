import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { ParentRepository, UserRepository } from '../repositories';
import { Student, LoanApplication, School, SchoolRequest, ApplicationEvent, User } from '../models/index';
import ApiError from '../utils/apiError';
import identityService from '../integrations/lendsqr/identity.service';
import customerService from '../integrations/lendsqr/customer.service';

interface SchoolDirectoryQuery {
  search?: string;
  city?: string;
  state?: string;
  page?: number | string;
  limit?: number | string;
}

class ParentService {
  async getProfile(userId: string) {
    const parent = await ParentRepository.findOne({ userId }, {
      include: [{ model: User, as: 'user', attributes: ['email', 'phoneNumber', 'isEmailVerified', 'lastLogin'] }],
    });
    if (!parent) throw new ApiError(404, 'Parent profile not found');
    return parent;
  }

  async completeProfile(userId: string, profileData: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');
    return parent.update(profileData);
  }

  async changePassword(userId: string, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) {
    const user = await UserRepository.findOne({ id: userId }, { attributes: { include: ['password'] } });
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

    await user.update({ password: await bcrypt.hash(newPassword, 10) });
  }

  async verifyKYC(userId: string, kycData: { bvn: string; nin?: string }) {
    const parent = await ParentRepository.findOne({ userId });
    const user   = await UserRepository.findById(userId);
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const bvnResponse = await identityService.verifyBvn(kycData.bvn) as { data?: { status?: string } };
    if (!bvnResponse?.data || bvnResponse.data.status !== 'successful') {
      throw new ApiError(400, 'BVN verification failed');
    }

    const lendsqrCustomer = await customerService.createCustomer({
      firstName:   parent.firstName,
      lastName:    parent.lastName,
      email:       user!.email,
      phoneNumber: user!.phoneNumber ?? '',
      bvn:         kycData.bvn,
    }) as { data: { id: string } };

    return parent.update({
      bvn: kycData.bvn,
      nin: kycData.nin ?? null,
      kycStatus: 'approved',
      lendsqrCustomerId: lendsqrCustomer.data.id,
    });
  }

  async addStudent(userId: string, studentData: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const school = await School.findByPk(studentData.schoolId as string);
    if (!school) throw new ApiError(404, 'School not found');
    if (school.status !== 'approved') throw new ApiError(400, 'School is not an active partner');

    return Student.create({ parentId: parent.id, ...studentData } as never);
  }

  async getStudents(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    return Student.findAll({
      where: { parentId: parent.id },
      include: [{ model: School, as: 'school', attributes: ['id', 'schoolName', 'addressCity', 'addressState'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getStudent(userId: string, studentId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const student = await Student.findOne({
      where: { id: studentId, parentId: parent.id },
      include: [{ model: School, as: 'school', attributes: ['id', 'schoolName', 'addressCity', 'addressState'] }],
    });
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  }

  async updateStudent(userId: string, studentId: string, data: Record<string, unknown>) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const student = await Student.findOne({ where: { id: studentId, parentId: parent.id } });
    if (!student) throw new ApiError(404, 'Student not found');

    if (data.schoolId && data.schoolId !== student.schoolId) {
      const school = await School.findByPk(data.schoolId as string);
      if (!school) throw new ApiError(404, 'School not found');
      if (school.status !== 'approved') throw new ApiError(400, 'School is not an active partner');
    }

    return student.update(data);
  }

  async deleteStudent(userId: string, studentId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const student = await Student.findOne({ where: { id: studentId, parentId: parent.id } });
    if (!student) throw new ApiError(404, 'Student not found');

    const activeLoans = await LoanApplication.count({
      where: {
        studentId: student.id,
        status: { [Op.notIn]: ['rejected', 'repaid', 'cancelled'] },
      },
    });
    if (activeLoans > 0) {
      throw new ApiError(400, 'Cannot delete a student with active loan applications');
    }

    await student.destroy();
  }

  async getApplications(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    return LoanApplication.findAll({
      where: { parentId: parent.id },
      include: [
        { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'gradeLevel'] },
        { model: School,  as: 'school',  attributes: ['id', 'schoolName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getApplication(userId: string, applicationId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const application = await LoanApplication.findOne({
      where: { id: applicationId, parentId: parent.id },
      include: [
        { model: Student,          as: 'student', attributes: ['id', 'firstName', 'lastName', 'gradeLevel', 'studentId'] },
        { model: School,           as: 'school',  attributes: ['id', 'schoolName', 'addressCity', 'addressState'] },
        { model: ApplicationEvent, as: 'events',  order: [['createdAt', 'ASC']] },
      ],
    });
    if (!application) throw new ApiError(404, 'Application not found');
    return application;
  }

  async getSchoolDirectory({ search, city, state, page = 1, limit = 20 }: SchoolDirectoryQuery) {
    const where: Record<string, unknown> = { status: 'approved' };
    if (city)   where.addressCity  = city;
    if (state)  where.addressState = state;
    if (search) where.schoolName   = { [Op.iLike]: `%${search}%` };

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await School.findAndCountAll({
      where,
      attributes: ['id', 'schoolName', 'website', 'addressStreet', 'addressCity', 'addressState', 'addressCountry', 'population'],
      order: [['schoolName', 'ASC']],
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
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const existing = await SchoolRequest.findOne({
      where: {
        parentId:   parent.id,
        schoolName: { [Op.iLike]: String(data.schoolName).trim() },
        status:     { [Op.in]: ['pending', 'in_progress'] },
      },
    });
    if (existing) {
      throw new ApiError(400, 'You already have a pending request for a school with this name');
    }

    return SchoolRequest.create({ parentId: parent.id, ...data } as never);
  }

  async getSchoolRequests(userId: string) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    return SchoolRequest.findAll({
      where: { parentId: parent.id },
      order: [['createdAt', 'DESC']],
    });
  }

  async getDashboard(userId: string) {
    const parent = await ParentRepository.findOne({ userId }, {
      include: [
        {
          model: Student, as: 'students',
          include: [{ model: School, as: 'school', attributes: ['id', 'schoolName'] }],
        },
        {
          model: LoanApplication, as: 'loanApplications',
          include: [{ model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] }],
          order: [['createdAt', 'DESC']],
          limit: 5,
        },
      ],
    });

    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const [totalApplications, activeLoans, pendingApplications, schoolRequests, approvedLoans] = await Promise.all([
      LoanApplication.count({ where: { parentId: parent.id } }),
      LoanApplication.count({ where: { parentId: parent.id, status: 'disbursed' } }),
      LoanApplication.count({
        where: {
          parentId: parent.id,
          status: { [Op.in]: ['pending', 'under_review', 'info_requested', 'school_verification'] },
        },
      }),
      SchoolRequest.findAll({
        where: { parentId: parent.id },
        attributes: ['id', 'schoolName', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
      }),
      LoanApplication.findAll({
        where: { parentId: parent.id, status: 'approved' },
        attributes: ['amountApproved'],
      }),
    ]);

    const totalApprovedAmount = (approvedLoans as unknown as Array<{ amountApproved: number | null }>)
      .reduce((sum, loan) => sum + (loan.amountApproved ?? 0), 0);

    const hasSchoolRequest = schoolRequests.length > 0;

    return {
      profile: parent,
      stats:   {
        totalApplications,
        activeLoans,
        pendingApplications,
        totalApprovedAmount,
      },
      schoolRequests,
      hasSchoolRequest,
    };
  }
}

export default new ParentService();
