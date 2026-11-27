import { LendsqrBaseService } from "./base.service";
import env from "../../config/env";

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
    if (!env.lendsqr.apiKey) {
      return Promise.resolve({
        status: "success",
        message: "NIN verified successfully (sandbox mode)",
        data: {
          nin,
          first_name: "Test",
          middle_name: "Parent",
          last_name: "User",
          dob: "1990-01-01",
          formatted_dob: "01-Jan-1990",
          mobile: "08012345678",
          mobile2: "",
          registration_date: "2020-01-01",
          email: "test.parent@example.com",
          gender: "Male",
          marital_status: "Married",
          state_of_residence: "Lagos",
          base64Image: "",
          image_url: "",
        },
        meta: { cost: 0, balance: 100 },
      });
    }

    return this.client.get<NinVerificationResponse, NinVerificationResponse>(
      `/v2/verification/nin/${nin}`,
    );
  }

  /**
   * Stage 1 — send OTP to the phone/email linked to the BVN.
   * contact: phone number or email address.
   */
  initBvnConsent(bvn: string, contact: string): Promise<BvnConsentInitResponse> {
    if (!env.lendsqr.apiKey) {
      return Promise.resolve({
        status: "success",
        message: "OTP sent successfully (sandbox mode)",
        data: contact.replace(/(\d{3})\d+(\d{4})/, "$1***$2"),
        meta: { cost: 0, balance: 100 },
      });
    }

    return this.client.post<BvnConsentInitResponse, BvnConsentInitResponse>(
      `/v2/verification/bvn/${bvn}/accounts`,
      { contact },
    );
  }

  /**
   * Stage 2 — verify OTP and retrieve full BVN details.
   */
  completeBvnConsent(bvn: string, otp: string): Promise<BvnConsentCompleteResponse> {
    if (!env.lendsqr.apiKey) {
      return Promise.resolve({
        status: "success",
        message: "BVN verified successfully (sandbox mode)",
        data: {
          reference: 123456,
          bvn,
          first_name: "Test",
          middle_name: "Parent",
          last_name: "User",
          dob: "1990-01-01",
          mobile: "08012345678",
          registration_date: "2020-01-01",
          enrollment_bank: "058",
          email: "test.parent@example.com",
          gender: "Male",
          marital_status: "Married",
          residential_address: "Lagos, Nigeria",
          state_of_origin: "Lagos",
          watchlisted: 0,
          image_url: "",
        },
        meta: { cost: 0, balance: 100 },
      });
    }

    return this.client.put<BvnConsentCompleteResponse, BvnConsentCompleteResponse>(
      `/v2/verification/bvn/${bvn}/accounts`,
      { otp },
    );
  }
}

export default new LendsqrIdentityService();
