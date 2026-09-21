import axios, { AxiosInstance } from "axios";
import env from "../../config/env";
import ApiError from "../../utils/apiError";

interface InitializePaymentOptions {
  email: string;
  amount: number;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

class PaystackService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${env.paystack.secretKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async initializePayment({
    email,
    amount,
    metadata,
    callbackUrl,
  }: InitializePaymentOptions): Promise<unknown> {
    try {
      const response = await this.client.post("/transaction/initialize", {
        email,
        amount: amount * 100,
        metadata,
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      });
      return response.data;
    } catch (error) {
      throw new ApiError(
        500,
        `Paystack Initialization Error: ${(error as Error).message}`,
      );
    }
  }

  async verifyPayment(reference: string): Promise<unknown> {
    try {
      const response = await this.client.get(
        `/transaction/verify/${reference}`,
      );
      return response.data;
    } catch (error) {
      throw new ApiError(
        500,
        `Paystack Verification Error: ${(error as Error).message}`,
      );
    }
  }
}

export default new PaystackService();
