import apiClient from "./apiClient";

// ── Param interfaces ──────────────────────────────────────────────────────────

export interface AddStudentParams {
  schoolId: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  gradeLevel: string;
  tuitionAmount: number;
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

// ── Service ───────────────────────────────────────────────────────────────────

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

  /** Submit BVN-based KYC with full profile payload to Lendsqr v2/customers */
  verifyKYC: async (params: VerifyKycParams): Promise<unknown> => {
    const response = await apiClient.post("/parents/kyc", params);
    return response.data.data;
  },

  /** Verify NIN only — returns NIN identity data for display */
  verifyNin: async (nin: string): Promise<NinVerificationData> => {
    const response = await apiClient.post<{
      data: { data: NinVerificationData };
    }>("/parents/verify-nin", { nin });
    return response.data.data as unknown as NinVerificationData;
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

  getApplications: async (): Promise<unknown> => {
    const response = await apiClient.get("/parents/applications");
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
  }: AddStudentParams): Promise<{ id: string; [key: string]: unknown }> => {
    const response = await apiClient.post("/parents/students", {
      schoolId,
      firstName,
      lastName,
      ...(studentId ? { studentId } : {}),
      gradeLevel,
      tuitionAmount: Number(tuitionAmount),
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

  /**
   * Confirm service charge has been paid for an application.
   * Called after successful Paystack payment.
   */
  confirmServiceCharge: async (
    applicationId: string,
    paystackReference?: string,
  ): Promise<unknown> => {
    const response = await apiClient.post(
      `/parents/applications/${applicationId}/confirm-service-charge`,
      paystackReference ? { paystackReference } : {},
    );
    return response.data.data;
  },

  /**
   * Confirm repayment plan for an application.
   * Generates installment records backend-side and triggers the funding partner handoff.
   */
  setupRepayment: async (
    applicationId: string,
    opts: { repaymentStartDate?: string } = {},
  ): Promise<unknown> => {
    const response = await apiClient.post(
      `/parents/applications/${applicationId}/setup-repayment`,
      opts,
    );
    return response.data.data;
  },

  /**
   * Submit the 4-step new-application wizard as a JSON request.
   * Backend: POST /parents/submit-application-json
   * (The multipart endpoint still exists for the KYC wizard; this one is
   *  for the streamlined StudentDetailsPage flow where documents are already
   *  on file from a prior KYC submission.)
   */
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
    repaymentPlanId: "3month" | "4month";
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

// ── Academic session/term types ───────────────────────────────────────────────

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

export interface AcademicSessionSummary {
  id: string;
  sessionId: string;
  sessionName: string; // "2026/2027"
  startYear: number;
  endYear: number;
  isCurrent: boolean;
  terms: AcademicTermSummary[];
}

// ── Catalog types ─────────────────────────────────────────────────────────────

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

// ── Catalog service ───────────────────────────────────────────────────────────

export const catalogService = {
  /** Fetch all academic sessions with their terms — for the wizard session/term picker */
  getSessions: async (): Promise<AcademicSessionSummary[]> => {
    const response = await apiClient.get<{ data: AcademicSessionSummary[] }>(
      "/parents/sessions",
    );
    return response.data.data;
  },
  /** Step 1 of 3: fetch all institution types (Nursery, Primary, Secondary …) */
  getInstitutionTypes: async (): Promise<CatalogInstitutionType[]> => {
    const response = await apiClient.get<{
      data: CatalogInstitutionType[];
    }>("/catalog/institution-types");
    return response.data.data;
  },

  /** Step 2 of 3: fetch schools that offer the selected institution type */
  getSchools: async (institutionTypeId: string): Promise<CatalogSchool[]> => {
    const response = await apiClient.get<{ data: CatalogSchool[] }>(
      `/catalog/schools?institutionTypeId=${institutionTypeId}`,
    );
    return response.data.data;
  },

  /** Step 3 of 3: fetch class levels for the selected school + institution type */
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
