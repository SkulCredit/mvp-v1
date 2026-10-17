import {
  FinancialMetric,
  ChartDataPoint,
  PortfolioCategory,
  PendingAction,
  FinanceTransaction,
  SchoolPerformanceRecord,
} from "./types";

export const FINANCE_METRICS: FinancialMetric[] = [
  {
    id: "total-disbursed",
    label: "Total disbursed",
    value: "₦851.0M",
    numericValue: 851000000,
    subtext: "Total payout across partner schools (18,450 loans) · Sep 2026",
    icon: "disbursed",
  },
  {
    id: "repayments-received",
    label: "Repayments received",
    value: "₦658.0M",
    numericValue: 658000000,
    subtext: "Confirmed collection payout in period · 82.5% of billing · Sep 2026",
    icon: "repayment",
  },
  {
    id: "portfolio-outstanding",
    label: "Portfolio outstanding",
    value: "₦412.5M",
    numericValue: 412500000,
    subtext: "Unsettled loans on active books across schools",
    icon: "outstanding",
  },
  {
    id: "active-loans",
    label: "Active loans",
    value: "2,184",
    numericValue: 2184,
    subtext: "Active repayment schedules · 98.2% on standard track",
    icon: "loans",
  },
];

export const CHART_DATA_12_MONTHS: ChartDataPoint[] = [
  { month: "Apr", paidToSchools: 310, receivedFromParents: 250 },
  { month: "May", paidToSchools: 380, receivedFromParents: 310 },
  { month: "Jun", paidToSchools: 420, receivedFromParents: 360 },
  { month: "Jul", paidToSchools: 430, receivedFromParents: 390 },
  { month: "Aug", paidToSchools: 780, receivedFromParents: 520 },
  { month: "Sep", paidToSchools: 390, receivedFromParents: 460 },
  { month: "Oct", paidToSchools: 380, receivedFromParents: 420 },
  { month: "Nov", paidToSchools: 390, receivedFromParents: 410 },
  { month: "Dec", paidToSchools: 400, receivedFromParents: 390 },
  { month: "Jan", paidToSchools: 410, receivedFromParents: 400 },
  { month: "Feb", paidToSchools: 420, receivedFromParents: 420 },
  { month: "Mar", paidToSchools: 430, receivedFromParents: 440 },
];

export const CHART_DATA_6_MONTHS: ChartDataPoint[] = [
  { month: "Oct", paidToSchools: 380, receivedFromParents: 420 },
  { month: "Nov", paidToSchools: 390, receivedFromParents: 410 },
  { month: "Dec", paidToSchools: 400, receivedFromParents: 390 },
  { month: "Jan", paidToSchools: 410, receivedFromParents: 400 },
  { month: "Feb", paidToSchools: 420, receivedFromParents: 420 },
  { month: "Mar", paidToSchools: 430, receivedFromParents: 440 },
];

export const PORTFOLIO_STATUS: PortfolioCategory[] = [
  { status: "Disbursed", count: 2118, percentage: 97.0, color: "#700936" },
  { status: "Under review", count: 312, percentage: 14.3, color: "#f472b6" },
  { status: "Pending documentation", count: 122, percentage: 5.6, color: "#f9a8d4" },
  { status: "Approved", count: 64, percentage: 2.9, color: "#fbcfe8" },
  { status: "Cancelled", count: 11, percentage: 0.5, color: "#cbd5e1" },
];

export const PENDING_ACTIONS: PendingAction[] = [
  {
    id: "act-1",
    count: 7,
    title: "Failed transactions",
    subtitle: "Settlement retry queue · bank gateway rejects",
    actionText: "Review",
    actionType: "failed_tx",
  },
  {
    id: "act-2",
    count: 12,
    title: "Disbursements awaiting approval",
    subtitle: "L2 approvals · finance sign-off required",
    actionText: "Approve",
    actionType: "disbursement_approval",
  },
  {
    id: "act-3",
    count: 64,
    title: "Overdue repayments",
    subtitle: "Beyond grace period under configured loans",
    actionText: "Follow up",
    actionType: "overdue",
  },
  {
    id: "act-4",
    count: 19,
    title: "Unmatched transactions",
    subtitle: "Bank statement reference not found",
    actionText: "Follow up",
    actionType: "unmatched",
  },
];

