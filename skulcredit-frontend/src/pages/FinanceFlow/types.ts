export interface FinancialMetric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  subtext: string;
  icon: "disbursed" | "repayment" | "outstanding" | "loans";
}

export interface ChartDataPoint {
  month: string;
  paidToSchools: number;
  receivedFromParents: number;
}

export interface PortfolioCategory {
  status: "Disbursed" | "Under review" | "Pending documentation" | "Approved" | "Cancelled";
  count: number;
  percentage: number;
  color: string;
}

export interface PendingAction {
  id: string;
  count: number;
  title: string;
  subtitle: string;
  actionText: "Review" | "Approve" | "Follow up";
  actionType: "failed_tx" | "disbursement_approval" | "overdue" | "unmatched";
}

export type TransactionType = "Disbursement" | "Repayment";
export type TransactionStatus = "Completed" | "Processing" | "Failed";

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  schoolOrParent: string;
  loanOrAppId: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  statusVariant?: "green" | "yellow" | "red" | "gray";
}

export type VerificationStatus = "Verified" | "On-site Verified" | "Action Required" | "Unverified";

export interface SchoolPerformanceRecord {
  id: string;
  schoolName: string;
  schoolCode: string;
  bankAccount: string;
  totalDisbursed: string;
  totalDisbursedNum: number;
  outstanding: string;
  outstandingNum: number;
  collectionRate: number;
  verificationStatus: VerificationStatus;
}
