/**
 * Repayment Reminder Service
 *
 * Runs as a cron job. Checks upcoming and overdue repayment schedules
 * and sends email + in-app reminders to parents.
 *
 * Schedule (started from server.ts):
 *  - Every day at 08:00 WAT: check due-in-3d, due-in-1d, due-today, and overdue
 */

import cron from "node-cron";
import { Op } from "sequelize";
import { RepaymentSchedule, LoanApplication, User } from "../models/index";
import { ParentRepository, UserRepository } from "../repositories";
import sendEmail from "../utils/email";
import { NotificationPublisher } from "../notifications/rabbitmq.publisher";
import logger from "../config/logger";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatNaira(amount: number | string): string {
  return `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Return YYYY-MM-DD in local time (server timezone = WAT) */
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── email templates ───────────────────────────────────────────────────────────

function upcomingReminderHtml(opts: {
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
      ? "your repayment is <strong>due today</strong>"
      : opts.daysUntilDue === 1
        ? "your repayment is <strong>due tomorrow</strong>"
        : `your repayment is due in <strong>${opts.daysUntilDue} days</strong>`;

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
    <div style="background:#881337;padding:28px 32px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:22px">Repayment Reminder</h1>
    </div>
    <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
      <p style="margin:0 0 16px">Hi <strong>${opts.parentName}</strong>,</p>
      <p style="margin:0 0 20px">This is a friendly reminder that ${urgencyText} for your SkulCredit tuition loan.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Application</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${opts.applicationRef}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Installment</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">#${opts.installment}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Due Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${opts.dueDate}</td></tr>
        <tr><td style="padding:10px 0;color:#881337;font-weight:bold;font-size:15px">Amount Due</td>
            <td style="padding:10px 0;color:#881337;font-weight:bold;text-align:right;font-size:15px">${opts.amount}</td></tr>
      </table>
      <div style="background:#fdf4f7;border-left:4px solid #881337;border-radius:6px;padding:14px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#881337">
          <strong>Note:</strong> SkulCredit does not charge interest on repayments. Please ensure payment is made on time to avoid reminders.
        </p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="${opts.repaymentUrl}" style="display:inline-block;background:#881337;color:#fff;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">
          Make Payment Now
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0">The SkulCredit Team</p>
    </div>
  </div>`;
}