export const RECENT_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: "DSB-004871",
    type: "Disbursement",
    schoolOrParent: "Greenfield International School",
    loanOrAppId: "APP-30918",
    amount: 4250000,
    date: "18 Oct 2026",
    status: "Completed",
    statusVariant: "green",
  },
  {
    id: "RPM-004871",
    type: "Repayment",
    schoolOrParent: "Parent · A. Okoro",
    loanOrAppId: "LN-72071",
    amount: 85000,
    date: "18 Oct 2026",
    status: "Completed",
    statusVariant: "yellow",
  },
  {
    id: "DSB-004871",
    type: "Repayment",
    schoolOrParent: "Greenfield International School",
    loanOrAppId: "APP-30916",
    amount: 4250000,
    date: "09 Oct 2026",
    status: "Processing",
    statusVariant: "yellow",
  },
  {
    id: "DSB-004871",
    type: "Disbursement",
    schoolOrParent: "Greenfield International School",
    loanOrAppId: "APP-30916",
    amount: 4250000,
    date: "08 Oct 2026",
    status: "Failed",
    statusVariant: "red",
  },
  {
    id: "DSB-004871",
    type: "Disbursement",
    schoolOrParent: "Greenfield International School",
    loanOrAppId: "APP-30916",
    amount: 4250000,
    date: "08 Oct 2026",
    status: "Completed",
    statusVariant: "gray",
  },
];

export const SCHOOL_PERFORMANCE: SchoolPerformanceRecord[] = [
  {
    id: "sch-1",
    schoolName: "Greenfield International School",
    schoolCode: "SCH-0142",
    bankAccount: "•••• 4831",
    totalDisbursed: "₦185.6M",
    totalDisbursedNum: 185600000,
    outstanding: "₦78.0M",
    outstandingNum: 78000000,
    collectionRate: 96,
    verificationStatus: "Verified",
  },
  {
    id: "sch-2",
    schoolName: "Crestview Academy",
    schoolCode: "SCH-0207",
    bankAccount: "•••• 7730",
    totalDisbursed: "₦71.0M",
    totalDisbursedNum: 71000000,
    outstanding: "₦31.5M",
    outstandingNum: 31500000,
    collectionRate: 91,
    verificationStatus: "On-site Verified",
  },
  {
    id: "sch-3",
    schoolName: "Rosehill College",
    schoolCode: "SCH-0215",
    bankAccount: "•••• 1098",
    totalDisbursed: "₦55.3M",
    totalDisbursedNum: 55300000,
    outstanding: "₦18.1M",
    outstandingNum: 18100000,
    collectionRate: 74,
    verificationStatus: "Verified",
  },
  {
    id: "sch-4",
    schoolName: "Lakeside Preparatory",
    schoolCode: "SCH-0388",
    bankAccount: "•••• 5512",
    totalDisbursed: "₦44.7M",
    totalDisbursedNum: 44700000,
    outstanding: "₦0",
    outstandingNum: 0,
    collectionRate: 71,
    verificationStatus: "Action Required",
  },
];

// --- Data for New Disbursement Flow ---
export interface EligibleLoanItem {
  id: string;
  applicationId: string;
  parentName: string;
  schoolName: string;
  bankAccount: string;
  amount: number;
  formattedAmount: string;
  verified: boolean;
}

export const ELIGIBLE_LOANS: EligibleLoanItem[] = [
  {
    id: "loan-1",
    applicationId: "APP- 30932",
    parentName: "M. Ibrahim",
    schoolName: "Greenfield International School",
    bankAccount: "••••4821",
    amount: 3800000,
    formattedAmount: "₦3,800,000",
    verified: true,
  },
  {
    id: "loan-2",
    applicationId: "App - 30935",
    parentName: "S. Okafor",
    schoolName: "Crestview Academy",
    bankAccount: "••••4821",
    amount: 2450000,
    formattedAmount: "₦2,450,000",
    verified: true,
  },
  {
    id: "loan-3",
    applicationId: "App - 30938",
    parentName: "S. Okafor",
    schoolName: "Crestview Academy",
    bankAccount: "••••4821",
    amount: 1900000,
    formattedAmount: "₦1,900,000",
    verified: true,
  },
  {
    id: "loan-4",
    applicationId: "App - 30940",
    parentName: "S. Okafor",
    schoolName: "Crestview Academy",
    bankAccount: "••••4821",
    amount: 2450000,
    formattedAmount: "₦2,450,000",
    verified: true,
  },
];

