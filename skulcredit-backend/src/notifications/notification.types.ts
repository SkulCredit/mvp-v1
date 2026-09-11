import type { NotificationType } from '../types';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

export interface ApplicationSubmittedPayload extends NotificationPayload {
  type: 'application_submitted';
  referenceId: string;
  referenceType: 'loan_application';
}

export interface ApplicationApprovedPayload extends NotificationPayload {
  type: 'application_approved';
  referenceId: string;
  referenceType: 'loan_application';
}

export interface ApplicationRejectedPayload extends NotificationPayload {
  type: 'application_rejected';
  referenceId: string;
  referenceType: 'loan_application';
}

export interface ApplicationInfoRequestedPayload extends NotificationPayload {
  type: 'application_info_requested';
  referenceId: string;
  referenceType: 'loan_application';
}

export interface DisbursementCompletedPayload extends NotificationPayload {
  type: 'disbursement_completed';
  referenceId: string;
  referenceType: 'disbursement';
}

export interface DisbursementFailedPayload extends NotificationPayload {
  type: 'disbursement_failed';
  referenceId: string;
  referenceType: 'disbursement';
}

export interface PaymentReceivedPayload extends NotificationPayload {
  type: 'payment_received';
  referenceId: string;
  referenceType: 'repayment';
}

export interface PaymentOverduePayload extends NotificationPayload {
  type: 'payment_overdue';
  referenceId: string;
  referenceType: 'repayment_schedule';
}

export interface SchoolApprovedPayload extends NotificationPayload {
  type: 'school_approved';
  referenceId: string;
  referenceType: 'school';
}

export interface SchoolRejectedPayload extends NotificationPayload {
  type: 'school_rejected';
  referenceId: string;
  referenceType: 'school';
}

export interface AccountActionPayload extends NotificationPayload {
  type: 'account_action';
}

export interface GeneralNotificationPayload extends NotificationPayload {
  type: 'general';
}

export type AnyNotificationPayload =
  | ApplicationSubmittedPayload
  | ApplicationApprovedPayload
  | ApplicationRejectedPayload
  | ApplicationInfoRequestedPayload
  | DisbursementCompletedPayload
  | DisbursementFailedPayload
  | PaymentReceivedPayload
  | PaymentOverduePayload
  | SchoolApprovedPayload
  | SchoolRejectedPayload
  | AccountActionPayload
  | GeneralNotificationPayload;

export const EXCHANGE = 'skulcredit.events';

export const QUEUES = {
  AUTH:         'skulcredit.auth',
  PARENT:       'skulcredit.parent',
  SCHOOL:       'skulcredit.school',
  LOAN:         'skulcredit.loan',
  PAYMENT:      'skulcredit.payment',
  DISBURSEMENT: 'skulcredit.disbursement',
  ADMIN:        'skulcredit.admin',
  NOTIFICATION: 'skulcredit.notification',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];


export const ROUTING_KEYS = {
  // Auth domain
  AUTH_EMAIL_VERIFY:    'auth.email.verification',
  AUTH_OTP_SEND:        'auth.otp.send',
  AUTH_PASSWORD_RESET:  'auth.password.reset',
  AUTH_LOGIN:           'auth.session.login',
  AUTH_ACCOUNT_LOCKED:  'auth.account.locked',

  // Parent domain
  PARENT_KYC_APPROVED:  'parent.kyc.approved',
  PARENT_KYC_FAILED:    'parent.kyc.failed',
  PARENT_PROFILE_UPDATE:'parent.profile.updated',

  // School domain
  SCHOOL_REGISTERED:    'school.registration.submitted',
  SCHOOL_APPROVED:      'school.verification.approved',
  SCHOOL_REJECTED:      'school.verification.rejected',
  SCHOOL_ENROLLMENT:    'school.enrollment.verified',

  // Loan domain
  LOAN_SUBMITTED:       'loan.application.submitted',
  LOAN_APPROVED:        'loan.application.approved',
  LOAN_REJECTED:        'loan.application.rejected',
  LOAN_INFO_REQUESTED:  'loan.application.info_requested',
  LOAN_OFFER_CREATED:   'loan.offer.created',
  LOAN_OFFER_ACCEPTED:  'loan.offer.accepted',
  LOAN_OFFER_EXPIRED:   'loan.offer.expired',

  // Payment domain
  PAYMENT_RECEIVED:     'payment.repayment.received',
  PAYMENT_OVERDUE:      'payment.repayment.overdue',
  PAYMENT_FAILED:       'payment.repayment.failed',

  // Disbursement domain
  DISBURSEMENT_INITIATED:  'disbursement.transfer.initiated',
  DISBURSEMENT_COMPLETED:  'disbursement.transfer.completed',
  DISBURSEMENT_FAILED:     'disbursement.transfer.failed',

  // Admin domain
  ADMIN_DECISION:       'admin.decision.made',
  ADMIN_ALERT:          'admin.alert.raised',

  NOTIFICATION_DELIVER: 'notification.deliver',
} as const;

export const NOTIFICATION_ROUTING_KEYS: Record<NotificationType, string> = {
  application_submitted:      ROUTING_KEYS.LOAN_SUBMITTED,
  application_approved:       ROUTING_KEYS.LOAN_APPROVED,
  application_rejected:       ROUTING_KEYS.LOAN_REJECTED,
  application_info_requested: ROUTING_KEYS.LOAN_INFO_REQUESTED,
  disbursement_completed:     ROUTING_KEYS.DISBURSEMENT_COMPLETED,
  disbursement_failed:        ROUTING_KEYS.DISBURSEMENT_FAILED,
  payment_received:           ROUTING_KEYS.PAYMENT_RECEIVED,
  payment_overdue:            ROUTING_KEYS.PAYMENT_OVERDUE,
  school_approved:            ROUTING_KEYS.SCHOOL_APPROVED,
  school_rejected:            ROUTING_KEYS.SCHOOL_REJECTED,
  account_action:             'auth.account.action',
  general:                    'notification.deliver',
};
