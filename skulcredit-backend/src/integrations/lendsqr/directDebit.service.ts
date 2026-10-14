import { LendsqrBaseService } from "./base.service";

export interface CreateMandatePayload {
  account_number: string;
  bank_code: string;
  amount: number;
  start_date: string;
  user_id: number | string;
}

class LendsqrDirectDebitService extends LendsqrBaseService {
  getMandates(adjutorCustomerId: number | string): Promise<unknown> {
    return this.client.get(`/v2/customers/${adjutorCustomerId}/direct-debit-mandates`);
  }

  createMandate(payload: CreateMandatePayload): Promise<unknown> {
    return this.client.post("/v2/customers/direct-debit-mandates", payload);
  }

  activateMandate(mandateId: number | string): Promise<unknown> {
    return this.client.patch(`/v2/customers/direct-debit-mandates/${mandateId}/activate`);
  }

  deactivateMandate(mandateId: number | string): Promise<unknown> {
    return this.client.patch(`/v2/customers/direct-debit-mandates/${mandateId}/deactivate`);
  }

  cancelMandate(mandateId: number | string): Promise<unknown> {
    return this.client.patch(`/v2/customers/direct-debit-mandates/${mandateId}/cancel`);
  }
}

export default new LendsqrDirectDebitService();
