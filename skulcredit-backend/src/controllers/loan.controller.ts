import { Request, Response, NextFunction } from 'express';
import loanService from '../services/loan.service';
import { successResponse } from '../utils/response';

class LoanController {
  async checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loanService.checkEligibility(req.user!.userId, req.body);
      successResponse(res, 200, 'Eligibility checked successfully', result);
    } catch (error) { next(error); }
  }

  async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loanService.submitApplication(req.user!.userId, req.body);
      successResponse(res, 201, 'Loan application submitted successfully', result);
    } catch (error) { next(error); }
  }
}

export default new LoanController();
