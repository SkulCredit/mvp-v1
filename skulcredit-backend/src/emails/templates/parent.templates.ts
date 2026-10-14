/**
 * parent.templates.ts
 *
 * HTML templates for parent-facing transactional emails:
 *   - Application received confirmation
 *   - Funding request (sent to funding partners)
 */

import { emailLayout, ctaButton, noticeBox, infoCard } from './base.template';


export function applicationReceivedTemplate(opts: {
  parentName: string;
  referenceNumber: string;
  studentName: string;
  schoolName: string;
  repaymentPlan: string;
  totalAmount: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      We've received your tuition application and it's now under review. Here's a summary:
    </p>
    ${infoCard([
      { label: 'Application ID',  value: opts.referenceNumber },
      { label: 'Student',         value: opts.studentName },
      { label: 'School',          value: opts.schoolName },
      { label: 'Repayment Plan',  value: opts.repaymentPlan },
      { label: 'Total Amount',    value: opts.totalAmount },
    ])}
    ${noticeBox(
      '<strong>Status: Under Review</strong><br>You\'ll receive another email once a decision has been made.',
    )}
    <p style="margin:0;font-size:13px;color:#6b7280">
      If you have questions, reply to this email or contact support.<br><br>
      The SkulCredit Team
    </p>`;

  return emailLayout({
    headerTitle: `Application Received — ${opts.referenceNumber}`,
    headerSubtitle: 'Application Confirmation',
    content,
  });
}

export interface FundingRequestScheduleRow {
  installment: number;
  dueDate: string;
  amount: string;
}

export function fundingRequestTemplate(opts: {
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
}): string {
  const scheduleHtml = opts.scheduleRows.map(row => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">#${row.installment}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">${row.dueDate}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:bold">${row.amount}</td>
    </tr>`).join('');

  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hello ${opts.recipientName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      A tuition financing application has been fully processed and is ready for disbursement.
      The parent has paid the service charge and confirmed their repayment plan.
      Please review the details below and action the disbursement.
    </p>

    <p style="font-size:15px;font-weight:700;color:#7A0E42;border-bottom:2px solid #fdf4f7;
              padding-bottom:8px;margin-bottom:12px">Application Summary</p>
    ${infoCard([
      { label: 'Application ID',    value: opts.referenceNumber },
      { label: 'Parent Name',       value: opts.parentName },
      { label: 'Student Name',      value: opts.studentName },
      { label: 'Admission Number',  value: opts.admissionNumber },
      { label: 'Grade / Level',     value: opts.gradeLevel },
      { label: 'School',            value: opts.schoolName },
      { label: 'School Tier',       value: opts.schoolTier },
      { label: 'Repayment Plan',    value: opts.repaymentPlan },
      { label: 'Service Charge Paid', value: opts.serviceChargePaid },
      { label: 'Amount to Disburse',  value: opts.amountToDisburse },
    ])}

    <p style="font-size:15px;font-weight:700;color:#7A0E42;border-bottom:2px solid #fdf4f7;
              padding-bottom:8px;margin:24px 0 12px">Disbursement Account</p>
    ${infoCard([
      { label: 'Bank',           value: opts.bankName },
      { label: 'Account Number', value: opts.accountNumber },
      { label: 'Account Name',   value: opts.accountName },
    ])}

    <p style="font-size:15px;font-weight:700;color:#7A0E42;border-bottom:2px solid #fdf4f7;
              padding-bottom:8px;margin:24px 0 12px">Repayment Schedule</p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;margin-bottom:24px;background:#fdf4f7;border-radius:8px">
      <thead>
        <tr style="background:#f5dde7">
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#7A0E42">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#7A0E42">Due Date</th>
          <th style="padding:10px 12px;text-align:left;font-size:13px;color:#7A0E42">Amount</th>
        </tr>
      </thead>
      <tbody>${scheduleHtml}</tbody>
    </table>

    ${ctaButton('View in Admin Portal', opts.adminLink)}`;

  return emailLayout({
    headerTitle: `Funding Request — ${opts.referenceNumber}`,
    headerSubtitle: 'Ready for Disbursement',
    content,
  });
}
