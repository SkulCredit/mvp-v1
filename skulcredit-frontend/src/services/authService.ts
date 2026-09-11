import apiClient from "./apiClient";
import axios from "axios";
import { ENV } from "../config/env";


export interface AuthUserProfile {
  firstName: string;
  middleName: string | null;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "parent" | "school" | "admin";
  isEmailVerified: boolean;
  isActive: boolean;
  phoneNumber: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  profile: AuthUserProfile | null;
  firstName?: string;
  lastName?: string;
  schoolName?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    parent: {
      id: string;
      userId: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
    };
  };
}

export interface RegisterParentPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AvailabilityParams {
  email?: string;
  phone?: string;
}

export interface AvailabilityResult {
  email?: boolean;
  phone?: boolean;
}

export const authService = {
  registerParent: async (
    payload: RegisterParentPayload,
  ): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register/parent",
      payload,
    );
    return response.data;
  },

  register: async (
    userData: Record<string, unknown>,
    role = "parent",
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      `/auth/register/${role}`,
      userData,
    );
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials,
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
    }
  },

  refreshTokens: async (): Promise<{ accessToken: string }> => {
    const response = await axios.post<{
      success: boolean;
      data: { accessToken: string };
    }>(`${ENV.API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
    return { accessToken: response.data.data.accessToken };
  },

  checkAvailability: async ({
    email,
    phone,
  }: AvailabilityParams = {}): Promise<AvailabilityResult> => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (phone) params.set("phone", phone);
    const response = await apiClient.get<{
      success: boolean;
      data: AvailabilityResult;
    }>(`/auth/check-availability?${params.toString()}`);
    return response.data.data;
  },

  verifyEmailOtp: async (email: string, otp: string): Promise<void> => {
    await apiClient.post("/auth/verify-otp", { email, otp });
  },

  resendVerificationOtp: async (email: string): Promise<void> => {
    await apiClient.post("/auth/send-otp", { email });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email });
  },

  resetPassword: async (
    email: string,
    otp: string,
    password: string,
  ): Promise<void> => {
    await apiClient.post("/auth/reset-password", { email, otp, password });
  },
};

export default authService;
