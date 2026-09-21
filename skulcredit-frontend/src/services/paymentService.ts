import apiClient from "./apiClient";

export interface PaymentInitPayload {
  amount: number;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

export interface PaymentInitResult {
  authorization_url?: string;
  reference?: string;
  [key: string]: unknown;
}

export const paymentService = {
  initiatePayment: async ({
    amount,
    metadata,
    callbackUrl,
  }: PaymentInitPayload): Promise<PaymentInitResult> => {
    const payload: Record<string, unknown> = { amount: Number(amount) };
    if (metadata !== undefined) payload.metadata = metadata;
    if (callbackUrl !== undefined) payload.callbackUrl = callbackUrl;
    const response = await apiClient.post("/payments/initialize", payload);
    return response.data.data as PaymentInitResult;
  },

  verifyPayment: async (reference: string): Promise<unknown> => {
    const response = await apiClient.get(`/payments/verify/${reference}`);
    return response.data.data;
  },
};