// --- Data for Disbursements History Screen ---
export interface DisbursementHistoryItem {
  id: string;
  reference: string;
  date: string;
  schoolName: string;
  bankAccount: string;
  parentName: string;
  amount: number;
  transactionRef: string;
  status: "Completed" | "Processing" | "Failed" | "Reversed";
}

export const DISBURSEMENT_HISTORY_ITEMS: DisbursementHistoryItem[] = [
  {
    id: "dsb-1",
    reference: "DSB-004821/APP-30918",
    date: "10 Oct 2026",
    schoolName: "Greenfield International School",
    bankAccount: "•••• 4821",
    parentName: "A. Okoro",
    amount: 4250000,
    transactionRef: "TRX-792481",
    status: "Completed",
  },
  {
    id: "dsb-2",
    reference: "DSB-004821/APP-30918",
    date: "10 Oct 2026",
    schoolName: "Greenfield International School",
    bankAccount: "•••• 4821",
    parentName: "A. Okoro",
    amount: 4250000,
    transactionRef: "TRX-792481",
    status: "Reversed",
  },
  {
    id: "dsb-3",
    reference: "DSB-004821/APP-30918",
    date: "10 Oct 2026",
    schoolName: "Greenfield International School",
    bankAccount: "•••• 4821",
    parentName: "A. Okoro",
    amount: 4250000,
    transactionRef: "TRX-792481",
    status: "Failed",
  },
  {
    id: "dsb-4",
    reference: "DSB-004821/APP-30918",
    date: "10 Oct 2026",
    schoolName: "Greenfield International School",
    bankAccount: "•••• 4821",
    parentName: "A. Okoro",
    amount: 4250000,
    transactionRef: "TRX-792481",
    status: "Processing",
  },
  {
    id: "dsb-5",
    reference: "DSB-004821/APP-30918",
    date: "10 Oct 2026",
    schoolName: "Greenfield International School",
    bankAccount: "•••• 4821",
    parentName: "A. Okoro",
    amount: 4250000,
    transactionRef: "TRX-792481",
    status: "Failed",
  },
  {
    id: "dsb-6",
    reference: "DSB-004821/APP-30918",
    date: "10 Oct 2026",
    schoolName: "Greenfield International School",
    bankAccount: "•••• 4821",
    parentName: "A. Okoro",
    amount: 4250000,
    transactionRef: "TRX-792481",
    status: "Completed",
  },
];

// --- Data for School Verification Status Screen ---
export interface SchoolVerificationItem {
  id: string;
  schoolName: string;
  schoolCode: string;
  bankAccount: string;
  status: "Verified" | "Re-verification due" | "Pending review" | "Unverified";
  lastVerified: string;
  issuesCount: number;
  paymentsBlocked: boolean;
  linkedLoansCount: number;
}

