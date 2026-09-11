import { ParentRepository, SchoolRepository } from '../repositories';
import { LoanApplication, Student, School, User } from '../models/index';
import ApiError from '../utils/apiError';

class AdminService {
  async getDashboard() {
    const [totalParents, totalSchools, pendingSchools, pendingLoans] = await Promise.all([
      ParentRepository.count(),
      SchoolRepository.count(),
      SchoolRepository.count({ status: 'under_review' }),
      LoanApplication.count({ where: { status: 'pending' } }),
    ]);

    return { stats: { totalParents, totalSchools, pendingSchools, pendingLoans } };
  }

  async getSchools(status?: string) {
    const where = status ? { status } : {};
    return SchoolRepository.find(where, {
      include: [{ model: User, as: 'user', attributes: ['email', 'phoneNumber', 'isActive'] }],
    });
  }

  async approveSchool(schoolId: string) {
    const school = await SchoolRepository.findById(schoolId);
    if (!school) throw new ApiError(404, 'School not found');
    return school.update({ status: 'approved' });
  }

  async rejectSchool(schoolId: string) {
    const school = await SchoolRepository.findById(schoolId);
    if (!school) throw new ApiError(404, 'School not found');
    return school.update({ status: 'rejected' });
  }

  async getParents() {
    return ParentRepository.find({}, {
      include: [{ model: User, as: 'user', attributes: ['email', 'phoneNumber', 'isActive'] }],
    });
  }

  async getLoanApplications() {
    return LoanApplication.findAll({
      include: [
        { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
        { model: School,  as: 'school',  attributes: ['id', 'schoolName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new AdminService();
