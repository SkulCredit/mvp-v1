import { Request, Response, NextFunction } from 'express';
import schoolService from '../services/school.service';
import { successResponse } from '../utils/response';

class SchoolController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.getProfile(req.user!.userId);
      successResponse(res, 200, 'School profile fetched successfully', result);
    } catch (error) { next(error); }
  }

  async completeRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.completeRegistration(req.user!.userId, req.body);
      successResponse(res, 200, 'Registration details submitted for review', result);
    } catch (error) { next(error); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.updateProfile(req.user!.userId, req.body);
      successResponse(res, 200, 'School profile updated successfully', result);
    } catch (error) { next(error); }
  }

  async updateBankDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.updateBankDetails(req.user!.userId, req.body);
      successResponse(res, 200, 'Bank details updated successfully', result);
    } catch (error) { next(error); }
  }

  async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.getApplications(req.user!.userId, req.query);
      successResponse(res, 200, 'Applications fetched successfully', result);
    } catch (error) { next(error); }
  }

  async getApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.getApplication(req.user!.userId, String(req.params.id));
      successResponse(res, 200, 'Application fetched successfully', result);
    } catch (error) { next(error); }
  }

  async verifyEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.verifyEnrollment(req.user!.userId, String(req.params.id), req.body);
      const action = req.body.action === 'confirm' ? 'confirmed' : 'rejected';
      successResponse(res, 200, `Enrollment ${action} successfully`, result);
    } catch (error) { next(error); }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schoolService.getDashboard(req.user!.userId);
      successResponse(res, 200, 'School dashboard fetched successfully', result);
    } catch (error) { next(error); }
  }
}

export default new SchoolController();
