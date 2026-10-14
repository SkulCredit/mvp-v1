import apiClient from "./apiClient";

export interface AletpayInitResult {
  transactionId: string;
  virtualBankCode: string;
  virtualBankAccountNumber: string;
  bankName: string;
  expiredAt: string;
}

export interface AletpayVerifyResult {
  status: string;
  amountSent?: number;
  nipTransaction?: unknown;
  [key: string]: unknown;
}

export const paymentService = {
  initiatePayment: async (opts: {
    amount: number;
    orderId?: string;
    description?: string;
    customer?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    };
    // legacy Paystack fields (used by repayment flow, passed through)
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AletpayInitResult & { authorization_url?: string }> => {
    const response = await apiClient.post("/payments/initialize", opts);
    return response.data.data as AletpayInitResult & { authorization_url?: string };
  },

  verifyPayment: async (
    transactionId: string,
  ): Promise<AletpayVerifyResult> => {
    const response = await apiClient.get(
      `/payments/verify/${transactionId}`,
    );
    return response.data.data as AletpayVerifyResult;
  },

  generateDisbursementVirtualAccount: async (opts: {
    applicationId: string;
    amount: number;
    schoolName?: string;
    bankAccountNumber?: string;
  }): Promise<AletpayInitResult> => {
    const response = await apiClient.post(
      "/payments/disbursement-virtual-account",
      opts,
    );
    return response.data.data as AletpayInitResult;
  },
};
