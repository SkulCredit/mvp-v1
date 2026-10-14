import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
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

// Extend AxiosRequestConfig so we can stamp a start time on each request
interface TimedRequestConfig extends InternalAxiosRequestConfig {
  _startedAt?: number;
}

function attachInterceptors(client: AxiosInstance): void {
  // ── Outbound request ──────────────────────────────────────────────────────
  client.interceptors.request.use((config: TimedRequestConfig) => {
    config._startedAt = Date.now();
    logger.info({
      message: "aletpay_request",
      method: config.method?.toUpperCase(),
      url: `${config.baseURL ?? ""}${config.url ?? ""}`,
      body: config.data,          // logs the full request body
    });
    return config;
  });

  // ── Successful response ───────────────────────────────────────────────────
  client.interceptors.response.use((response) => {
    const cfg = response.config as TimedRequestConfig;
    const duration = cfg._startedAt ? Date.now() - cfg._startedAt : undefined;
    logger.info({
      message: "aletpay_response",
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
      status: response.status,
      duration_ms: duration,
      body: response.data,        // logs the full response body
    });
    return response;
  },
  // ── Error / non-2xx response ──────────────────────────────────────────────
  (error: AxiosError) => {
    const cfg = error.config as TimedRequestConfig | undefined;
    const duration = cfg?._startedAt ? Date.now() - cfg._startedAt : undefined;
    logger.error({
      message: "aletpay_error",
      method: cfg?.method?.toUpperCase(),
      url: cfg ? `${cfg.baseURL ?? ""}${cfg.url ?? ""}` : "unknown",
      status: error.response?.status,
      duration_ms: duration,
      error_message: error.message,
      response_body: error.response?.data,  // logs the error body from Aletpay
      request_body: cfg?.data,
    });
    return Promise.reject(error);
  });
}

class AletpayService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.aletpay.baseUrl,
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": env.aletpay.secretKey ?? "",
      },
    });
    attachInterceptors(this.client);
  }

  async generateVirtualAccount(
    opts: GenerateVirtualAccountOptions,
  ): Promise<VirtualAccountResult> {
    let response;
    try {
      response = await this.client.post(
        "/bank-transfer/api/v1/bankTransfer/virtualAccount",
        {
          businessId: env.aletpay.businessId,
          amount: opts.amount,
          currency: "NGN",
          orderId: opts.orderId,
          description: opts.description,
          customer: {
            email: opts.customer.email,
            phone: opts.customer.phone,
            firstName: opts.customer.firstName,
            lastName: opts.customer.lastName,
            metadata: opts.customer.metadata ?? "",
          },
        },
      );
    } catch (err: unknown) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg =
        axErr.response?.data?.message ??
        axErr.message ??
        "Aletpay virtual account generation failed";
      throw new ApiError(502, msg);
    }

    const body = response.data as {
      status: boolean | string | number;
      message?: string;
      data?: {
        virtualBankCode?: string;
        virtualBankAccountNumber?: string;
        transactionId?: string;
        expiredAt?: string;
      };
    };

    if (!body.status || body.status === "false") {
      throw new ApiError(
        502,
        body.message ?? "Aletpay returned a failure status",
      );
    }

    const data = body.data;
    if (!data) {
      throw new ApiError(502, "Aletpay returned no data");
    }

    const virtualBankCode = data.virtualBankCode ?? "";
    return {
      virtualBankCode,
      virtualBankAccountNumber: data.virtualBankAccountNumber ?? "",
      transactionId: data.transactionId ?? "",
      expiredAt: data.expiredAt ?? "",
      bankName: resolveBankName(virtualBankCode),
    };
  }

  async getTransaction(transactionId: string): Promise<TransactionStatusResult> {
    let response;
    try {
      response = await this.client.get(
        `/bank-transfer/api/v1/bankTransfer/transactions/${transactionId}`,
      );
    } catch (err: unknown) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg =
        axErr.response?.data?.message ??
        axErr.message ??
        "Aletpay transaction lookup failed";
      throw new ApiError(502, msg);
    }

    const body = response.data as {
      status: boolean | string | number;
      message?: string;
      data?: Record<string, unknown>;
    };

    if (!body.status || body.status === "false") {
      throw new ApiError(
        502,
        body.message ?? "Aletpay returned a failure status",
      );
    }

    return (body.data ?? {}) as TransactionStatusResult;
  }
}

export default new AletpayService();
