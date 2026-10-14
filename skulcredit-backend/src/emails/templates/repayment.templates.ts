/**
 * repayment.templates.ts
 *
 * HTML templates for repayment reminder emails:
 *   - Upcoming repayment reminder (due in N days / today / tomorrow)
 *   - Overdue repayment reminder
 */

import { emailLayout, ctaButton, noticeBox, infoCard } from './base.template';

export function upcomingRepaymentTemplate(opts: {
  parentName: string;
  daysUntilDue: number;
  dueDate: string;
  amount: string;
  installment: number;
  applicationRef: string;
  repaymentUrl: string;
}): string {
  const urgencyText =
    opts.daysUntilDue === 0
      ? 'your repayment is <strong>due today</strong>'
      : opts.daysUntilDue === 1
        ? 'your repayment is <strong>due tomorrow</strong>'
        : `your repayment is due in <strong>${opts.daysUntilDue} days</strong>`;

  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      This is a friendly reminder that ${urgencyText} for your SkulCredit tuition loan.
    </p>
    ${infoCard([
      { label: 'Application', value: opts.applicationRef },
      { label: 'Installment', value: `#${opts.installment}` },
      { label: 'Due Date',    value: opts.dueDate },
      { label: 'Amount Due',  value: opts.amount },
    ])}
    ${noticeBox(
      '<strong>Note:</strong> SkulCredit does not charge interest on repayments. Please ensure payment is made on time to avoid reminders.',
    )}
    ${ctaButton('Make Payment Now', opts.repaymentUrl)}`;

  return emailLayout({
    headerTitle: `Repayment Reminder — ${opts.applicationRef}`,
    headerSubtitle: 'Repayment Due',
    content,
  });
}

export function overdueRepaymentTemplate(opts: {
  parentName: string;
  daysOverdue: number;
  dueDate: string;
  amount: string;
  installment: number;
  applicationRef: string;
  repaymentUrl: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">
      Hi ${opts.parentName},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">
      Your repayment for installment <strong>#${opts.installment}</strong> was due on
      <strong>${opts.dueDate}</strong> and is now
      <strong>${opts.daysOverdue} day${opts.daysOverdue !== 1 ? 's' : ''} overdue</strong>.
      Please make payment as soon as possible.
    </p>
    ${infoCard([
      { label: 'Application',    value: opts.applicationRef },
      { label: 'Installment',    value: `#${opts.installment}` },
      { label: 'Originally Due', value: opts.dueDate },
      { label: 'Days Overdue',   value: String(opts.daysOverdue) },
      { label: 'Amount Due',     value: opts.amount },
    ])}
    ${noticeBox(
      '<strong>Important:</strong> SkulCredit does not charge interest, but persistent non-payment may affect your eligibility for future financing.',
      '#b91c1c',
    )}
    ${ctaButton('Pay Now', opts.repaymentUrl, '#b91c1c')}`;

  return emailLayout({
    headerTitle: `Overdue Repayment — Day ${opts.daysOverdue} — ${opts.applicationRef}`,
    headerSubtitle: 'Overdue Notice',
    headerColor: '#b91c1c',
    content,
  });
}
