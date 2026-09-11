import { ParentRepository } from '../repositories';
import { Student, LoanApplication } from '../models/index';
import ApiError from '../utils/apiError';
import applicationService from '../integrations/lendsqr/application.service';

interface SubmitApplicationData {
  studentId: string;
  amount: number;
  tenor: number;
}

class LoanService {
  async checkEligibility(userId: string, data: { amount: number }) {
    const parent = await ParentRepository.findOne({ userId });

    if (!parent?.lendsqrCustomerId) {
      throw new ApiError(400, 'KYC not completed or Lendsqr customer not found');
    }

    const response = await applicationService.checkEligibility(parent.lendsqrCustomerId, data.amount) as { data: unknown };
    return response.data;
  }

  async submitApplication(userId: string, data: SubmitApplicationData) {
    const parent = await ParentRepository.findOne({ userId });
    if (!parent) throw new ApiError(404, 'Parent profile not found');

    const student = await Student.findByPk(data.studentId);
    if (!student || student.parentId !== parent.id) {
      throw new ApiError(400, 'Invalid student record');
    }

    const lendsqrApp = await applicationService.submitApplication({
      customer_id: parent.lendsqrCustomerId ?? '',
      amount:      data.amount,
      tenor:       data.tenor,
      purpose:     `School Fees for ${student.firstName} ${student.lastName}`,
    }) as { data: { id: string } };

    return LoanApplication.create({
      parentId:             parent.id,
      studentId:            student.id,
      schoolId:             student.schoolId,
      lendsqrApplicationId: lendsqrApp.data.id,
      amountRequested:      data.amount,
      tenor:                data.tenor,
      status:               'pending',
    });
  }
}

export default new LoanService();
