export type UserRole = 'parent' | 'school' | 'admin';

export type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export type SchoolStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type LoanApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'info_requested'
  | 'school_verification'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'repaid'
  | 'cancelled';

export type LoanOfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type RepaymentScheduleStatus =
  | 'upcoming'
  | 'due'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'waived';

export type RepaymentStatus = 'pending' | 'successful' | 'failed' | 'reversed';

export type RepaymentType = 'scheduled' | 'early_partial' | 'early_full' | 'late' | 'manual_reversal';

export type PaymentMethod = 'card' | 'bank_transfer' | 'direct_debit' | 'ussd' | 'manual';

export type DisbursementStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'reversed';

export type ApplicationEventActor = 'system' | 'admin' | 'parent' | 'school';

export type SchoolRequestStatus = 'pending' | 'in_progress' | 'onboarded' | 'rejected';

export type NotificationType =
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'application_info_requested'
  | 'disbursement_completed'
  | 'disbursement_failed'
  | 'payment_received'
  | 'payment_overdue'
  | 'school_approved'
  | 'school_rejected'
  | 'account_action'
  | 'general';

export type LoanOfferSource = 'automated' | 'manual';

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
