import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import { successResponse } from '../utils/response';

class AdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getDashboard();
      successResponse(res, 200, 'Admin dashboard data fetched', result);
    } catch (error) { next(error); }
  }

  async getSchools(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getSchools(req.query.status as string | undefined);
      successResponse(res, 200, 'Schools fetched', result);
    } catch (error) { next(error); }
  }

  async approveSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.approveSchool(String(req.params.id));
      successResponse(res, 200, 'School approved', result);
    } catch (error) { next(error); }
  }

  async rejectSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.rejectSchool(String(req.params.id));
      successResponse(res, 200, 'School rejected', result);
    } catch (error) { next(error); }
  }

  async getParents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getParents();
      successResponse(res, 200, 'Parents fetched', result);
    } catch (error) { next(error); }
  }

  async getLoanApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.getLoanApplications();
      successResponse(res, 200, 'Loan applications fetched', result);
    } catch (error) { next(error); }
  }
}

export default new AdminController();
