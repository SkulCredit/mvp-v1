

import { getRabbitChannel, isRabbitReady } from '../config/rabbitmq';
import applicationService, { BookLoanPayload } from '../integrations/lendsqr/application.service';
import { LoanLedger } from '../models/index';
import logger from '../config/logger';


export const LOAN_BOOKING_QUEUE = 'loan.booking';


export interface LoanBookingJob {
  loanApplicationId: string;
  loanLedgerId: string;
  bookLoanPayload: BookLoanPayload;
}


export async function publishLoanBooking(job: LoanBookingJob): Promise<void> {
  if (!isRabbitReady()) {
    logger.warn(
      `[loan.queue] RabbitMQ not ready — skipping loan booking job for application ${job.loanApplicationId}`,
    );
    return;
  }

  const ch = getRabbitChannel();

  await ch.assertQueue(LOAN_BOOKING_QUEUE, { durable: true });

  ch.sendToQueue(
    LOAN_BOOKING_QUEUE,
    Buffer.from(JSON.stringify(job)),
    {
      persistent: true,     
      contentType: 'application/json',
    },
  );

  logger.info(
    `[loan.queue] Published loan booking job | application=${job.loanApplicationId} | ledger=${job.loanLedgerId}`,
  );
}

export async function startLoanBookingConsumer(): Promise<void> {
  if (!isRabbitReady()) {
    logger.warn('[loan.queue] RabbitMQ not ready — consumer not started');
    return;
  }

  const ch = getRabbitChannel();
  await ch.assertQueue(LOAN_BOOKING_QUEUE, { durable: true });

  ch.prefetch(1);

  logger.info(`[loan.queue] Consumer started on queue "${LOAN_BOOKING_QUEUE}"`);

  await ch.consume(LOAN_BOOKING_QUEUE, async (msg) => {
    if (!msg) return;

    let job: LoanBookingJob;

    try {
      job = JSON.parse(msg.content.toString()) as LoanBookingJob;
    } catch {
      logger.error('[loan.queue] Failed to parse message — discarding');
      ch.nack(msg, false, false);   
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
      await ledger.transition('PROCESSING', 'SYSTEM', 'Loan booking request dispatched to Lendsqr');

      const response = await applicationService.bookLoan(bookLoanPayload);

      logger.info(
        `[loan.queue] Lendsqr bookLoan response | loan_id=${response.data.loan_id} | profile_id=${response.data.loan_profile_id}`,
      );

      await ledger.transition('AUTHORIZED', 'LENDSQR', 'Lendsqr accepted the loan booking', {
        lendsqrLoanId: response.data.loan_id,
        lendsqrLoanProfileId: response.data.loan_profile_id,
        bookedAt: new Date().toISOString(),
      });

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

      ch.nack(msg, false, false);
    }
  });
}