export const SCHOOL_VERIFICATION_ITEMS: SchoolVerificationItem[] = [
  {
    id: "sv-1",
    schoolName: "Greenfield International",
    schoolCode: "SCH-0142",
    bankAccount: "•••• 4821",
    status: "Verified",
    lastVerified: "12 Aug 2026",
    issuesCount: 0,
    paymentsBlocked: false,
    linkedLoansCount: 412,
  },
  {
    id: "sv-2",
    schoolName: "Crestview Academy",
    schoolCode: "SCH-0207",
    bankAccount: "•••• 7730",
    status: "Re-verification due",
    lastVerified: "12 Aug 2026",
    issuesCount: 0,
    paymentsBlocked: false,
    linkedLoansCount: 180,
  },
  {
    id: "sv-3",
    schoolName: "Greenfield International",
    schoolCode: "SCH-0142",
    bankAccount: "•••• 7730",
    status: "Verified",
    lastVerified: "12 Aug 2026",
    issuesCount: 0,
    paymentsBlocked: false,
    linkedLoansCount: 220,
  },
  {
    id: "sv-4",
    schoolName: "Rosehill College",
    schoolCode: "SCH-0215",
    bankAccount: "•••• 7730",
    status: "Pending review",
    lastVerified: "12 Aug 2026",
    issuesCount: 1,
    paymentsBlocked: true,
    linkedLoansCount: 95,
  },
  {
    id: "sv-5",
    schoolName: "Lakeside Preparatory",
    schoolCode: "SCH-0388",
    bankAccount: "•••• 7730",
    status: "Unverified",
    lastVerified: "12 Aug 2026",
    issuesCount: 1,
    paymentsBlocked: true,
    linkedLoansCount: 64,
  },
  {
    id: "sv-6",
    schoolName: "Maple Ridge Academy",
    schoolCode: "SCH-0322",
    bankAccount: "•••• 7730",
    status: "Unverified",
    lastVerified: "12 Aug 2026",
    issuesCount: 2,
    paymentsBlocked: true,
    linkedLoansCount: 42,
  },
];

// --- Data for Repayments & Collections Flow ---
export interface ParentRepaymentRecord {
  id: string;
  parentName: string;
  schoolName: string;
  loanId: string;
  amountDue: number;
  amountPaid: number;
  totalRepayable: number;
  outstanding: number;
  nextDue: string;
  status: "On track" | "Due soon" | "Grace period" | "Overdue" | "Defaulted";
  daysOverdue?: number;
  lateFees?: number;
  instalmentAmount?: number;
}

export const PARENT_REPAYMENTS_DATA: ParentRepaymentRecord[] = [
  {
    id: "rep-1",
    parentName: "A. Okoro",
    schoolName: "Greenfield International School",
    loanId: "LN-72071",
    amountDue: 125000,
    amountPaid: 1750000,
    totalRepayable: 3120000,
    outstanding: 1370000,
    nextDue: "28 Oct 2026",
    status: "On track",
    instalmentAmount: 160000,
  },
  {
    id: "rep-2",
    parentName: "A. Okoro",
    schoolName: "Greenfield International School",
    loanId: "LN-72071",
    amountDue: 125000,
    amountPaid: 1750000,
    totalRepayable: 3120000,
    outstanding: 1370000,
    nextDue: "28 Oct 2026",
    status: "Due soon",
    instalmentAmount: 160000,
  },
  {
    id: "rep-3",
    parentName: "A. Okoro",
    schoolName: "Greenfield International School",
    loanId: "LN-72071",
    amountDue: 125000,
    amountPaid: 1750000,
    totalRepayable: 3120000,
    outstanding: 1370000,
    nextDue: "28 Oct 2026",
    status: "Grace period",
    daysOverdue: 6,
    instalmentAmount: 160000,
  },
  {
    id: "rep-4",
    parentName: "B. Musa",
    schoolName: "Greenfield International School",
    loanId: "LN-72071",
    amountDue: 160000,
    amountPaid: 1920000,
    totalRepayable: 3120000,
    outstanding: 1200000,
    nextDue: "28 Oct 2026",
    status: "Overdue",
    daysOverdue: 32,
    lateFees: 20000,
    instalmentAmount: 160000,
  },
  {
    id: "rep-5",
    parentName: "A. Okoro",
    schoolName: "Greenfield International School",
    loanId: "LN-72071",
    amountDue: 125000,
    amountPaid: 1750000,
    totalRepayable: 3120000,
    outstanding: 1370000,
    nextDue: "28 Oct 2026",
    status: "On track",
    instalmentAmount: 160000,
  },
  {
    id: "rep-6",
    parentName: "A. Okoro",
    schoolName: "Greenfield International School",
    loanId: "LN-72071",
    amountDue: 125000,
    amountPaid: 1750000,
    totalRepayable: 3120000,
    outstanding: 1370000,
    nextDue: "28 Oct 2026",
    status: "Defaulted",
    daysOverdue: 94,
    lateFees: 45000,
    instalmentAmount: 160000,
  },
];

