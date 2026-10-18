import apiClient from "./apiClient";
import {
  FINANCE_METRICS,
  CHART_DATA_12_MONTHS,
  CHART_DATA_6_MONTHS,
  PORTFOLIO_STATUS,
  PENDING_ACTIONS,
  RECENT_TRANSACTIONS,
  SCHOOL_PERFORMANCE,
  ELIGIBLE_LOANS,
  DISBURSEMENT_HISTORY_ITEMS,
  SCHOOL_VERIFICATION_ITEMS,
  PARENT_REPAYMENTS_DATA,
  AGING_OVERDUE_BUCKETS,
  SCHOOL_OUTSTANDING_BREAKDOWN,
  OVERDUE_QUEUE_DATA,
  COLLECTION_FOLLOW_UP_DATA,
  FINANCIAL_REPORTS_LIST,
  FINANCIAL_PORTFOLIO_BARS,
  SCHOOL_DIRECTORY_DATA,
  LINKED_LOANS_DATA,
  FINANCIAL_AUDIT_LOGS,
  EligibleLoanItem,
  DisbursementHistoryItem,
  SchoolVerificationItem,
  ParentRepaymentRecord,
  OverdueQueueItem,
  CollectionFollowUpItem,
  FinancialReportItem,
  SchoolDirectoryItem,
  LinkedLoanItem,
  FinancialAuditLogItem,
} from "../pages/FinanceFlow/mockFinanceData";
import {
  FinancialMetric,
  ChartDataPoint,
  PortfolioCategory,
  PendingAction,
  FinanceTransaction,
  SchoolPerformanceRecord,
} from "../pages/FinanceFlow/types";

export interface DashboardStatsData {
  metrics: FinancialMetric[];
  chartData: ChartDataPoint[];
  portfolioStatus: PortfolioCategory[];
  pendingActions: PendingAction[];
  recentTransactions: FinanceTransaction[];
  schoolPerformance: SchoolPerformanceRecord[];
}

