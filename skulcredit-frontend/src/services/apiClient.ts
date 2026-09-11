
import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { ENV } from "../config/env";
import { tokenStorage, userStorage } from "./api";

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

function processQueue(newToken: string | null): void {
  refreshQueue.forEach((resolve) => resolve(newToken));
  refreshQueue = [];
}

function clearSession(): void {
  tokenStorage.clear();
  userStorage.clear();
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest?.url ?? "";
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) return reject(error);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post<{
        success: boolean;
        data: { accessToken: string };
      }>(
        `${ENV.API_BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true },
      );

      const newAccessToken = data.data.accessToken;
      if (!newAccessToken)
        throw new Error("No access token in refresh response");

      tokenStorage.setAccess(newAccessToken);
      processQueue(newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return apiClient(originalRequest);
    } catch {
      processQueue(null);
      clearSession();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