export const AGING_OVERDUE_BUCKETS = [
  { bucket: "Current (within grace period)", amount: "₦351.4M", count: 1840, percentage: 85.2, color: "#10b981" },
  { bucket: "1 - 30 days overdue", amount: "₦28.2M", count: 142, percentage: 6.8, color: "#f59e0b" },
  { bucket: "31 - 60 days overdue", amount: "₦18.6M", count: 62, percentage: 4.5, color: "#f97316" },
  { bucket: "61 - 90 days overdue", amount: "₦9.4M", count: 28, percentage: 2.3, color: "#ef4444" },
  { bucket: "90+ days overdue", amount: "₦4.9M", count: 12, percentage: 1.2, color: "#700936" },
];

export const SCHOOL_OUTSTANDING_BREAKDOWN = [
  { school: "Greenfield International", balance: "₦142.1M", loans: 680, percentage: 34.4, color: "#700936" },
  { school: "Rosehill College", balance: "₦98.5M", loans: 490, percentage: 23.9, color: "#9f1239" },
  { school: "Crestview Academy", balance: "₦82.4M", loans: 420, percentage: 20.0, color: "#be123c" },
  { school: "Lakeside Preparatory", balance: "₦54.2M", loans: 340, percentage: 13.1, color: "#e11d48" },
  { school: "Maple Ridge Academy", balance: "₦35.3M", loans: 254, percentage: 8.6, color: "#fb7185" },
];

// --- Data for Schools & Loan Records screen ---
export interface SchoolDirectoryItem {
  id: string;
  name: string;
  code: string;
  bankAccount: string;
  totalDisbursed: string;
  outstanding: string;
  collectionRate: number;
  verification: "Verified" | "Re-verify" | "Blocked" | "Pending";
}

export const SCHOOL_DIRECTORY_DATA: SchoolDirectoryItem[] = [
  {
    id: "sch-1",
    name: "Greenfield International",
    code: "SCH-0142",
    bankAccount: "•••• 4821",
    totalDisbursed: "₦185.6M",
    outstanding: "₦78.0M",
    collectionRate: 74,
    verification: "Verified",
  },
  {
    id: "sch-2",
    name: "Crestview Academy",
    code: "SCH-0207",
    bankAccount: "•••• 7730",
    totalDisbursed: "₦71.0M",
    outstanding: "₦31.5M",
    collectionRate: 88,
    verification: "Re-verify",
  },
  {
    id: "sch-3",
    name: "Rosehill College",
    code: "SCH-0215",
    bankAccount: "•••• 1098",
    totalDisbursed: "₦55.3M",
    outstanding: "₦18.1M",
    collectionRate: 71,
    verification: "Verified",
  },
  {
    id: "sch-4",
    name: "Lakeside Preparatory",
    code: "SCH-0388",
    bankAccount: "•••• 5512",
    totalDisbursed: "₦44.7M",
    outstanding: "₦0",
    collectionRate: 21,
    verification: "Blocked",
  },
  {
    id: "sch-5",
    name: "Bright Future School",
    code: "SCH-0221",
    bankAccount: "•••• 5179",
    totalDisbursed: "₦32.5M",
    outstanding: "₦8.7M",
    collectionRate: 62,
    verification: "Pending",
  },
];

export interface LinkedLoanItem {
  id: string;
  loanId: string;
  applicationId: string;
  schoolName: string;
  parentName: string;
  outstanding: string;
  repaymentAmount: string;
  status: "Overdue" | "Active";
}

export const LINKED_LOANS_DATA: LinkedLoanItem[] = [
  {
    id: "ll-1",
    loanId: "LN-22071",
    applicationId: "APP-30918",
    schoolName: "Greenfield Int.",
    parentName: "M. Ibrahim",
    outstanding: "₦160,000",
    repaymentAmount: "₦160,000",
    status: "Overdue",
  },
  {
    id: "ll-2",
    loanId: "LN-22035",
    applicationId: "APP-30911",
    schoolName: "Crestview Academy",
    parentName: "O. Okafor",
    outstanding: "₦200,000",
    repaymentAmount: "₦96,000",
    status: "Active",
  },
];

