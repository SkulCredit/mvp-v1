import { LendsqrBaseService } from "./base.service";

interface ApplicationPayload {
  customer_id: string;
  amount: number;
  tenor: number;
  purpose: string;
  [key: string]: unknown;
}

/**
 * Payload for the Lendsqr "Book Loan" endpoint.
 * POST https://adjutor.lendsqr.com/v2/customers/loans
 */
export interface BookLoanPayload {
  bvn: string;
  requested_amount: number;
  proposed_tenor: number;
  proposed_tenor_period?: "days" | "weeks" | "months";
  purpose?: string;
  marital_status?: string;
  no_of_dependent?: string;
  type_of_residence?: string;
  educational_attainment?: string;
  sector_of_employment?: string;
  monthly_net_income?: string;
  proposed_payday?: string; // YYYY-MM-DD
  employment_status?: string;
  work_start_date?: string; // YYYY-MM-DD
  work_email?: string;
  current_employer?: string;
  employment_category?: string;
  product_id: number;
  disburse_to?: "bank" | "wallet" | "third-party" | "restrictedd-wallet";
  location?: string;
}

export interface LoanScorePayload {
  product_id: number;
  bvn: string;
  requested_amount: number;
  location: string;
}

export interface LoanScoreResponse {
  status: string;
  message: string;
  data: {
    credit_score: string;
    decision_data: {
      pass: boolean;
      decision: string;
      engine: string;
      total_weighted_score: number;
      total_weight: number;
      score: string;
      applicant_score: number;
      advisory_amount: number;
      process_time: number;
      offers?: {
        success: boolean;
        data: Array<{ pass: boolean; offer: number }>;
      };
    };
    proposed_amount: number;
    loan_profile?: Record<string, unknown>;
  };
  meta?: {
    cost: number;
    balance: number;
  };
}

export interface BookLoanResponse {
  status: string;
  message: string;
  data: {
    loan_id: number;
    loan_profile_id: number;
  };
  meta?: {
    cost: number;
    balance: number;
  };
}

class LendsqrApplicationService extends LendsqrBaseService {
  checkEligibility(customerId: string, amount: number): Promise<unknown> {
    return this.client.post("/v1/loans/eligibility", {
      customer_id: customerId,
      amount,
    });
  }

  submitApplication(applicationData: ApplicationPayload): Promise<unknown> {
    return this.client.post("/v1/loans/apply", applicationData);
  }

  getApplicationStatus(applicationId: string): Promise<unknown> {
    return this.client.get(`/v1/loans/applications/${applicationId}`);
  }

  checkLoanScore(payload: LoanScorePayload): Promise<LoanScoreResponse> {
    return this.client.post(
      "/v2/customers/loans/score",
      payload,
    ) as Promise<LoanScoreResponse>;
  }

  bookLoan(payload: BookLoanPayload): Promise<BookLoanResponse> {
    return this.client.post(
      "/v2/customers/loans",
      payload,
    ) as Promise<BookLoanResponse>;
  }
}

export default new LendsqrApplicationService();
