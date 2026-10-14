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
import { RepaymentSchedule, LoanApplication } from "../models/index";
import { ParentRepository, UserRepository } from "../repositories";
import emailService from "../emails/email.service";
import { formatNaira, formatDate } from "../utils/format";
import eventNotifier from "../notifications/event.notifier";
import logger from "../config/logger";

// ── helpers ───────────────────────────────────────────────────────────────────


function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Return YYYY-MM-DD in local time (server timezone = WAT) */
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
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
  const amountFmt  = formatNaira(opts.schedule.totalAmount);
  const dueDateFmt = formatDate(opts.schedule.dueDate);

  try {
    if (opts.type === "upcoming") {
      const daysUntilDue = opts.daysUntilDue ?? 0;

      await emailService.sendUpcomingRepaymentReminder({
        email:          user.email,
        parentName:     parent.firstName,
        daysUntilDue,
        dueDate:        dueDateFmt,
        amount:         amountFmt,
        installment:    opts.schedule.installmentNumber,
        applicationRef: opts.applicationRef,
        repaymentUrl,
      });

      if (daysUntilDue === 0) {
        eventNotifier.notifyPaymentOverdue(parentId, opts.schedule.id, dueDateFmt);
      }
    } else {
      const daysOverdue = opts.daysOverdue ?? 1;

      await emailService.sendOverdueRepaymentReminder({
        email:          user.email,
        parentName:     parent.firstName,
        daysOverdue,
        dueDate:        dueDateFmt,
        amount:         amountFmt,
        installment:    opts.schedule.installmentNumber,
        applicationRef: opts.applicationRef,
        repaymentUrl,
      });

      eventNotifier.notifyPaymentOverdue(parentId, opts.schedule.id, dueDateFmt);
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
