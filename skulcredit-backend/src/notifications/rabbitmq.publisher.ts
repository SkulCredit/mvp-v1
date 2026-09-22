import { getRabbitChannel, isRabbitReady } from "../config/rabbitmq";
import {
  EXCHANGE,
  NOTIFICATION_ROUTING_KEYS,
  AnyNotificationPayload,
} from "./notification.types";
import logger from "../config/logger";

function publish(payload: AnyNotificationPayload): void {
  if (!isRabbitReady()) {
    logger.warn(
      `RabbitMQ unavailable — notification not published: ${payload.type}`,
    );
    return;
  }

  const routingKey = NOTIFICATION_ROUTING_KEYS[payload.type];
  const content = Buffer.from(JSON.stringify(payload));

  getRabbitChannel().publish(EXCHANGE, routingKey, content, {
    persistent: true,
    contentType: "application/json",
    timestamp: Date.now(),
  });

  logger.info(`RabbitMQ publish: ${routingKey} → userId=${payload.userId}`);
}

export const NotificationPublisher = {
  applicationSubmitted(userId: string, applicationId: string) {
    publish({
      userId,
      type: "application_submitted",
      title: "Application Submitted",
      message: "Your loan application has been submitted and is under review.",
      referenceId: applicationId,
      referenceType: "loan_application",
    });
  },

  applicationApproved(userId: string, applicationId: string) {
    publish({
      userId,
      type: "application_approved",
      title: "Application Approved",
      message: "Congratulations! Your loan application has been approved.",
      referenceId: applicationId,
      referenceType: "loan_application",
    });
  },

  applicationRejected(userId: string, applicationId: string, reason?: string) {
    publish({
      userId,
      type: "application_rejected",
      title: "Application Rejected",
      message:
        reason ?? "Your loan application could not be approved at this time.",
      referenceId: applicationId,
      referenceType: "loan_application",
    });
  },

  applicationInfoRequested(
    userId: string,
    applicationId: string,
    note?: string,
  ) {
    publish({
      userId,
      type: "application_info_requested",
      title: "Additional Information Required",
      message: note ?? "We need more information to process your application.",
      referenceId: applicationId,
      referenceType: "loan_application",
    });
  },

  disbursementCompleted(
    userId: string,
    disbursementId: string,
    amount: number,
  ) {
    publish({
      userId,
      type: "disbursement_completed",
      title: "Funds Disbursed",
      message: `₦${amount.toLocaleString()} has been successfully disbursed to the school.`,
      referenceId: disbursementId,
      referenceType: "disbursement",
    });
  },

  disbursementFailed(userId: string, disbursementId: string) {
    publish({
      userId,
      type: "disbursement_failed",
      title: "Disbursement Failed",
      message: "We were unable to disburse funds. Our team is looking into it.",
      referenceId: disbursementId,
      referenceType: "disbursement",
    });
  },

  paymentReceived(userId: string, repaymentId: string, amount: number) {
    publish({
      userId,
      type: "payment_received",
      title: "Payment Received",
      message: `Your repayment of ₦${amount.toLocaleString()} has been confirmed.`,
      referenceId: repaymentId,
      referenceType: "repayment",
    });
  },

  paymentOverdue(userId: string, scheduleId: string, dueDate: string) {
    publish({
      userId,
      type: "payment_overdue",
      title: "Payment Overdue",
      message: `Your repayment due on ${dueDate} is overdue. Please make payment immediately.`,
      referenceId: scheduleId,
      referenceType: "repayment_schedule",
    });
  },

  schoolApproved(userId: string, schoolId: string) {
    publish({
      userId,
      type: "school_approved",
      title: "School Approved",
      message: "Your school has been approved as a SkulCredit partner.",
      referenceId: schoolId,
      referenceType: "school",
    });
  },

  schoolRejected(userId: string, schoolId: string, reason?: string) {
    publish({
      userId,
      type: "school_rejected",
      title: "School Application Rejected",
      message:
        reason ?? "Your school application could not be approved at this time.",
      referenceId: schoolId,
      referenceType: "school",
    });
  },

  newApplicationForSchool(
    userId: string,
    applicationId: string,
    parentName: string,
    studentName: string,
    amount: number,
  ) {
    publish({
      userId,
      type: "application_submitted",
      title: "New Tuition Application",
      message: `${parentName} has submitted a tuition application for ${studentName} (₦${amount.toLocaleString("en-NG")}). Review and verify enrollment.`,
      referenceId: applicationId,
      referenceType: "loan_application",
    });
  },

  accountAction(userId: string, message: string) {
    publish({
      userId,
      type: "account_action",
      title: "Account Update",
      message,
    });
  },

  general(userId: string, title: string, message: string) {
    publish({ userId, type: "general", title, message });
  },
};
