import apiClient from "./apiClient";

export type SchoolRequestStatus =
  | "pending"
  | "in_progress"
  | "onboarded"
  | "rejected";

export interface SchoolRequestRecord {
  id: string;
  parentId: string;
  schoolName: string;
  schoolAddress: string | null;
  schoolCity: string | null;
  schoolState: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  additionalNotes: string | null;
  documentUrl: string | null;
  status: SchoolRequestStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalApplications: number;
  activeLoans: number;
  pendingApplications: number;
  totalApprovedAmount: number;
}

export interface ParentDashboardResponse {
  profile: Record<string, unknown>;
  kycStatus: "pending" | "submitted" | "approved" | "rejected";
  stats: DashboardStats;
  schoolRequests: SchoolRequestRecord[];
  hasSchoolRequest: boolean;
  applications?: unknown[];
  students?: unknown[];
}

export const dashboardService = {
  getParentDashboard: async (): Promise<ParentDashboardResponse> => {
    const response = await apiClient.get("/parents/dashboard");
    return (response.data.data ?? response.data) as ParentDashboardResponse;
  },

  getSchoolDashboard: async (): Promise<unknown> => {
    const response = await apiClient.get("/schools/dashboard");
    return response.data.data;
  },
};
