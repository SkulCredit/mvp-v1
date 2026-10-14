import { LendsqrBaseService } from "./base.service";

export interface NinVerificationData {
  nin: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  formatted_dob: string;
  mobile: string;
  mobile2: string;
  registration_date: string;
  email: string;
  gender: string;
  marital_status: string;
  state_of_residence: string;
  base64Image: string;
  image_url: string;
}

export interface NinVerificationResponse {
  status: string;
  message: string;
  data: NinVerificationData;
  meta: { cost: number; balance: number };
}

export interface BvnConsentInitResponse {
  status: string;
  message: string;
  data: string; // masked contact e.g. "0808***2636"
  meta: { cost: number; balance: number };
}

export interface BvnVerificationData {
  reference: number;
  bvn: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  mobile: string;
  registration_date: string;
  enrollment_bank: string;
  email: string;
  gender: string;
  marital_status: string;
  residential_address: string;
  state_of_origin: string;
  watchlisted: number;
  image_url: string;
}

export interface BvnConsentCompleteResponse {
  status: string;
  message: string;
  data: BvnVerificationData;
  meta: { cost: number; balance: number };
}

class LendsqrIdentityService extends LendsqrBaseService {
  verifyNin(nin: string): Promise<NinVerificationResponse> {
    return this.client.get<NinVerificationResponse, NinVerificationResponse>(
      `/v2/verification/nin/${nin}`,
    );
  }

  /**
   * Stage 1 — send OTP to the phone/email linked to the BVN.
   * contact: phone number or email address.
   */
  initBvnConsent(bvn: string, contact: string): Promise<BvnConsentInitResponse> {
    return this.client.post<BvnConsentInitResponse, BvnConsentInitResponse>(
      `/v2/verification/bvn/${bvn}/accounts`,
      { contact },
    );
  }

  /**
   * Stage 2 — verify OTP and retrieve full BVN details.
   */
  completeBvnConsent(bvn: string, otp: string): Promise<BvnConsentCompleteResponse> {
    return this.client.put<BvnConsentCompleteResponse, BvnConsentCompleteResponse>(
      `/v2/verification/bvn/${bvn}/accounts`,
      { otp },
    );
  }
}

export default new LendsqrIdentityService();