export interface DisbursementsResponse {
  items: DisbursementHistoryItem[];
  statusCounts: {
    all: number;
    completed: number;
    processing: number;
    failed: number;
    reversed: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RepaymentsResponse {
  items: ParentRepaymentRecord[];
  statusCounts: {
    all: number;
    onTrack: number;
    dueSoon: number;
    gracePeriod: number;
    overdue: number;
    defaulted: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OutstandingBalancesResponse {
  totalOutstanding: string;
  activeLoans: number;
  averageBalance: string;
  collectionsDue: string;
  buckets: typeof AGING_OVERDUE_BUCKETS;
  schoolBreakdown: typeof SCHOOL_OUTSTANDING_BREAKDOWN;
}

export interface OverdueAccountsResponse {
  metrics: {
    accountsOverdue: number;
    overdueAmount: string;
    escalatedCases: number;
    underRestriction: string;
  };
  queue: OverdueQueueItem[];
}

export interface CollectionFollowUpResponse {
  metrics: {
    openFollowUps: number;
    promisedPayments: number;
    contactThisWeek: number;
    escalations: number;
  };
  queue: CollectionFollowUpItem[];
}

export interface FinancialReportsResponse {
  portfolioBars: typeof FINANCIAL_PORTFOLIO_BARS;
  reportsList: FinancialReportItem[];
}

export interface SchoolRecordsResponse {
  directory: SchoolDirectoryItem[];
  linkedLoans: LinkedLoanItem[];
  sampleMismatch: {
    reference: string;
    source: string;
    amount: string;
    schoolName: string;
    bankAccount: string;
    reason: string;
    status: string;
  };
}

export interface AuditLogsAndSettingsResponse {
  metrics: {
    actionsToday: number;
    approvalPending: number;
    failedActions: number;
    activeFinanceUsers: number;
  };
  logs: FinancialAuditLogItem[];
  settings: {
    autoDisbursementLimit?: number;
    requireTwoPersonApproval?: boolean;
    gracePeriodDays?: number;
    defaultLateFeePercentage?: number;
    reconciliationThreshold?: number;
    notificationEmails?: string[];
    [key: string]: unknown;
  };
}

export const financeService = {
  // 1. Dashboard KPI stats & charts
  getDashboardStats: async (period: "6M" | "12M" = "12M"): Promise<DashboardStatsData> => {
    try {
      const response = await apiClient.get(`/finance/dashboard/stats?period=${period}`);
      const data = response.data?.data ?? response.data;
      if (data && data.metrics) return data as DashboardStatsData;
    } catch {
      // Fallback to mock data
    }
    return {
      metrics: FINANCE_METRICS,
      chartData: period === "6M" ? CHART_DATA_6_MONTHS : CHART_DATA_12_MONTHS,
      portfolioStatus: PORTFOLIO_STATUS,
      pendingActions: PENDING_ACTIONS,
      recentTransactions: RECENT_TRANSACTIONS,
      schoolPerformance: SCHOOL_PERFORMANCE,
    };
  },

  // 2. Disbursements history
  getDisbursements: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    date?: string;
  }): Promise<DisbursementsResponse> => {
    try {
      const response = await apiClient.get("/finance/disbursements", { params });
      const data = response.data?.data ?? response.data;
      if (data && data.items) return data as DisbursementsResponse;
    } catch {
      // Fallback
    }
    return {
      items: DISBURSEMENT_HISTORY_ITEMS,
      statusCounts: {
        all: DISBURSEMENT_HISTORY_ITEMS.length,
        completed: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Completed").length,
        processing: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Processing").length,
        failed: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Failed").length,
        reversed: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Reversed").length,
      },
    };
  },

  // 3. Eligible approved loans awaiting disbursement
  getEligibleLoans: async (search?: string): Promise<EligibleLoanItem[]> => {
    try {
      const response = await apiClient.get("/finance/disbursements/eligible-loans", {
        params: { search },
      });
      const data = response.data?.data ?? response.data;
      if (Array.isArray(data) && data.length > 0) return data as EligibleLoanItem[];
    } catch {
      // Fallback
    }
    return ELIGIBLE_LOANS;
  },

  // 4. Single Disbursement Details
  getDisbursementById: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/finance/disbursements/${id}`);
      return response.data?.data ?? response.data;
    } catch {
      return null;
    }
  },

  // 5. Initiate Disbursement Request
  initiateDisbursement: async (data: { loanApplicationId: string; notes?: string }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/disbursements", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 6. Retry Failed Disbursement
  retryDisbursement: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/finance/disbursements/${id}/retry`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 7. Reverse Disbursement
  reverseDisbursement: async (id: string, reason: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/finance/disbursements/${id}/reverse`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 8. School Verification List
  getSchoolVerifications: async (search?: string): Promise<SchoolVerificationItem[]> => {
    try {
      const response = await apiClient.get("/finance/schools/verification", { params: { search } });
      const data = response.data?.data ?? response.data;
      if (Array.isArray(data) && data.length > 0) return data as SchoolVerificationItem[];
    } catch {
      // Fallback
    }
    return SCHOOL_VERIFICATION_ITEMS;
  },

  // 9. Update School Verification Status
  updateSchoolVerificationStatus: async (
    schoolId: string,
    data: { status: string; reason?: string; notes?: string }
  ): Promise<any> => {
    try {
      const response = await apiClient.patch(`/finance/schools/verification/${schoolId}/status`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 10. Repayments Register
  getRepayments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<RepaymentsResponse> => {
    try {
      const response = await apiClient.get("/finance/repayments", { params });
      const data = response.data?.data ?? response.data;
      if (data && data.items) return data as RepaymentsResponse;
    } catch {
      // Fallback
    }
    return {
      items: PARENT_REPAYMENTS_DATA,
      statusCounts: {
        all: PARENT_REPAYMENTS_DATA.length,
        onTrack: PARENT_REPAYMENTS_DATA.filter((i) => i.status === "On track").length,
        dueSoon: PARENT_REPAYMENTS_DATA.filter((i) => i.status === "Due soon").length,
        gracePeriod: PARENT_REPAYMENTS_DATA.filter((i) => i.status === "Grace period").length,
        overdue: PARENT_REPAYMENTS_DATA.filter((i) => i.status === "Overdue").length,
        defaulted: PARENT_REPAYMENTS_DATA.filter((i) => i.status === "Defaulted").length,
      },
    };
  },

  // 11. Repayment Loan Detail & Schedule
  getRepaymentLoanDetail: async (loanId: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/finance/repayments/${loanId}`);
      return response.data?.data ?? response.data;
    } catch {
      return null;
    }
  },