// --- Data for Overdue Accounts Screen (Image 2) ---
export interface OverdueQueueItem {
  id: string;
  parentName: string;
  loanId: string;
  schoolName: string;
  amountDue: string;
  daysOverdue: number;
  lastPaymentDate: string;
  assignedOfficer: string;
  status: "Escalated" | "Restricted" | "Overdue" | "Follow-up";
  statusVariant: "pink" | "gray" | "blue" | "yellow";
}

export const OVERDUE_QUEUE_DATA: OverdueQueueItem[] = [
  {
    id: "ovd-1",
    parentName: "A. Okoro",
    loanId: "LN-22071",
    schoolName: "Greenfield Int.",
    amountDue: "₦125,000",
    daysOverdue: 42,
    lastPaymentDate: "12 Aug 2026",
    assignedOfficer: "M. James",
    status: "Escalated",
    statusVariant: "pink",
  },
  {
    id: "ovd-2",
    parentName: "B. Musa",
    loanId: "LN-20051",
    schoolName: "Greenfield Int.",
    amountDue: "₦145,000",
    daysOverdue: 37,
    lastPaymentDate: "17 Aug 2026",
    assignedOfficer: "M. James",
    status: "Restricted",
    statusVariant: "gray",
  },
  {
    id: "ovd-3",
    parentName: "A. Okoro",
    loanId: "LN-22071",
    schoolName: "Greenfield Int.",
    amountDue: "₦125,000",
    daysOverdue: 42,
    lastPaymentDate: "12 Aug 2026",
    assignedOfficer: "M. James",
    status: "Escalated",
    statusVariant: "pink",
  },
  {
    id: "ovd-4",
    parentName: "B. Musa",
    loanId: "LN-20051",
    schoolName: "Greenfield Int.",
    amountDue: "₦145,000",
    daysOverdue: 37,
    lastPaymentDate: "17 Aug 2026",
    assignedOfficer: "M. James",
    status: "Overdue",
    statusVariant: "blue",
  },
  {
    id: "ovd-5",
    parentName: "A. Okoro",
    loanId: "LN-22071",
    schoolName: "Greenfield Int.",
    amountDue: "₦125,000",
    daysOverdue: 42,
    lastPaymentDate: "12 Aug 2026",
    assignedOfficer: "M. James",
    status: "Follow-up",
    statusVariant: "yellow",
  },
];

// --- Data for Collection Follow-up Screen (Image 3) ---
export interface CollectionFollowUpItem {
  id: string;
  parentName: string;
  loanId: string;
  outstanding: string;
  lastContact: string;
  promiseDate: string;
  nextAction: string;
  owner: string;
  priority: "High" | "Escalated" | "On track";
  priorityVariant: "pink" | "blue" | "green";
}

export const COLLECTION_FOLLOW_UP_DATA: CollectionFollowUpItem[] = [
  {
    id: "cfu-1",
    parentName: "A. Okoro",
    loanId: "LN-20071",
    outstanding: "₦185,000",
    lastContact: "Call · 10 Oct",
    promiseDate: "15 Oct 2026",
    nextAction: "Call parent",
    owner: "M. James",
    priority: "High",
    priorityVariant: "pink",
  },
  {
    id: "cfu-2",
    parentName: "A. Okoro",
    loanId: "LN-22071",
    outstanding: "₦125,000",
    lastContact: "Call · 10 Oct",
    promiseDate: "15 Oct 2026",
    nextAction: "Call parent",
    owner: "M. James",
    priority: "High",
    priorityVariant: "pink",
  },
  {
    id: "cfu-3",
    parentName: "A. Okoro",
    loanId: "LN-20071",
    outstanding: "₦185,000",
    lastContact: "Call · 10 Oct",
    promiseDate: "15 Oct 2026",
    nextAction: "Call parent",
    owner: "M. James",
    priority: "Escalated",
    priorityVariant: "blue",
  },
  {
    id: "cfu-4",
    parentName: "A. Okoro",
    loanId: "LN-22071",
    outstanding: "₦125,000",
    lastContact: "Call · 10 Oct",
    promiseDate: "15 Oct 2026",
    nextAction: "Call parent",
    owner: "M. James",
    priority: "Escalated",
    priorityVariant: "pink",
  },
  {
    id: "cfu-5",
    parentName: "A. Okoro",
    loanId: "LN-20071",
    outstanding: "₦185,000",
    lastContact: "Call · 10 Oct",
    promiseDate: "15 Oct 2026",
    nextAction: "Call parent",
    owner: "M. James",
    priority: "On track",
    priorityVariant: "green",
  },
];

