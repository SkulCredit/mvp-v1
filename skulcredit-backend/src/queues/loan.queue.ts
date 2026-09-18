/**
 * Loan booking queue — uses RabbitMQ to process Lendsqr loan bookings
 * asynchronously.  The flow is:
 *
 *   1. parent.service.ts creates a LoanApplication + LoanLedger, then
 *      calls `publishLoanBooking()` to push a job onto the queue.
 *   2. This consumer picks it up, calls Lendsqr POST /v2/customers/loans,
 *      and advances the LoanLedger state machine.
 *   3. When Lendsqr finishes processing it fires a webhook; the webhook
 *      handler (webhook.service.ts) advances the ledger further.
 */

import { getRabbitChannel, isRabbitReady } from '../config/rabbitmq';
import applicationService, { BookLoanPayload } from '../integrations/lendsqr/application.service';
import { LoanLedger } from '../models/index';
import logger from '../config/logger';

// ── Queue name ─────────────────────────────────────────────────────────────────

export const LOAN_BOOKING_QUEUE = 'loan.booking';

// ── Message shape ──────────────────────────────────────────────────────────────

export interface LoanBookingJob {
  loanApplicationId: string;
  loanLedgerId: string;
  bookLoanPayload: BookLoanPayload;
}

// ── Producer ───────────────────────────────────────────────────────────────────

/**
 * Publish a loan booking job to RabbitMQ.
 * If RabbitMQ is not ready the job is logged as a warning and skipped
 * (the ledger will stay in INITIATED; an admin can retry via the
 * /webhooks/lendsqr/retry endpoint added separately).
 */
export async function publishLoanBooking(job: LoanBookingJob): Promise<void> {
  if (!isRabbitReady()) {
    logger.warn(
      `[loan.queue] RabbitMQ not ready — skipping loan booking job for application ${job.loanApplicationId}`,
    );
    return;
  }

  const ch = getRabbitChannel();

  // Durable queue — survives broker restarts
  await ch.assertQueue(LOAN_BOOKING_QUEUE, { durable: true });

  ch.sendToQueue(
    LOAN_BOOKING_QUEUE,
    Buffer.from(JSON.stringify(job)),
    {
      persistent: true,           // message survives broker restart
      contentType: 'application/json',
    },
  );

  logger.info(
    `[loan.queue] Published loan booking job | application=${job.loanApplicationId} | ledger=${job.loanLedgerId}`,
  );
}

// ── Consumer ───────────────────────────────────────────────────────────────────

/**
 * Start consuming loan booking jobs from the queue.
 * Call once at application startup (in server.ts / app.ts).
 */
export async function startLoanBookingConsumer(): Promise<void> {
  if (!isRabbitReady()) {
    logger.warn('[loan.queue] RabbitMQ not ready — consumer not started');
    return;
  }

  const ch = getRabbitChannel();
  await ch.assertQueue(LOAN_BOOKING_QUEUE, { durable: true });

  // Process one message at a time so we don't flood Lendsqr
  ch.prefetch(1);

  logger.info(`[loan.queue] Consumer started on queue "${LOAN_BOOKING_QUEUE}"`);

  await ch.consume(LOAN_BOOKING_QUEUE, async (msg) => {
    if (!msg) return;

    let job: LoanBookingJob;

    try {
      job = JSON.parse(msg.content.toString()) as LoanBookingJob;
    } catch {
      logger.error('[loan.queue] Failed to parse message — discarding');
      ch.nack(msg, false, false);   // dead-letter / discard
      return;
    }

    const { loanApplicationId, loanLedgerId, bookLoanPayload } = job;
    logger.info(
      `[loan.queue] Processing loan booking | application=${loanApplicationId} | ledger=${loanLedgerId}`,
    );

    const ledger = await LoanLedger.findByPk(loanLedgerId);

    if (!ledger) {
      logger.error(`[loan.queue] LoanLedger ${loanLedgerId} not found — discarding`);
      ch.nack(msg, false, false);
      return;
    }

    try {
      // ── 1. Advance to PROCESSING ────────────────────────────────────────────
      await ledger.transition('PROCESSING', 'SYSTEM', 'Loan booking request dispatched to Lendsqr');

      // ── 2. Call Lendsqr Book Loan ────────────────────────────────────────────
      const response = await applicationService.bookLoan(bookLoanPayload);

      logger.info(
        `[loan.queue] Lendsqr bookLoan response | loan_id=${response.data.loan_id} | profile_id=${response.data.loan_profile_id}`,
      );

      // ── 3. Advance to AUTHORIZED (Lendsqr accepted the booking) ─────────────
      await ledger.transition('AUTHORIZED', 'LENDSQR', 'Lendsqr accepted the loan booking', {
        lendsqrLoanId: response.data.loan_id,
        lendsqrLoanProfileId: response.data.loan_profile_id,
        bookedAt: new Date().toISOString(),
      });

      // ── 4. Advance to SETTLEMENT_PENDING (awaiting Lendsqr webhook) ──────────
      await ledger.transition(
        'SETTLEMENT_PENDING',
        'SYSTEM',
        'Loan authorized by Lendsqr — awaiting disbursement webhook',
      );

      ch.ack(msg);
    } catch (err) {
      const errorMessage = (err as Error).message ?? 'Unknown error';
      logger.error(
        `[loan.queue] Loan booking failed for ledger ${loanLedgerId}: ${errorMessage}`,
      );

      // Attempt to move ledger to FAILED
      try {
        await ledger.transition('FAILED', 'SYSTEM', `Loan booking failed: ${errorMessage}`, {
          errorMessage,
          completedAt: new Date().toISOString(),
        });
      } catch (transitionErr) {
        logger.error(
          `[loan.queue] Could not advance ledger ${loanLedgerId} to FAILED: ${(transitionErr as Error).message}`,
        );
      }

      // nack without requeue — failed messages go to dead-letter queue if configured
      ch.nack(msg, false, false);
    }
  });
}
