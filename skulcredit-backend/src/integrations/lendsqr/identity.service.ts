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

class LendsqrIdentityService extends LendsqrBaseService {
  verifyNin(nin: string): Promise<NinVerificationResponse> {
    return this.client.get<NinVerificationResponse, NinVerificationResponse>(
      `/v2/verification/nin/${nin}`,
    );
  }
}

export default new LendsqrIdentityService();
