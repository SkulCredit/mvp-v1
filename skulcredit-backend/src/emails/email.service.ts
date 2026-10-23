import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../config/logger';

import {
  emailVerificationTemplate,
  otpEmailTemplate,
  passwordResetTemplate,
  loginAlertTemplate,
  accountLockedTemplate,
  passwordChangedTemplate,
} from './templates/auth.templates';

import {
  schoolVerificationRegisteredTemplate,
  schoolVerificationUnregisteredTemplate,
  parentServiceChargeTemplate,
  parentApplicationRejectedTemplate,
  parentDisbursedTemplate,
  parentDisbursementFailedTemplate,
} from './templates/school.templates';

import {
  applicationReceivedTemplate,
  fundingRequestTemplate,
  type FundingRequestScheduleRow,
} from './templates/parent.templates';

import {
  upcomingRepaymentTemplate,
  overdueRepaymentTemplate,
} from './templates/repayment.templates';

import {
  ticketCreatedTemplate,
  ticketStatusUpdateTemplate,
  ticketReplyTemplate,
  ticketEscalatedTemplate,
  managerEscalationTemplate,
} from './templates/support.templates';


class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (env.smtp.host && env.smtp.user) {
      this.transporter = nodemailer.createTransport({
        host:   env.smtp.host,
        port:   env.smtp.port,
        secure: env.smtp.port === 465,
        auth:   { user: env.smtp.user, pass: env.smtp.pass },
        tls:    { rejectUnauthorized: false },
      });
    } else {
      logger.warn('[EmailService] SMTP credentials not configured — emails will not be delivered');
      this.transporter = nodemailer.createTransport({ host: 'localhost', port: 25 });
    }
    this.transporter.verify((err) => {
      if (err) {
        logger.error(`[EmailService] SMTP connection failed: ${err.message}`);
      } else {
        logger.info(`[EmailService] SMTP ready — ${env.smtp.host}:${env.smtp.port}`);
      }
    });
  }
  private async send(opts: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    logger.info(`[EmailService] Sending "${opts.subject}" → ${opts.to}`);
    const info = await this.transporter.sendMail({
      from:    `"SkulCredit Team" <${env.smtp.user ?? 'noreply@skulcredit.com'}>`,
      to:      opts.to,
      subject: opts.subject,
      text:    opts.text,
      html:    opts.html,
    });
    logger.info(`[EmailService] Sent "${opts.subject}" → ${opts.to} (${info.messageId})`);
  }

  async sendEmailVerification(opts: { email: string; name: string; verifyUrl: string }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: 'Verify your SkulCredit email address',
      text:    `Click the link to verify your email: ${opts.verifyUrl}`,
      html:    emailVerificationTemplate({ name: opts.name, verifyUrl: opts.verifyUrl }),
    });
  }

  async sendOtp(opts: { email: string; otp: string }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: 'Your SkulCredit verification code',
      text:    `Your SkulCredit verification code is: ${opts.otp}. It expires in 30 minutes.`,
      html:    otpEmailTemplate({ email: opts.email, otp: opts.otp }),
    });
  }

  async sendPasswordReset(opts: { email: string; resetUrl: string }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: 'Reset your SkulCredit password',
      text:    `Use this link to reset your password (valid 15 minutes): ${opts.resetUrl}`,
      html:    passwordResetTemplate({ resetUrl: opts.resetUrl }),
    });
  }

  async sendLoginAlert(opts: { email: string; ip: string; device: string }): Promise<void> {
    const time = new Date().toUTCString();
    await this.send({
      to:      opts.email,
      subject: 'New login to your SkulCredit account',
      text:    `A new login was detected on your SkulCredit account from ${opts.ip}.`,
      html:    loginAlertTemplate({ ip: opts.ip, device: opts.device, time }),
    });
  }

  async sendAccountLocked(opts: { email: string; minutes: number }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: 'Your SkulCredit account has been temporarily locked',
      text:    `Your account has been locked for ${opts.minutes} minutes due to too many failed login attempts.`,
      html:    accountLockedTemplate({ minutes: opts.minutes }),
    });
  }

  async sendPasswordChanged(opts: { email: string }): Promise<void> {
    const time = new Date().toUTCString();
    await this.send({
      to:      opts.email,
      subject: 'Your SkulCredit password has been changed',
      text:    'Your SkulCredit account password was recently changed.',
      html:    passwordChangedTemplate({ time }),
    });
  }

  async sendSchoolVerificationRegistered(opts: {
    email: string;
    schoolName: string;
    studentName: string;
    admissionNumber: string;
    gradeLevel: string;
    parentName: string;
    tuitionAmount: string;
    referenceNumber: string;
    verifyLink: string;
    loginLink: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `SkulCredit: Application Verification Required — ${opts.referenceNumber}`,
      text:    `A parent has submitted a tuition financing application for a student at your school. Please log in to verify.`,
      html:    schoolVerificationRegisteredTemplate(opts),
    });
  }

  async sendSchoolVerificationUnregistered(opts: {
    email: string;
    schoolName: string;
    studentName: string;
    admissionNumber: string;
    gradeLevel: string;
    parentName: string;
    tuitionAmount: string;
    referenceNumber: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: 'SkulCredit: Tuition Financing Application for a Student at Your School',
      text:    `A parent has applied to pay school fees for a student at your school through SkulCredit.`,
      html:    schoolVerificationUnregisteredTemplate(opts),
    });
  }

  async sendApplicationReceived(opts: {
    email: string;
    parentName: string;
    referenceNumber: string;
    studentName: string;
    schoolName: string;
    repaymentPlan: string;
    totalAmount: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Application Received — ${opts.referenceNumber}`,
      text:    `Your application for ${opts.studentName} has been received and is under review.`,
      html:    applicationReceivedTemplate(opts),
    });
  }

  async sendServiceCharge(opts: {
    email: string;
    parentName: string;
    studentName: string;
    schoolName: string;
    referenceNumber: string;
    tuitionAmount: string;
    serviceCharge: string;
    serviceChargeLink: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Application Accepted — Pay Service Charge to Continue (${opts.referenceNumber})`,
      text:    'Your application has been accepted. Complete the next step by paying the service charge.',
      html:    parentServiceChargeTemplate(opts),
    });
  }

  async sendApplicationRejected(opts: {
    email: string;
    parentName: string;
    studentName: string;
    schoolName: string;
    referenceNumber: string;
    reason: string;
    applicationsLink: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Application Update — ${opts.referenceNumber}`,
      text:    `Your application for ${opts.studentName} could not be accepted.`,
      html:    parentApplicationRejectedTemplate(opts),
    });
  }

  async sendDisbursementConfirmed(opts: {
    email: string;
    parentName: string;
    amount: string;
    referenceNumber: string;
    repaymentLink: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `School Fees Disbursed — ${opts.referenceNumber}`,
      text:    `${opts.amount} has been successfully disbursed to the school.`,
      html:    parentDisbursedTemplate(opts),
    });
  }

  async sendDisbursementFailed(opts: {
    email: string;
    parentName: string;
    referenceNumber: string;
    reason?: string;
    applicationsLink: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Disbursement Issue — ${opts.referenceNumber}`,
      text:    'There was an issue with the disbursement of your tuition loan. Our team will be in touch.',
      html:    parentDisbursementFailedTemplate(opts),
    });
  }

  async sendFundingRequest(opts: {
    email: string;
    recipientName: string;
    referenceNumber: string;
    parentName: string;
    studentName: string;
    admissionNumber: string;
    gradeLevel: string;
    schoolName: string;
    schoolTier: string;
    repaymentPlan: string;
    serviceChargePaid: string;
    amountToDisburse: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    scheduleRows: FundingRequestScheduleRow[];
    adminLink: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Funding Request — ${opts.referenceNumber}`,
      text:    'A tuition financing application is ready for funding. Please review the details and confirm disbursement.',
      html:    fundingRequestTemplate(opts),
    });
  }

  async sendUpcomingRepaymentReminder(opts: {
    email: string;
    parentName: string;
    daysUntilDue: number;
    dueDate: string;
    amount: string;
    installment: number;
    applicationRef: string;
    repaymentUrl: string;
  }): Promise<void> {
    const subjectDue =
      opts.daysUntilDue === 0 ? 'Today' :
      opts.daysUntilDue === 1 ? 'Tomorrow' :
      `In ${opts.daysUntilDue} Days`;

    await this.send({
      to:      opts.email,
      subject: `Repayment Due ${subjectDue} — ${opts.applicationRef}`,
      text:    `Your repayment of ${opts.amount} is due ${subjectDue.toLowerCase()}.`,
      html:    upcomingRepaymentTemplate(opts),
    });
  }

  async sendOverdueRepaymentReminder(opts: {
    email: string;
    parentName: string;
    daysOverdue: number;
    dueDate: string;
    amount: string;
    installment: number;
    applicationRef: string;
    repaymentUrl: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Overdue Repayment Day ${opts.daysOverdue} — ${opts.applicationRef}`,
      text:    `Your repayment of ${opts.amount} is ${opts.daysOverdue} day${opts.daysOverdue !== 1 ? 's' : ''} overdue.`,
      html:    overdueRepaymentTemplate(opts),
    });
  }

  async sendTicketCreated(opts: {
    email: string;
    recipientName: string;
    ticketNumber: string;
    subject: string;
    category: string;
    trackUrl: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Ticket Created — ${opts.ticketNumber}`,
      text:    `Your support ticket ${opts.ticketNumber} has been created.`,
      html:    ticketCreatedTemplate(opts),
    });
  }

  async sendTicketStatusUpdate(opts: {
    email: string;
    recipientName: string;
    ticketNumber: string;
    subject: string;
    oldStatus: string;
    newStatus: string;
    note?: string | null;
    trackUrl: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Ticket Update — ${opts.ticketNumber}`,
      text:    `Your support ticket ${opts.ticketNumber} status has been updated to ${opts.newStatus}.`,
      html:    ticketStatusUpdateTemplate(opts),
    });
  }

  async sendTicketReply(opts: {
    email: string;
    recipientName: string;
    ticketNumber: string;
    subject: string;
    message: string;
    agentName: string;
    trackUrl: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `New Reply — ${opts.ticketNumber}`,
      text:    `You have a new reply on your support ticket ${opts.ticketNumber}.`,
      html:    ticketReplyTemplate(opts),
    });
  }

  async sendTicketEscalated(opts: {
    email: string;
    recipientName: string;
    ticketNumber: string;
    subject: string;
    managerName: string;
    trackUrl: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Ticket Escalated — ${opts.ticketNumber}`,
      text:    `Your support ticket ${opts.ticketNumber} has been escalated for priority handling.`,
      html:    ticketEscalatedTemplate(opts),
    });
  }

  async sendManagerEscalation(opts: {
    email: string;
    managerName: string;
    ticketNumber: string;
    subject: string;
    customerName: string;
    escalatedByName: string;
    note?: string | null;
    ticketUrl: string;
  }): Promise<void> {
    await this.send({
      to:      opts.email,
      subject: `Action Required: Ticket ${opts.ticketNumber} Escalated to You`,
      text:    `Ticket ${opts.ticketNumber} has been escalated to you by ${opts.escalatedByName}.`,
      html:    managerEscalationTemplate(opts),
    });
  }
}

export default new EmailService();