// --- Data for Financial Reports & Analytics Screen (Image 4 & 5) ---
export interface FinancialReportItem {
  id: string;
  name: string;
  coverage: string;
  lastGenerated: string;
  generatedBy: string;
  format: "CSV" | "XLSX" | "PDF";
}

export const FINANCIAL_REPORTS_LIST: FinancialReportItem[] = [
  {
    id: "fr-1",
    name: "Disbursement report",
    coverage: "Oct 2025 – Sep 2026",
    lastGenerated: "10 Oct 2026",
    generatedBy: "A. Musa",
    format: "CSV",
  },
  {
    id: "fr-2",
    name: "Repayment report",
    coverage: "Oct 2025 – Sep 2026",
    lastGenerated: "10 Oct 2026",
    generatedBy: "A. Musa",
    format: "XLSX",
  },
  {
    id: "fr-3",
    name: "Overdue & aging portfolio report",
    coverage: "Oct 2025 – Sep 2026",
    lastGenerated: "10 Oct 2026",
    generatedBy: "A. Musa",
    format: "PDF",
  },
  {
    id: "fr-4",
    name: "School disbursement settlement statement",
    coverage: "Oct 2025 – Sep 2026",
    lastGenerated: "09 Oct 2026",
    generatedBy: "System",
    format: "CSV",
  },
];

export const FINANCIAL_PORTFOLIO_BARS = [
  { month: "Apr", disbursed: 42000000, repaid: 35000000 },
  { month: "May", disbursed: 65000000, repaid: 48000000 },
  { month: "Jun", disbursed: 58000000, repaid: 45000000 },
  { month: "Jul", disbursed: 92000000, repaid: 68000000 },
  { month: "Aug", disbursed: 84000000, repaid: 72000000 },
  { month: "Sep", disbursed: 88000000, repaid: 69000000 },
];

// --- Data for Audit Logs & Settings Screen (Screenshot 1) ---
export interface FinancialAuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  reference: string;
  outcome: "Success" | "Pending approval" | "Flagged" | "Blocked";
  outcomeVariant: "green" | "yellow" | "pink" | "red";
  details: string;
}

export const FINANCIAL_AUDIT_LOGS: FinancialAuditLogItem[] = [
  {
    id: "aud-1",
    timestamp: "10 Oct · 11:42",
    user: "A. Bello",
    action: "Changed institution account",
    reference: "LN-72071",
    outcome: "Success",
    outcomeVariant: "green",
    details: "Account verified",
  },
  {
    id: "aud-2",
    timestamp: "10 Oct · 11:38",
    user: "M. James",
    action: "Initiated disbursement",
    reference: "DSB-004821",
    outcome: "Pending approval",
    outcomeVariant: "yellow",
    details: "Sent to Approver",
  },
  {
    id: "aud-3",
    timestamp: "10 Oct · 11:21",
    user: "A. Bello",
    action: "Reconciliation review",
    reference: "TXN-009823",
    outcome: "Flagged",
    outcomeVariant: "pink",
    details: "Settlement mismatch",
  },
  {
    id: "aud-4",
    timestamp: "10 Oct · 09:54",
    user: "E. Momoh",
    action: "Batch payment import",
    reference: "IMP-7721",
    outcome: "Success",
    outcomeVariant: "green",
    details: "148 payments",
  },
  {
    id: "aud-5",
    timestamp: "10 Oct · 08:35",
    user: "System",
    action: "Bank verification check",
    reference: "SCH-0388",
    outcome: "Blocked",
    outcomeVariant: "red",
    details: "Account unverified",
  },
];
