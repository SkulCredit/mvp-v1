import axios, { AxiosInstance } from "axios";
import env from "../../config/env";
import logger from "../../config/logger";
import ApiError from "../../utils/apiError";

export class LendsqrBaseService {
  protected client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.lendsqr.baseUrl,
      headers: {
        Authorization: `Bearer ${env.lendsqr.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      logger.info(
        `Lendsqr request: ${config.method?.toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""} | payload: ${JSON.stringify(config.data ?? {})}`,
      );
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        logger.info(
          `Lendsqr response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url ?? ""} | body: ${JSON.stringify(response.data)}`,
        );
        return response.data;
      },
      (error) => {
        logger.error(
          `Lendsqr error: ${error.response?.status ?? "network"} ${error.config?.method?.toUpperCase() ?? ""} ${error.config?.url ?? ""} | response: ${JSON.stringify(error.response?.data ?? error.message)}`,
        );
        throw new ApiError(
          error.response?.status ?? 500,
          error.response?.data?.message ?? "Lendsqr Integration Error",
        );
      },
    );
  }
}
