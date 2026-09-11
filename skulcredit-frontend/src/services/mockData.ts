export interface MockSchool {
  id: string;
  name: string;
  status: 'verified' | 'pending';
  applicationCount: number;
  studentCount: number;
}

export interface MockApplication {
  id: string;
  parentId: string;
  parentName: string;
  studentName: string;
  schoolId: string;
  schoolName: string;
  amount: number;
  status: string;
  date: string;
  emiTerm: number;
  nextPaymentDate: string;
}

export interface MockDisbursement {
  id: string;
  schoolId: string;
  amount: number;
  status: string;
  date: string;
}

export interface MockParentAccount {
  totalLoanAmount: number;
  amountPaid: number;
  balance: number;
  nextPaymentAmount: number;
  nextPaymentDate: string;
}

export const mockSchools: MockSchool[] = [
  { id: 'sch-001', name: 'Foster Prime Schools', status: 'verified', applicationCount: 15, studentCount: 120 },
  { id: 'sch-002', name: 'Gulf Flower Schools', status: 'pending', applicationCount: 2, studentCount: 45 },
];

export const mockApplications: MockApplication[] = [
  {
    id: 'APP-99382',
    parentId: 'par-001',
    parentName: 'John Doe',
    studentName: 'Sarah Doe',
    schoolId: 'sch-001',
    schoolName: 'Foster Prime Schools',
    amount: 750000,
    status: 'pending_school_verification',
    date: 'Oct 12, 2026',
    emiTerm: 3,
    nextPaymentDate: 'Nov 12, 2026',
  },
  {
    id: 'APP-99383',
    parentId: 'par-002',
    parentName: 'Jane Smith',
    studentName: 'Michael Smith',
    schoolId: 'sch-001',
    schoolName: 'Foster Prime Schools',
    amount: 500000,
    status: 'awaiting_disbursement',
    date: 'Oct 14, 2026',
    emiTerm: 4,
    nextPaymentDate: 'Nov 14, 2026',
  },
];

export const mockDisbursements: MockDisbursement[] = [
  { id: 'DIS-001', schoolId: 'sch-001', amount: 1250000, status: 'processing', date: 'Oct 15, 2026' },
];

export const mockParentAccount: MockParentAccount = {
  totalLoanAmount: 750000,
  amountPaid: 0,
  balance: 750000,
  nextPaymentAmount: 250000,
  nextPaymentDate: 'Nov 12, 2026',
};

export const mockParentAccounts = [
  { id: 'PAR-001', name: 'John Doe', email: 'parent@test.com' },
  { id: 'par-002', name: 'Jane Smith', email: 'jane@test.com' },
];
