import apiClient from "./apiClient";

export interface AddStudentParams {
  schoolId: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  gradeLevel: string;
  tuitionAmount: number;
  dob?: string;
  gender?: string;
}

export interface SchoolDirectoryParams {
  search?: string;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
}

export interface RequestSchoolParams {
  schoolName: string;
  schoolAddress?: string;
  schoolCity?: string;
  schoolState?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  additionalNotes?: string;
  documentUrl?: string;
}

export interface VerifyKycParams {
  bvn?: string;
  nin?: string;
  dob?: string;
  state?: string;
  lga?: string;
  city?: string;
  address?: string;
  photoUrl?: string;
  accountNumber?: string;
  bankCode?: string;
  bvnPhoneNumber?: string;
  employerName?: string;
  spouseFullName?: string;
  spouseEmail?: string;
  spousePhone?: string;
  spouseEmployerType?: string;
  relationship?: string;
  employerType?: string;
  yearsInRole?: string;
  monthlyIncome?: string;
  documents?: Array<{ url: string; type_id: number; sub_type_id?: number }>;
}

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

export interface BvnVerificationData {
  reference: number;
  bvn: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  mobile: string;
  registration_date: string;
  enrollment_bank: string;
  email: string;
  gender: string;
  marital_status: string;
  residential_address: string;
  state_of_origin: string;
  watchlisted: number;
  image_url: string;
}