function overdueReminderHtml(opts: {
  parentName: string;
  daysOverdue: number;
  dueDate: string;
  amount: string;
  installment: number;
  applicationRef: string;
  repaymentUrl: string;
}): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
    <div style="background:#b91c1c;padding:28px 32px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:22px">⚠️ Overdue Repayment — Day ${opts.daysOverdue}</h1>
    </div>
    <div style="background:#fff;padding:28px 32px;border:1px solid #fca5a5;border-top:none;border-radius:0 0 12px 12px">
      <p style="margin:0 0 16px">Hi <strong>${opts.parentName}</strong>,</p>
      <p style="margin:0 0 20px">
        Your repayment for installment <strong>#${opts.installment}</strong> was due on <strong>${opts.dueDate}</strong>
        and is now <strong>${opts.daysOverdue} day${opts.daysOverdue !== 1 ? "s" : ""} overdue</strong>.
        Please make payment as soon as possible.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Application</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${opts.applicationRef}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Installment</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">#${opts.installment}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px">Originally Due</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right">${opts.dueDate}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#b91c1c;font-weight:bold;font-size:14px">Days Overdue</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;text-align:right;color:#b91c1c">${opts.daysOverdue}</td></tr>
        <tr><td style="padding:10px 0;color:#881337;font-weight:bold;font-size:15px">Amount Due</td>
            <td style="padding:10px 0;color:#881337;font-weight:bold;text-align:right;font-size:15px">${opts.amount}</td></tr>
      </table>
      <div style="background:#fef2f2;border-left:4px solid #b91c1c;border-radius:6px;padding:14px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#b91c1c">
          <strong>Important:</strong> SkulCredit does not charge interest, but persistent non-payment may affect your eligibility for future financing.
        </p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="${opts.repaymentUrl}" style="display:inline-block;background:#b91c1c;color:#fff;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">
          Pay Now
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0">The SkulCredit Team</p>
    </div>
  </div>`;
}

// ── core reminder logic ───────────────────────────────────────────────────────

export async function sendRepaymentReminders(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr   = toDateString(today);
  const in1dayStr  = toDateString(addDays(today, 1));
  const in3dayStr  = toDateString(addDays(today, 3));

  logger.info(`[repaymentReminder] Running for date: ${todayStr}`);

  // ── 1. Upcoming reminders (due in 3 days, 1 day, or today) ────────────────
  const upcomingSchedules = await RepaymentSchedule.findAll({
    where: {
      status: { [Op.in]: ["upcoming", "due"] },
      dueDate: { [Op.in]: [in3dayStr, in1dayStr, todayStr] },
    },
    include: [
      {
        model: LoanApplication,
        as: "loanApplication",
        attributes: ["id", "referenceNumber", "parentId"],
      },
    ],
  });

  for (const schedule of upcomingSchedules) {
    const app = (schedule as unknown as { loanApplication?: { id: string; referenceNumber: string; parentId: string } }).loanApplication;
    if (!app) continue;

    const daysUntilDue =
      schedule.dueDate === todayStr   ? 0 :
      schedule.dueDate === in1dayStr  ? 1 : 3;

    await _notifyParent(app.parentId, {
      type: "upcoming",
      daysUntilDue,
      schedule,
      applicationRef: app.referenceNumber ?? app.id,
    });
  }

  // ── 2. Overdue reminders (every day until paid) ────────────────────────────
  const overdueSchedules = await RepaymentSchedule.findAll({
    where: {
      status: "overdue",
      dueDate: { [Op.lt]: todayStr },
    },
    include: [
      {
        model: LoanApplication,
        as: "loanApplication",
        attributes: ["id", "referenceNumber", "parentId"],
      },
    ],
  });

  for (const schedule of overdueSchedules) {
    const app = (schedule as unknown as { loanApplication?: { id: string; referenceNumber: string; parentId: string } }).loanApplication;
    if (!app) continue;

    const dueDate = new Date(schedule.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);

    await _notifyParent(app.parentId, {
      type: "overdue",
      daysOverdue,
      schedule,
      applicationRef: app.referenceNumber ?? app.id,
    });
  }

  logger.info(
    `[repaymentReminder] Done — upcoming: ${upcomingSchedules.length}, overdue: ${overdueSchedules.length}`,
  );
}

async function _notifyParent(
  parentId: string,
  opts: {
    type: "upcoming" | "overdue";
    daysUntilDue?: number;
    daysOverdue?: number;
    schedule: InstanceType<typeof RepaymentSchedule>;
    applicationRef: string;
  },
): Promise<void> {
  const parent = await ParentRepository.findOne({ id: parentId });
  if (!parent) return;
  const user = await UserRepository.findById(parent.userId);
  if (!user?.email) return;

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const repaymentUrl = `${frontendUrl}/parent/repayment`;
  const amountFmt = formatNaira(opts.schedule.totalAmount);
  const dueDateFmt = new Date(opts.schedule.dueDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  try {
    if (opts.type === "upcoming") {
      const daysUntilDue = opts.daysUntilDue ?? 0;
      const subjectDue =
        daysUntilDue === 0 ? "Today" :
        daysUntilDue === 1 ? "Tomorrow" :
        `In ${daysUntilDue} Days`;

      await sendEmail({
        email: user.email,
        subject: `Repayment Due ${subjectDue} – ${opts.applicationRef}`,
        message: `Your repayment of ${amountFmt} is due ${subjectDue.toLowerCase()}.`,
        html: upcomingReminderHtml({
          parentName: parent.firstName,
          daysUntilDue,
          dueDate: dueDateFmt,
          amount: amountFmt,
          installment: opts.schedule.installmentNumber,
          applicationRef: opts.applicationRef,
          repaymentUrl,
        }),
      });

      // In-app notification for due-today
      if (daysUntilDue === 0) {
        NotificationPublisher.paymentOverdue(parentId, opts.schedule.id, dueDateFmt);
      }
    } else {
      const daysOverdue = opts.daysOverdue ?? 1;
      await sendEmail({
        email: user.email,
        subject: `Overdue Repayment Day ${daysOverdue} – ${opts.applicationRef}`,
        message: `Your repayment of ${amountFmt} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue.`,
        html: overdueReminderHtml({
          parentName: parent.firstName,
          daysOverdue,
          dueDate: dueDateFmt,
          amount: amountFmt,
          installment: opts.schedule.installmentNumber,
          applicationRef: opts.applicationRef,
          repaymentUrl,
        }),
      });

      NotificationPublisher.paymentOverdue(parentId, opts.schedule.id, dueDateFmt);
    }

    logger.info(
      `[repaymentReminder] Sent ${opts.type} reminder to ${user.email} | schedule=${opts.schedule.id}`,
    );
  } catch (err) {
    logger.warn(
      `[repaymentReminder] Failed to notify ${user.email}: ${(err as Error).message}`,
    );
  }
}

// ── cron registration ─────────────────────────────────────────────────────────

/**
 * Register the cron schedule.
 * Call once from server.ts after DB is ready.
 * Runs every day at 08:00 (server time).
 */
export function startRepaymentReminderCron(): void {
  // "0 8 * * *" = every day at 08:00
  cron.schedule("0 8 * * *", async () => {
    logger.info("[repaymentReminder] Cron triggered");
    try {
      await sendRepaymentReminders();
    } catch (err) {
      logger.error(`[repaymentReminder] Cron error: ${(err as Error).message}`);
    }
  });

  logger.info("[repaymentReminder] Cron scheduled (daily 08:00)");
}
