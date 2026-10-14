import { NotificationPublisher } from './rabbitmq.publisher';

class EventNotifier {

  notifyApplicationSubmitted(userId: string, applicationId: string): void {
    NotificationPublisher.applicationSubmitted(userId, applicationId);
  }

  notifyApplicationApproved(userId: string, applicationId: string): void {
    NotificationPublisher.applicationApproved(userId, applicationId);
  }

  notifyApplicationRejected(userId: string, applicationId: string, reason?: string): void {
    NotificationPublisher.applicationRejected(userId, applicationId, reason);
  }

  notifyApplicationInfoRequested(userId: string, applicationId: string, note?: string): void {
    NotificationPublisher.applicationInfoRequested(userId, applicationId, note);
  }

  notifyNewApplicationForSchool(
    schoolUserId: string,
    applicationId: string,
    parentName: string,
    studentName: string,
    amount: number,
  ): void {
    NotificationPublisher.newApplicationForSchool(
      schoolUserId, applicationId, parentName, studentName, amount,
    );
  }

  notifyServiceChargePaid(userId: string, _applicationId: string): void {
    NotificationPublisher.general(
      userId,
      'Service Charge Paid',
      'Your service charge has been received. Your repayment plan is being set up.',
    );
  }

  notifyDisbursementCompleted(userId: string, disbursementId: string, amount: number): void {
    NotificationPublisher.disbursementCompleted(userId, disbursementId, amount);
  }

  notifyDisbursementFailed(userId: string, disbursementId: string): void {
    NotificationPublisher.disbursementFailed(userId, disbursementId);
  }

  notifyPaymentReceived(userId: string, repaymentId: string, amount: number): void {
    NotificationPublisher.paymentReceived(userId, repaymentId, amount);
  }

  notifyPaymentOverdue(userId: string, scheduleId: string, dueDate: string): void {
    NotificationPublisher.paymentOverdue(userId, scheduleId, dueDate);
  }

  notifySchoolApproved(userId: string, schoolId: string): void {
    NotificationPublisher.schoolApproved(userId, schoolId);
  }

  notifySchoolRejected(userId: string, schoolId: string, reason?: string): void {
    NotificationPublisher.schoolRejected(userId, schoolId, reason);
  }

  notifyAccountAction(userId: string, message: string): void {
    NotificationPublisher.accountAction(userId, message);
  }

  notifyKycVerified(userId: string): void {
    NotificationPublisher.accountAction(
      userId,
      'Your identity has been verified and KYC is complete. You can now apply for school fee financing.',
    );
  }

  notifyProfileUpdated(userId: string): void {
    NotificationPublisher.accountAction(userId, 'Your profile has been updated successfully.');
  }

  notifyStudentAdded(userId: string, studentName: string): void {
    NotificationPublisher.general(userId, 'Student Added', `${studentName} has been added to your profile.`);
  }

  notifyGeneral(userId: string, title: string, message: string): void {
    NotificationPublisher.general(userId, title, message);
  }
}

export default new EventNotifier();
