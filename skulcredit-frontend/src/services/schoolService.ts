import apiClient from "./apiClient";

export interface CompleteRegistrationParams {
  website?: string;
  population?: string | number;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  documentCac?: string;
  documentLicense?: string;
  contactPerson?: string;
}

export interface BankDetailsParams {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface VerifyEnrollmentParams {
  action: "confirm" | "reject";
  confirmedTuitionAmount?: number;
  note?: string;
}

export const schoolService = {
  getProfile: async (): Promise<unknown> => {
    const response = await apiClient.get("/schools/profile");
    return response.data.data;
  },

  updateProfile: async (data: Record<string, unknown>): Promise<unknown> => {
    const response = await apiClient.put("/schools/profile", data);
    return response.data.data;
  },

  completeRegistration: async ({
    website,
    population,
    addressStreet,
    addressCity,
    addressState,
    addressCountry,
    documentCac,
    documentLicense,
  }: CompleteRegistrationParams): Promise<unknown> => {
    const response = await apiClient.put("/schools/complete-registration", {
      ...(website ? { website } : {}),
      ...(population ? { population } : {}),
      ...(addressStreet ? { addressStreet } : {}),
      ...(addressCity ? { addressCity } : {}),
      ...(addressState ? { addressState } : {}),
      ...(addressCountry ? { addressCountry } : {}),
      ...(documentCac ? { documentCac } : {}),
      ...(documentLicense ? { documentLicense } : {}),
    });
    return response.data.data;
  },

  updateBankDetails: async ({
    bankName,
    accountName,
    accountNumber,
  }: BankDetailsParams): Promise<unknown> => {
    const response = await apiClient.put("/schools/bank-details", {
      bankName,
      accountName,
      accountNumber,
    });
    return response.data.data;
  },

  getApplications: async (): Promise<unknown> => {
    const response = await apiClient.get("/schools/applications");
    return response.data.data;
  },

  getApplication: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/schools/applications/${id}`);
    return response.data.data;
  },

  verifyEnrollment: async (
    applicationId: string,
    { action, confirmedTuitionAmount, note }: VerifyEnrollmentParams,
  ): Promise<unknown> => {
    const payload: Record<string, unknown> = { action };
    if (
      confirmedTuitionAmount !== undefined &&
      confirmedTuitionAmount !== null
    ) {
      payload.confirmedTuitionAmount = Number(confirmedTuitionAmount);
    }
    if (note) payload.note = note;
    const response = await apiClient.put(
      `/schools/applications/${applicationId}/verify-enrollment`,
      payload,
    );
    return response.data.data;
  },

  getDashboard: async (): Promise<unknown> => {
    const response = await apiClient.get("/schools/dashboard");
    return response.data.data;
  },
};
