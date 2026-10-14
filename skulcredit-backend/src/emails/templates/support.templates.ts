import { emailLayout, infoCard, ctaButton, noticeBox } from '../templates/base.template';

function humanizeStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ticketCreatedTemplate(opts: {
  recipientName: string;
  ticketNumber: string;
  subject: string;
  category: string;
  trackUrl: string;
}): string {
  const card = infoCard([
    { label: 'Ticket #', value: opts.ticketNumber },
    { label: 'Subject', value: opts.subject },
    { label: 'Category', value: humanizeStatus(opts.category) },
    { label: 'Status', value: 'Open' },
  ]);

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#333">Hi ${opts.recipientName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">Your support ticket has been received. Our team will get back to you shortly.</p>
    ${card}
    ${ctaButton('Track Your Ticket', opts.trackUrl)}
  `;

  return emailLayout({
    headerTitle: 'Support Ticket Created',
    headerSubtitle: 'We have received your request',
    content,
  });
}

export function ticketStatusUpdateTemplate(opts: {
  recipientName: string;
  ticketNumber: string;
  subject: string;
  oldStatus: string;
  newStatus: string;
  note?: string | null;
  trackUrl: string;
}): string {
  const card = infoCard([
    { label: 'Ticket #', value: opts.ticketNumber },
    { label: 'Subject', value: opts.subject },
    { label: 'Previous Status', value: humanizeStatus(opts.oldStatus) },
    { label: 'New Status', value: humanizeStatus(opts.newStatus) },
  ]);

  const noteBlock = opts.note ? noticeBox(`<strong>Note:</strong> ${opts.note}`) : '';

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#333">Hi ${opts.recipientName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">Your support ticket status has been updated.</p>
    ${card}
    ${noteBlock}
    ${ctaButton('View Ticket', opts.trackUrl)}
  `;

  return emailLayout({
    headerTitle: 'Ticket Status Updated',
    headerSubtitle: `Ticket ${opts.ticketNumber}`,
    content,
  });
}

export function ticketReplyTemplate(opts: {
  recipientName: string;
  ticketNumber: string;
  subject: string;
  message: string;
  agentName: string;
  trackUrl: string;
}): string {
  const card = infoCard([
    { label: 'Ticket #', value: opts.ticketNumber },
    { label: 'Subject', value: opts.subject },
    { label: 'Reply From', value: opts.agentName },
  ]);

  const messageBlock = noticeBox(opts.message);

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#333">Hi ${opts.recipientName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">You have a new reply on your support ticket.</p>
    ${card}
    ${messageBlock}
    ${ctaButton('View Full Thread', opts.trackUrl)}
  `;

  return emailLayout({
    headerTitle: 'New Reply on Your Ticket',
    headerSubtitle: `Ticket ${opts.ticketNumber}`,
    content,
  });
}

export function ticketEscalatedTemplate(opts: {
  recipientName: string;
  ticketNumber: string;
  subject: string;
  managerName: string;
  trackUrl: string;
}): string {
  const card = infoCard([
    { label: 'Ticket #', value: opts.ticketNumber },
    { label: 'Subject', value: opts.subject },
    { label: 'Escalated To', value: opts.managerName },
  ]);

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#333">Hi ${opts.recipientName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">Your ticket has been escalated to a senior manager for priority handling. We are committed to resolving your issue as quickly as possible.</p>
    ${card}
    ${ctaButton('Track Ticket', opts.trackUrl)}
  `;

  return emailLayout({
    headerTitle: 'Your Ticket Has Been Escalated',
    headerSubtitle: 'Priority handling in progress',
    content,
  });
}

export function managerEscalationTemplate(opts: {
  managerName: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  escalatedByName: string;
  note?: string | null;
  ticketUrl: string;
}): string {
  const card = infoCard([
    { label: 'Ticket #', value: opts.ticketNumber },
    { label: 'Subject', value: opts.subject },
    { label: 'Customer', value: opts.customerName },
    { label: 'Escalated By', value: opts.escalatedByName },
  ]);

  const noteBlock = opts.note ? noticeBox(`<strong>Note:</strong> ${opts.note}`) : '';

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#333">Hi ${opts.managerName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">A support ticket has been escalated to you and requires your attention.</p>
    ${card}
    ${noteBlock}
    ${ctaButton('View Ticket', opts.ticketUrl)}
  `;

  return emailLayout({
    headerTitle: 'Ticket Escalated to You',
    headerSubtitle: 'Action required',
    content,
  });
}
