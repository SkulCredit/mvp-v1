import { LendsqrBaseService } from './base.service';

interface ApplicationPayload {
  customer_id: string;
  amount: number;
  tenor: number;
  purpose: string;
  [key: string]: unknown;
}

class LendsqrApplicationService extends LendsqrBaseService {
  checkEligibility(customerId: string, amount: number): Promise<unknown> {
    return this.client.post('/v1/loans/eligibility', { customer_id: customerId, amount });
  }

  submitApplication(applicationData: ApplicationPayload): Promise<unknown> {
    return this.client.post('/v1/loans/apply', applicationData);
  }

  getApplicationStatus(applicationId: string): Promise<unknown> {
    return this.client.get(`/v1/loans/applications/${applicationId}`);
  }
}

export default new LendsqrApplicationService();
