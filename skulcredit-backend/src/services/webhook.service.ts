/**
 * Lendsqr webhook processing service.
 *
 * Lendsqr fires a POST to /api/v1/webhooks/lendsqr when a loan's status
 * changes (e.g. disbursed, repaid, failed).  This service:
 *  1. Validates the incoming payload
 *  2. Finds the matching LoanLedger by lendsqrLoanId
 *  3. Advances the state machine to the appropriate state
 *  4. Persists the raw webhook payload for audit purposes
 *  5. Updates the parent LoanApplication status as needed
 */

import logger from '../config/logger';
import { LoanLedger, LoanApplication } from '../models/index';
import { LedgerState, LedgerActor, Settlement } from '../models/LoanLedger';
import { Op } from 'sequelize';

// ── Webhook payload shapes (Lendsqr) ─────────────────────────────────────────

/** Known event types sent by Lendsqr */
export type LendsqrEventType =
  | 'loan.disbursed'
  | 'loan.approved'
  | 'loan.declined'
  | 'loan.repaid'
  | 'loan.overdue'
  | string;  // allow unknown events for forward-compatibility

export interface LendsqrWebhookPayload {
  event: LendsqrEventType;
  data: {
    loan_id: number;
    loan_profile_id?: number;
    status?: string;
    amount?: number;
    disbursed_at?: string;
    settlement_reference?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ── Event → state mapping ─────────────────────────────────────────────────────

interface StateTransitionPlan {
  nextState: LedgerState;
  actor: LedgerActor;
  message: string;
  terminalLoanAppStatus?: string;
  isSettled?: boolean;
}

function resolvePlan(event: LendsqrEventType): StateTransitionPlan | null {
  switch (event) {
    case 'loan.approved':
      return {
        nextState: 'AUTHORIZED',
        actor: 'LENDSQR',
        message: 'Loan approved by Lendsqr',
      };

    case 'loan.disbursed':
      return {
        nextState: 'DELIVERED',
        actor: 'LENDSQR',
        message: 'Loan disbursed successfully',
        terminalLoanAppStatus: 'disbursed',
        isSettled: true,
      };

    case 'loan.repaid':
      return {
        nextState: 'DELIVERED',
        actor: 'LENDSQR',
        message: 'Loan fully repaid',
        terminalLoanAppStatus: 'repaid',
        isSettled: true,
      };

    case 'loan.declined':
      return {
        nextState: 'FAILED',
        actor: 'LENDSQR',
        message: 'Loan declined by Lendsqr',
        terminalLoanAppStatus: 'rejected',
      };

    case 'loan.overdue':
      // Don't change the ledger state for overdue — just log
      return null;

    default:
      return null;
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

class WebhookService {
  /**
   * Process an inbound Lendsqr webhook.
   * Returns `{ handled: true }` when the event was acted on,
   * `{ handled: false }` when it was a no-op (unknown event, already terminal).
   */
  async handleLendsqrWebhook(
    payload: LendsqrWebhookPayload,
  ): Promise<{ handled: boolean; message: string }> {
    const { event, data } = payload;
    const { loan_id } = data;

    logger.info(
      `[webhook] Received Lendsqr event="${event}" loan_id=${loan_id}`,
    );

    // ── Find the matching ledger ───────────────────────────────────────────────
    const ledger = await LoanLedger.findOne({
      where: { lendsqrLoanId: loan_id },
    });

    if (!ledger) {
      // Could be a loan we don't manage, or a race condition — just log
      logger.warn(
        `[webhook] No LoanLedger found for loan_id=${loan_id} (event=${event})`,
      );
      return { handled: false, message: `No ledger found for loan_id=${loan_id}` };
    }

    // ── Persist the raw webhook payload (audit log) ───────────────────────────
    const updatedPayloads = [
      ...(ledger.webhookPayloads ?? []),
      { receivedAt: new Date().toISOString(), event, ...data },
    ];
    await ledger.update({ webhookPayloads: updatedPayloads });

    // ── Resolve transition plan ───────────────────────────────────────────────
    const plan = resolvePlan(event);
    if (!plan) {
      logger.info(
        `[webhook] No transition mapped for event="${event}" — stored payload only`,
      );
      return { handled: false, message: `Event "${event}" stored but not acted on` };
    }

    // ── Skip if already in target or terminal state ───────────────────────────
    const currentState = ledger.status;
    if (currentState === plan.nextState || currentState === 'DELIVERED' || currentState === 'FAILED') {
      logger.info(
        `[webhook] Ledger ${ledger.id} already in state=${currentState} — skipping transition to ${plan.nextState}`,
      );
      return { handled: false, message: `Ledger already in ${currentState}` };
    }

    // ── Build settlement info for terminal events ─────────────────────────────
    const now = new Date().toISOString();
    const settlementUpdate: Partial<{ settlement: Settlement; completedAt: string }> = {};

    if (plan.isSettled) {
      const settlement: Settlement = {
        settledAt: data.disbursed_at ?? now,
        settlementReference:
          (data.settlement_reference as string | undefined) ??
          `SET_${Math.random().toString(16).slice(2).padStart(32, '0')}`,
        status: 'SETTLED',
      };
      settlementUpdate.settlement = settlement;
      settlementUpdate.completedAt = now;
    }

    if (plan.nextState === 'FAILED') {
      settlementUpdate.completedAt = now;
    }

    // ── Ensure the transition is valid; patch allowed transitions if needed ───
    // (The consumer already advanced to SETTLEMENT_PENDING before this webhook
    //  arrives.  The DELIVERED step might not yet be in allowedTransitions if
    //  the machine was last stopped at SETTLEMENT_PENDING → DELIVERED, which
    //  is already in our initial schema.  For FAILED we may need to allow
    //  SETTLEMENT_PENDING → FAILED dynamically.)
    const smCopy = JSON.parse(JSON.stringify(ledger.stateMachine));
    const alreadyAllowed = smCopy.allowedTransitions.some(
      (t: { from: string; to: string }) =>
        t.from === currentState && t.to === plan.nextState,
    );

    if (!alreadyAllowed) {
      smCopy.allowedTransitions.push({ from: currentState, to: plan.nextState });
      await ledger.update({ stateMachine: smCopy });
      // Re-fetch so `transition()` sees the updated allowedTransitions
      await ledger.reload();
    }

    // ── Advance the state machine ─────────────────────────────────────────────
    await ledger.transition(plan.nextState, plan.actor, plan.message, {
      ...(plan.isSettled && settlementUpdate.settlement
        ? { settlement: settlementUpdate.settlement, completedAt: settlementUpdate.completedAt }
        : {}),
      ...(plan.nextState === 'FAILED' ? { completedAt: now } : {}),
    });

    // ── Mirror status onto the parent LoanApplication ────────────────────────
    if (plan.terminalLoanAppStatus) {
      await LoanApplication.update(
        { status: plan.terminalLoanAppStatus as never },
        { where: { id: ledger.loanApplicationId } },
      );
      logger.info(
        `[webhook] LoanApplication ${ledger.loanApplicationId} status → ${plan.terminalLoanAppStatus}`,
      );
    }

    logger.info(
      `[webhook] Ledger ${ledger.id} transitioned ${currentState} → ${plan.nextState}`,
    );

    return {
      handled: true,
      message: `Ledger ${ledger.id} advanced to ${plan.nextState}`,
    };
  }

  /**
   * Fetch the full ledger for a given loanApplicationId.
   * Used by admin/parent to inspect loan state.
   */
  async getLedgerByApplicationId(loanApplicationId: string) {
    return LoanLedger.findOne({ where: { loanApplicationId } });
  }

  /**
   * Fetch all ledgers for a parent (via their loan applications).
   */
  async getLedgersByParentId(parentId: string) {
    const applications = await LoanApplication.findAll({
      where: { parentId },
      attributes: ['id'],
    });
    const ids = applications.map((a) => a.id);
    return LoanLedger.findAll({
      where: { loanApplicationId: { [Op.in]: ids } },
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new WebhookService();