export const parentService = {
  getProfile: async (): Promise<unknown> => {
    const response = await apiClient.get("/parents/profile");
    return response.data.data;
  },

  updateProfile: async (data: Record<string, unknown>): Promise<unknown> => {
    const response = await apiClient.put("/parents/profile", data);
    return response.data.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<unknown> => {
    const response = await apiClient.put("/parents/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data.data;
  },

  verifyKYC: async (params: VerifyKycParams): Promise<unknown> => {
    const response = await apiClient.post("/parents/kyc", params);
    return response.data.data;
  },

  verifyNin: async (nin: string): Promise<NinVerificationData> => {
    const response = await apiClient.post<{
      data: { data: NinVerificationData };
    }>("/parents/verify-nin", { nin });
    return response.data.data as unknown as NinVerificationData;
  },

  /**
   * Stage 1 – send OTP to the customer's registered phone/email.
   * Returns the masked contact string (e.g. "0808***2636") shown as confirmation.
   */
  initBvnConsent: async (
    bvn: string,
    contact: string,
  ): Promise<{ maskedContact: string }> => {
    const response = await apiClient.post<{
      data: { maskedContact: string };
    }>("/parents/bvn-consent/init", { bvn, contact });
    return response.data.data;
  },

  /**
   * Stage 2 – verify the OTP and retrieve full BVN details.
   */
  completeBvnConsent: async (
    bvn: string,
    otp: string,
  ): Promise<BvnVerificationData> => {
    const response = await apiClient.put<{
      data: BvnVerificationData;
    }>("/parents/bvn-consent/complete", { bvn, otp });
    return response.data.data;
  },

  checkEligibility: async (
    amount: number,
  ): Promise<{ maxAmount: number; [key: string]: unknown }> => {
    const response = await apiClient.post("/loans/eligibility", {
      amount: Number(amount),
    });
    return response.data.data as { maxAmount: number };
  },

  submitApplication: async ({
    studentId,
    amount,
    tenor,
  }: {
    studentId: string;
    amount: number;
    tenor: number;
  }): Promise<unknown> => {
    const response = await apiClient.post("/loans/apply", {
      studentId,
      amount: Number(amount),
      tenor: Number(tenor),
    });
    return response.data.data;
  },

  getApplications: async (page = 1, limit = 10): Promise<unknown> => {
    const response = await apiClient.get(
      `/parents/applications?page=${page}&limit=${limit}`,
    );
    return response.data.data;
  },

  getCurrentTerm: async (): Promise<unknown> => {
    const response = await apiClient.get("/parents/current-term");
    return response.data.data;
  },

  getApplicationDetails: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/parents/applications/${id}`);
    return response.data.data;
  },

  getStudents: async (): Promise<unknown> => {
    const response = await apiClient.get("/parents/students");
    return response.data.data;
  },

  getStudent: async (id: string): Promise<unknown> => {
    const response = await apiClient.get(`/parents/students/${id}`);
    return response.data.data;
  },

  addStudent: async ({
    schoolId,
    firstName,
    lastName,
    studentId,
    gradeLevel,
    tuitionAmount,
    dob,
    gender,
  }: AddStudentParams): Promise<{ id: string; [key: string]: unknown }> => {
    const response = await apiClient.post("/parents/students", {
      schoolId,
      firstName,
      lastName,
      ...(studentId ? { studentId } : {}),
      gradeLevel,
      tuitionAmount: Number(tuitionAmount),
      ...(dob ? { dob } : {}),
      ...(gender ? { gender } : {}),
    });
    return response.data.data as { id: string };
  },

  updateStudent: async (
    id: string,
    data: Record<string, unknown>,
  ): Promise<unknown> => {
    const response = await apiClient.put(`/parents/students/${id}`, data);
    return response.data.data;
  },

  deleteStudent: async (id: string): Promise<unknown> => {
    const response = await apiClient.delete(`/parents/students/${id}`);
    return response.data.data;
  },

  getSchoolDirectory: async ({
    search,
    city,
    state,
    page = 1,
    limit = 20,
  }: SchoolDirectoryParams = {}): Promise<unknown> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const response = await apiClient.get(
      `/parents/schools?${params.toString()}`,
    );
    return response.data.data;
  },

  getSchoolRequests: async (): Promise<unknown> => {
    const response = await apiClient.get("/parents/school-requests");
    return response.data.data;
  },

  requestSchool: async ({
    schoolName,
    schoolAddress,
    schoolCity,
    schoolState,
    contactPerson,
    contactPhone,
    contactEmail,
    additionalNotes,
    documentUrl,
  }: RequestSchoolParams): Promise<unknown> => {
    const response = await apiClient.post("/parents/school-requests", {
      schoolName,
      ...(schoolAddress ? { schoolAddress } : {}),
      ...(schoolCity ? { schoolCity } : {}),
      ...(schoolState ? { schoolState } : {}),
      ...(contactPerson ? { contactPerson } : {}),
      ...(contactPhone ? { contactPhone } : {}),
      ...(contactEmail ? { contactEmail } : {}),
      ...(additionalNotes ? { additionalNotes } : {}),
      ...(documentUrl ? { documentUrl } : {}),
    });
    return response.data.data;
  },

  getDashboard: async (): Promise<unknown> => {
    const response = await apiClient.get("/parents/dashboard");
    return response.data.data;
  },

  confirmServiceCharge: async (
    applicationId: string,
    transactionReference?: string,
  ): Promise<unknown> => {
    const response = await apiClient.post(
      `/parents/applications/${applicationId}/confirm-service-charge`,
      transactionReference ? { transactionReference } : {},
    );
    return response.data.data;
  },

  setupRepayment: async (
    applicationId: string,
    opts: { debitDay?: number } = {},
  ): Promise<unknown> => {
    const response = await apiClient.post(
      `/parents/applications/${applicationId}/setup-repayment`,
      opts,
    );
    return response.data.data;
  },

  getMandatePreview: async (
    applicationId: string,
    debitDay: number,
  ): Promise<unknown> => {
    const response = await apiClient.get(
      `/parents/applications/${applicationId}/mandate-preview`,
      { params: { debitDay } },
    );
    return response.data.data;
  },

  getRepaymentSchedule: async (applicationId: string): Promise<unknown> => {
    const response = await apiClient.get(
      `/parents/applications/${applicationId}/schedule`,
    );
    return response.data.data;
  },

  confirmInstallmentPayment: async (
    applicationId: string,
    payload: {
      transactionReference?: string;
      paystackReference?: string;
      scheduleIds: string[];
      type: "scheduled" | "early_partial" | "early_full";
    },
  ): Promise<unknown> => {
    const response = await apiClient.post(
      `/parents/applications/${applicationId}/pay-installment`,
      {
        transactionReference: payload.transactionReference ?? payload.paystackReference,
        paystackReference: payload.paystackReference,
        scheduleIds: payload.scheduleIds,
        type: payload.type,
      },
    );
    return response.data.data;
  },

  submitWizardApplication: async ({
    childId,
    schoolId,
    institutionTypeId,
    institutionTypeName,
    gradeLevel,
    tuitionAmount,
    repaymentPlanId,
    tenor,
    academicSession,
    term,
  }: {
    childId: string;
    schoolId: string;
    institutionTypeId: string;
    institutionTypeName: string;
    gradeLevel: string;
    tuitionAmount: number;
    repaymentPlanId: "2month" | "3month" | "4month";
    tenor: number;
    academicSession?: string;
    term?: string;
  }): Promise<{
    referenceNumber?: string;
    referenceNumbers?: string[];
    lendsqrLoanId?: number;
    tenor?: number;
    termName?: string;
    termAcademicYear?: string;
    [key: string]: unknown;
  }> => {
    const response = await apiClient.post("/parents/apply", {
      childId,
      schoolId,
      institutionTypeId,
      institutionTypeName,
      gradeLevel,
      tuitionAmount: Number(tuitionAmount),
      repaymentPlanId,
      tenor: Number(tenor),
      ...(academicSession ? { academicSession } : {}),
      ...(term ? { term } : {}),
    });
    return response.data.data as {
      referenceNumber?: string;
      referenceNumbers?: string[];
      lendsqrLoanId?: number;
      tenor?: number;
      termName?: string;
      termAcademicYear?: string;
    };
  },
};

export interface AcademicTermSummary {
  id: string;
  termId: string;
  termCode: "FIRST_TERM" | "SECOND_TERM" | "THIRD_TERM";
  termName: string;
  status: string;
  portalOpeningDate: string | null;
  portalCloseDate: string | null;
  maxRepaymentMonths: number;
}

// Sessions returned by GET /catalog/sessions (lightweight — no terms array)
export interface AcademicSessionSummary {
  id: string;
  sessionId: string;
  sessionName: string;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
  // terms is no longer included in the list response; fetch on-demand
  terms?: AcademicTermSummary[];
}

export interface CatalogInstitutionType {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CatalogSchool {
  id: string;
  name: string;
  isRegistered: boolean;
  tier: string | null;
  serviceChargeRate: number | null;
  serviceChargeDisplay: string | null;
}

export interface CatalogClassLevel {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CatalogClassLevelGroup {
  subLevelGroup: string | null;
  classes: CatalogClassLevel[];
}

export const catalogService = {
  /** Fetch all session names (lightweight — no terms). */
  getSessions: async (): Promise<AcademicSessionSummary[]> => {
    const response = await apiClient.get<{ data: AcademicSessionSummary[] }>(
      "/catalog/sessions",
    );
    return response.data.data;
  },

  /** Fetch terms for a specific session by its sessionName (e.g. "2026/2027"). */
  getTermsForSession: async (sessionName: string): Promise<AcademicTermSummary[]> => {
    const encoded = encodeURIComponent(sessionName);
    const response = await apiClient.get<{ data: AcademicTermSummary[] }>(
      `/catalog/sessions/${encoded}/terms`,
    );
    return response.data.data;
  },

  getInstitutionTypes: async (): Promise<CatalogInstitutionType[]> => {
    const response = await apiClient.get<{
      data: CatalogInstitutionType[];
    }>("/catalog/institution-types");
    return response.data.data;
  },

  getSchools: async (institutionTypeId: string): Promise<CatalogSchool[]> => {
    const response = await apiClient.get<{ data: CatalogSchool[] }>(
      `/catalog/schools?institutionTypeId=${institutionTypeId}`,
    );
    return response.data.data;
  },

  getClassLevels: async (
    schoolId: string,
    institutionTypeId: string,
  ): Promise<CatalogClassLevelGroup[]> => {
    const response = await apiClient.get<{ data: CatalogClassLevelGroup[] }>(
      `/catalog/class-levels?schoolId=${schoolId}&institutionTypeId=${institutionTypeId}`,
    );
    return response.data.data;
  },
};