  // 12. Trigger Collection Reminder
  triggerFollowUp: async (data: { loanId: string; actionType?: string; notes?: string }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/repayments/follow-up", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 13. Waive Late Fee
  waiveLateFee: async (data: { loanId: string; scheduleId?: string; amount?: number; reason: string }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/repayments/waive-fee", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 14. Outstanding Balances & Aging Buckets
  getOutstandingBalances: async (): Promise<OutstandingBalancesResponse> => {
    try {
      const response = await apiClient.get("/finance/outstanding-balances");
      const data = response.data?.data ?? response.data;
      if (data && data.buckets) return data as OutstandingBalancesResponse;
    } catch {
      // Fallback
    }
    return {
      totalOutstanding: "₦412.5M",
      activeLoans: 2184,
      averageBalance: "₦188,873",
      collectionsDue: "₦48.2M",
      buckets: AGING_OVERDUE_BUCKETS,
      schoolBreakdown: SCHOOL_OUTSTANDING_BREAKDOWN,
    };
  },

  // 15. Overdue Accounts Queue & Metrics
  getOverdueAccounts: async (): Promise<OverdueAccountsResponse> => {
    try {
      const response = await apiClient.get("/finance/overdue-accounts");
      const data = response.data?.data ?? response.data;
      if (data && data.queue) return data as OverdueAccountsResponse;
    } catch {
      // Fallback
    }
    return {
      metrics: {
        accountsOverdue: 62,
        overdueAmount: "₦18.6M",
        escalatedCases: 19,
        underRestriction: "₦4.2M",
      },
      queue: OVERDUE_QUEUE_DATA,
    };
  },

  // 16. Bulk Reminders
  sendBulkReminders: async (data: { loanIds: string[]; channel?: string }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/overdue-accounts/bulk-reminders", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 17. Collection Follow-Up Queue
  getCollectionFollowUps: async (): Promise<CollectionFollowUpResponse> => {
    try {
      const response = await apiClient.get("/finance/collections/follow-up");
      const data = response.data?.data ?? response.data;
      if (data && data.queue) return data as CollectionFollowUpResponse;
    } catch {
      // Fallback
    }
    return {
      metrics: {
        openFollowUps: 48,
        promisedPayments: 16,
        contactThisWeek: 31,
        escalations: 7,
      },
      queue: COLLECTION_FOLLOW_UP_DATA,
    };
  },

  // 18. Log Interaction & Assign Officer
  logInteraction: async (data: {
    loanId: string;
    interactionType: string;
    notes: string;
    promiseDate?: string;
    promisedAmount?: number;
  }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/collections/log-interaction", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  assignOfficer: async (data: { loanId: string; officerId: string; officerName?: string }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/collections/assign", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 19. Financial Reports & Analytics
  getFinancialReports: async (): Promise<FinancialReportsResponse> => {
    try {
      const response = await apiClient.get("/finance/reports");
      const data = response.data?.data ?? response.data;
      if (data && data.reportsList) return data as FinancialReportsResponse;
    } catch {
      // Fallback
    }
    return {
      portfolioBars: FINANCIAL_PORTFOLIO_BARS,
      reportsList: FINANCIAL_REPORTS_LIST,
    };
  },

  downloadReport: async (id: string, format: string = "CSV"): Promise<Blob | null> => {
    try {
      const response = await apiClient.get(`/finance/reports/${id}/download`, {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch {
      return null;
    }
  },

  // 20. School Records Directory & Mismatch Details
  getSchoolRecords: async (): Promise<SchoolRecordsResponse> => {
    try {
      const response = await apiClient.get("/finance/records/schools");
      const data = response.data?.data ?? response.data;
      if (data && data.directory) return data as SchoolRecordsResponse;
    } catch {
      // Fallback
    }
    return {
      directory: SCHOOL_DIRECTORY_DATA,
      linkedLoans: LINKED_LOANS_DATA,
      sampleMismatch: {
        reference: "TXN-009823",
        source: "Bank Statement · Access Bank",
        amount: "₦4,250,000",
        schoolName: "Greenfield International School",
        bankAccount: "•••• 4821",
        reason: "Internal Ledger references ₦4,150,000 (variance: ₦100,000). Possible fee deduction discrepancy.",
        status: "Flagged for reconciliation",
      },
    };
  },

  createInvestigation: async (data: {
    transactionReference: string;
    schoolId?: string;
    issueType: string;
    description: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post("/finance/records/investigation", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 21. Audit Logs & Settings
  getAuditLogsAndSettings: async (): Promise<AuditLogsAndSettingsResponse> => {
    try {
      const response = await apiClient.get("/finance/audit-logs");
      const data = response.data?.data ?? response.data;
      if (data && data.logs) return data as AuditLogsAndSettingsResponse;
    } catch {
      // Fallback
    }
    return {
      metrics: {
        actionsToday: 24,
        approvalPending: 3,
        failedActions: 1,
        activeFinanceUsers: 6,
      },
      logs: FINANCIAL_AUDIT_LOGS,
      settings: {
        autoDisbursementLimit: 5000000,
        requireTwoPersonApproval: true,
        gracePeriodDays: 7,
        defaultLateFeePercentage: 2.5,
        reconciliationThreshold: 1000,
        notificationEmails: ["finance@skulcredit.com", "approvals@skulcredit.com"],
      },
    };
  },

  updateSettings: async (settings: Record<string, unknown>): Promise<any> => {
    try {
      const response = await apiClient.patch("/finance/settings", settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default financeService;
