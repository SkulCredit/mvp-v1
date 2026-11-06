/**
 * AletPay (Alat Pay) integration service.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  LOCAL MODE — API calls commented out for local development.              │
 * │  Both methods return mock data so the full payment flow works            │
 * │  without hitting the external AletPay API.                               │
 * │                                                                          │
 * │  To re-enable the real API: uncomment the axios calls and the            │
 * │  interceptor/client setup below, then remove the mock returns.          │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

// import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import env from "../../config/env";
import ApiError from "../../utils/apiError";
import logger from "../../config/logger";

const BANK_CODE_MAP: Record<string, string> = {
  "035": "Wema Bank",
};

function resolveBankName(code: string): string {
  return BANK_CODE_MAP[code] ?? code;
}

export interface AletpayCustomer {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  metadata?: string;
}

export interface GenerateVirtualAccountOptions {
  amount: number;
  orderId: string;
  description: string;
  customer: AletpayCustomer;
}

export interface VirtualAccountResult {
  virtualBankCode: string;
  virtualBankAccountNumber: string;
  transactionId: string;
  expiredAt: string;
  bankName: string;
}

export interface TransactionStatusResult {
  status: string;
  amountSent?: number;
  nipTransaction?: unknown;
  [key: string]: unknown;
}

// ── Axios client + interceptors (commented out for local mode) ────────────────
//
// interface TimedRequestConfig extends InternalAxiosRequestConfig {
//   _startedAt?: number;
// }
//
// function attachInterceptors(client: AxiosInstance): void {
//   client.interceptors.request.use((config: TimedRequestConfig) => {
//     config._startedAt = Date.now();
//     logger.info({
//       message: "aletpay_request",
//       method: config.method?.toUpperCase(),
//       url: `${config.baseURL ?? ""}${config.url ?? ""}`,
//       body: config.data,
//     });
//     return config;
//   });
//
//   client.interceptors.response.use((response) => {
//     const cfg = response.config as TimedRequestConfig;
//     const duration = cfg._startedAt ? Date.now() - cfg._startedAt : undefined;
//     logger.info({
//       message: "aletpay_response",
//       method: response.config.method?.toUpperCase(),
//       url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
//       status: response.status,
//       duration_ms: duration,
//       body: response.data,
//     });
//     return response;
//   },
//   (error: AxiosError) => {
//     const cfg = error.config as TimedRequestConfig | undefined;
//     const duration = cfg?._startedAt ? Date.now() - cfg._startedAt : undefined;
//     logger.error({
//       message: "aletpay_error",
//       method: cfg?.method?.toUpperCase(),
//       url: cfg ? `${cfg.baseURL ?? ""}${cfg.url ?? ""}` : "unknown",
//       status: error.response?.status,
//       duration_ms: duration,
//       error_message: error.message,
//       response_body: error.response?.data,
//       request_body: cfg?.data,
//     });
//     return Promise.reject(error);
//   });
// }

class AletpayService {
  // private readonly client: AxiosInstance;  // commented out for local mode

  constructor() {
    // this.client = axios.create({
    //   baseURL: env.aletpay.baseUrl,
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Ocp-Apim-Subscription-Key": env.aletpay.secretKey ?? "",
    //   },
    // });
    // attachInterceptors(this.client);
    logger.info(
      "[aletpay] Running in LOCAL MODE — API calls disabled, returning mock data",
    );
  }

  /**
   * Generate a virtual account for receiving payment.
   *
   * LOCAL MODE: returns a mock virtual account without calling the API.
   */
  async generateVirtualAccount(
    opts: GenerateVirtualAccountOptions,
  ): Promise<VirtualAccountResult> {
    // ── Real API call (commented out) ──────────────────────────────────────
    //
    // let response;
    // try {
    //   response = await this.client.post(
    //     "/bank-transfer/api/v1/bankTransfer/virtualAccount",
    //     {
    //       businessId: env.aletpay.businessId,
    //       amount: opts.amount,
    //       currency: "NGN",
    //       orderId: opts.orderId,
    //       description: opts.description,
    //       customer: {
    //         email: opts.customer.email,
    //         phone: opts.customer.phone,
    //         firstName: opts.customer.firstName,
    //         lastName: opts.customer.lastName,
    //         metadata: opts.customer.metadata ?? "",
    //       },
    //     },
    //   );
    // } catch (err: unknown) {
    //   const axErr = err as AxiosError<{ message?: string }>;
    //   const msg =
    //     axErr.response?.data?.message ??
    //     axErr.message ??
    //     "Aletpay virtual account generation failed";
    //   throw new ApiError(502, msg);
    // }
    //
    // const body = response.data as {
    //   status: boolean | string | number;
    //   message?: string;
    //   data?: {
    //     virtualBankCode?: string;
    //     virtualBankAccountNumber?: string;
    //     transactionId?: string;
    //     expiredAt?: string;
    //   };
    // };
    //
    // if (!body.status || body.status === "false") {
    //   throw new ApiError(502, body.message ?? "Aletpay returned a failure status");
    // }
    //
    // const data = body.data;
    // if (!data) throw new ApiError(502, "Aletpay returned no data");
    //
    // const virtualBankCode = data.virtualBankCode ?? "";
    // return {
    //   virtualBankCode,
    //   virtualBankAccountNumber: data.virtualBankAccountNumber ?? "",
    //   transactionId: data.transactionId ?? "",
    //   expiredAt: data.expiredAt ?? "",
    //   bankName: resolveBankName(virtualBankCode),
    // };

    // ── Mock response (local mode) ───────────────────────────────────────────
    const virtualBankCode = "035";
    const mockAccountNumber = `98${Date.now().toString().slice(-8)}`;
    const mockTransactionId = opts.orderId;

    logger.info(
      `[aletpay] MOCK generateVirtualAccount — account=${mockAccountNumber} orderId=${opts.orderId} amount=${opts.amount}`,
    );

    return {
      virtualBankCode,
      virtualBankAccountNumber: mockAccountNumber,
      transactionId: mockTransactionId,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      bankName: resolveBankName(virtualBankCode),
    };
  }

  /**
   * Look up a transaction by its ID.
   *
   * LOCAL MODE: always returns status "successful" with amountSent 0.
   * When amountSent is 0, the calling code in payInstallment() derives the
   * amount from the selected repayment schedule rows — so local payments
   * work end-to-end without a real bank transfer.
   */
  async getTransaction(
    transactionId: string,
  ): Promise<TransactionStatusResult> {
    // ── Real API call (commented out) ──────────────────────────────────────
    //
    // let response;
    // try {
    //   response = await this.client.get(
    //     `/bank-transfer/api/v1/bankTransfer/transactions/${transactionId}`,
    //   );
    // } catch (err: unknown) {
    //   const axErr = err as AxiosError<{ message?: string }>;
    //   const msg =
    //     axErr.response?.data?.message ??
    //     axErr.message ??
    //     "Aletpay transaction lookup failed";
    //   throw new ApiError(502, msg);
    // }
    //
    // const body = response.data as {
    //   status: boolean | string | number;
    //   message?: string;
    //   data?: Record<string, unknown>;
    // };
    //
    // if (!body.status || body.status === "false") {
    //   throw new ApiError(502, body.message ?? "Aletpay returned a failure status");
    // }
    //
    // return (body.data ?? {}) as TransactionStatusResult;

    // ── Mock response (local mode) ───────────────────────────────────────────
    logger.info(
      `[aletpay] MOCK getTransaction — transactionId=${transactionId} → status=successful`,
    );

    return {
      status: "successful",
      amountSent: 0, // 0 causes the caller to derive amount from schedules
    };
  }
}

export default new AletpayService();
