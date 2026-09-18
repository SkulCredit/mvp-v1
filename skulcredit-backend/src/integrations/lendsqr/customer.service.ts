import { LendsqrBaseService } from "./base.service";

export interface CustomerPayload {
  phone_number: string;
  email: string;
  /** Provide bvn when using BVN flow */
  bvn?: string;
  bvn_phone_number?: string;
  dob?: string; // YYYY-MM-DD
  account_number?: string;
  bank_code?: string;
  state?: string;
  lga?: string;
  city?: string;
  address?: string;
  photo_url?: string;
  documents?: Array<{
    url: string;
    type_id: number;
    sub_type_id?: number;
  }>;
}

export interface LendsqrCustomerUser {
  id: number;
  org_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  bvn: string;
  dob: string;
  photo_url: string;
  address: string | null;
  city: string | null;
  state: string | null;
  lga: string | null;
  gender: string | null;
  credit_score: number | null;
  selfie_bvn_check: string | null;
  selfie_id_check: string | null;
  activated: number;
  blacklisted: number;
  created_on: string;
  [key: string]: unknown;
}

export interface CreateCustomerResponse {
  status: string;
  message: string;
  data: {
    /** Some Lendsqr endpoints return the customer directly in data */
    id?: number;
    /** Others wrap in a users array */
    users?: LendsqrCustomerUser[];
    /** Or nest under a single user key */
    user?: LendsqrCustomerUser;
    [key: string]: unknown;
  };
  meta: { cost: number; balance: number };
}

class LendsqrCustomerService extends LendsqrBaseService {
  /**
   * Register/upsert a customer: POST /v2/customers
   * Full URL: https://adjutor.lendsqr.com/v2/customers
   * env.lendsqr.baseUrl must be "https://adjutor.lendsqr.com" (no trailing slash, no /v2).
   */
  createCustomer(payload: CustomerPayload): Promise<CreateCustomerResponse> {
    return this.client.post<CustomerPayload, CreateCustomerResponse>(
      "/v2/customers",
      payload,
    );
  }

  getCustomer(customerId: string): Promise<unknown> {
    return this.client.get(`/v2/customers/${customerId}`);
  }

  updateCustomer(
    customerId: string,
    updateData: Record<string, unknown>,
  ): Promise<unknown> {
    return this.client.put(`/v2/customers/${customerId}`, updateData);
  }
}

export default new LendsqrCustomerService();
