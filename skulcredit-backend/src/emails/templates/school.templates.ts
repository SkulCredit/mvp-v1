/**
 * school.templates.ts
 *
 * HTML templates for all school-facing and school-triggered emails:
 *   - School verification request (registered school)
 *   - School verification request (unregistered school contact)
 *   - Parent service charge notification
 *   - Parent application rejected (by school)
 *   - Parent disbursement succeeded
 *   - Parent disbursement failed
 */

import {
  emailLayout,
  ctaButton,
  noticeBox,
  infoCard,
  BRAND_COLOR,
} from './base.template';

export function schoolVerificationRegisteredTemplate(opts: {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  gradeLevel: string;
  parentName: string;
  tuitionAmount: string;
  referenceNumber: string;
  verifyLink: string;
  loginLink: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hello ${opts.schoolName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      A new tuition financing application for <strong>${opts.studentName}</strong>
      needs your confirmation before it can proceed.
    </p>
    ${infoCard([
      { label: 'Student',                value: opts.studentName },
      { label: 'Admission Number',       value: opts.admissionNumber },
      { label: 'Class/Level',            value: opts.gradeLevel },
      { label: 'Parent Name',            value: opts.parentName },
      { label: 'Tuition amount submitted', value: opts.tuitionAmount },
    ])}
    <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6">
      Please confirm this student's enrollment and the tuition amount so the application
      can move to the next stage. Reference: <strong>${opts.referenceNumber}</strong>
    </p>
    ${ctaButton('Review Application', opts.verifyLink)}
    <p style="margin:16px 0 0;font-size:12px;color:#aaa;text-align:center">
      Not logged in?
      <a href="${opts.loginLink}" style="color:${BRAND_COLOR};text-decoration:underline">Sign in here</a>
      — you'll be redirected to this application automatically.
    </p>`;

  return emailLayout({
    headerTitle: `SkulCredit: Application Verification Required — ${opts.referenceNumber}`,
    headerSubtitle: 'School Portal',
    content,
  });
}

export function schoolVerificationUnregisteredTemplate(opts: {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  gradeLevel: string;
  parentName: string;
  tuitionAmount: string;
  referenceNumber: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hello ${opts.schoolName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      A new tuition financing application for <strong>${opts.studentName}</strong>
      at your school has been submitted through <strong>SkulCredit</strong>.
      Our team will be in touch to guide your school through the verification process.
    </p>
    ${infoCard([
      { label: 'Student',                value: opts.studentName },
      { label: 'Admission Number',       value: opts.admissionNumber },
      { label: 'Class/Level',            value: opts.gradeLevel },
      { label: 'Parent Name',            value: opts.parentName },
      { label: 'Tuition amount submitted', value: opts.tuitionAmount },
    ])}
    <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6">
      Please confirm this student's enrollment and the tuition amount so the application
      can move to the next stage. Reference: <strong>${opts.referenceNumber}</strong>
    </p>
    ${noticeBox(
      '<strong>Next Steps:</strong><br>A SkulCredit representative will contact you at this email to verify the student\'s enrollment and fee details before any funds are disbursed.',
    )}`;

  return emailLayout({
    headerTitle: 'SkulCredit: Tuition Financing Application for a Student at Your School',
    headerSubtitle: 'School Portal',
    content,
  });
}

export function parentServiceChargeTemplate(opts: {
  parentName: string;
  studentName: string;
  schoolName: string;
  referenceNumber: string;
  tuitionAmount: string;
  serviceCharge: string;
  serviceChargeLink: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      Your tuition application for <strong>${opts.studentName}</strong>
      at <strong>${opts.schoolName}</strong> has been accepted.
      To proceed, please pay the service charge below.
    </p>
    ${infoCard([
      { label: 'Application ID',   value: opts.referenceNumber },
      { label: 'Approved Tuition', value: opts.tuitionAmount },
      { label: 'Service Charge Due', value: opts.serviceCharge },
    ])}
    ${ctaButton('Pay Service Charge Now →', opts.serviceChargeLink)}
    ${noticeBox(
      '<strong>After paying:</strong> You\'ll set up your repayment plan, then funds will be disbursed directly to the school.',
    )}`;

  return emailLayout({
    headerTitle: `Application Accepted — Pay Service Charge to Continue (${opts.referenceNumber})`,
    headerSubtitle: 'Action Required',
    content,
  });
}

export function parentApplicationRejectedTemplate(opts: {
  parentName: string;
  studentName: string;
  schoolName: string;
  referenceNumber: string;
  reason: string;
  applicationsLink: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      Your tuition application for <strong>${opts.studentName}</strong>
      at <strong>${opts.schoolName}</strong>
      (ref: <strong>${opts.referenceNumber}</strong>) has not been accepted by the school.
    </p>
    ${noticeBox(
      `<strong>Reason provided by school:</strong><br><span style="margin-top:6px;display:block">${opts.reason}</span>`,
      '#b91c1c',
    )}
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6">
      The SkulCredit team will follow up with the school on your behalf.
      You may start a new application or contact our support team for assistance.
    </p>
    ${ctaButton('View My Applications', opts.applicationsLink, '#b91c1c')}`;

  return emailLayout({
    headerTitle: `Application Update — ${opts.referenceNumber}`,
    headerSubtitle: 'Application Status',
    headerColor: '#b91c1c',
    content,
  });
}

export function parentDisbursedTemplate(opts: {
  parentName: string;
  amount: string;
  referenceNumber: string;
  repaymentLink: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      <strong>${opts.amount}</strong> has been successfully transferred to your child's school
      for application <strong>${opts.referenceNumber}</strong>.
      Your repayment schedule is now active.
    </p>
    ${infoCard([
      { label: 'Application',      value: opts.referenceNumber },
      { label: 'Amount Disbursed', value: opts.amount },
    ])}
    ${ctaButton('View Repayment Schedule', opts.repaymentLink, '#16a34a')}`;

  return emailLayout({
    headerTitle: `School Fees Disbursed — ${opts.referenceNumber}`,
    headerSubtitle: 'Disbursement Confirmed',
    headerColor: '#16a34a',
    content,
  });
}

export function parentDisbursementFailedTemplate(opts: {
  parentName: string;
  referenceNumber: string;
  reason?: string;
  applicationsLink: string;
}): string {
  const reasonBlock = opts.reason
    ? noticeBox(`<strong>Reason:</strong> ${opts.reason}`, '#b91c1c')
    : '';

  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      We encountered an issue processing the disbursement for application
      <strong>${opts.referenceNumber}</strong>.
    </p>
    ${reasonBlock}
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6">
      Our team has been notified and will investigate. You will receive an update shortly.
      Please do not make any new payments until you hear from us.
    </p>
    ${ctaButton('View Application', opts.applicationsLink, '#b91c1c')}`;

  return emailLayout({
    headerTitle: `Disbursement Issue — ${opts.referenceNumber}`,
    headerSubtitle: 'Action Required',
    headerColor: '#b91c1c',
    content,
  });
}
