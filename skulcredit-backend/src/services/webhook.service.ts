

import logger from '../config/logger';
import { LoanLedger, LoanApplication } from '../models/index';
import { LedgerState, LedgerActor, Settlement } from '../models/LoanLedger';
import { Op } from 'sequelize';


export type LendsqrEventType =
  | 'loan.disbursed'
  | 'loan.approved'
  | 'loan.declined'
  | 'loan.repaid'
  | 'loan.overdue'
  | string; 

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
      return null;

    default:
      return null;
  }
}

class WebhookService {

  async handleLendsqrWebhook(
    payload: LendsqrWebhookPayload,
  ): Promise<{ handled: boolean; message: string }> {
    const { event, data } = payload;
    const { loan_id } = data;

    logger.info(
      `[webhook] Received Lendsqr event="${event}" loan_id=${loan_id}`,
    );

    const ledger = await LoanLedger.findOne({
      where: { lendsqrLoanId: loan_id },
    });

    if (!ledger) {
      logger.warn(
        `[webhook] No LoanLedger found for loan_id=${loan_id} (event=${event})`,
      );
      return { handled: false, message: `No ledger found for loan_id=${loan_id}` };
    }

    const updatedPayloads = [
      ...(ledger.webhookPayloads ?? []),
      { receivedAt: new Date().toISOString(), event, ...data },
    ];
    await ledger.update({ webhookPayloads: updatedPayloads });

    const plan = resolvePlan(event);
    if (!plan) {
      logger.info(
        `[webhook] No transition mapped for event="${event}" — stored payload only`,
      );
      return { handled: false, message: `Event "${event}" stored but not acted on` };
    }

    const currentState = ledger.status;
    if (currentState === plan.nextState || currentState === 'DELIVERED' || currentState === 'FAILED') {
      logger.info(
        `[webhook] Ledger ${ledger.id} already in state=${currentState} — skipping transition to ${plan.nextState}`,
      );
      return { handled: false, message: `Ledger already in ${currentState}` };
    }

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

    const smCopy = JSON.parse(JSON.stringify(ledger.stateMachine));
    const alreadyAllowed = smCopy.allowedTransitions.some(
      (t: { from: string; to: string }) =>
        t.from === currentState && t.to === plan.nextState,
    );

    if (!alreadyAllowed) {
      smCopy.allowedTransitions.push({ from: currentState, to: plan.nextState });
      await ledger.update({ stateMachine: smCopy });
      await ledger.reload();
    }

    await ledger.transition(plan.nextState, plan.actor, plan.message, {
      ...(plan.isSettled && settlementUpdate.settlement
        ? { settlement: settlementUpdate.settlement, completedAt: settlementUpdate.completedAt }
        : {}),
      ...(plan.nextState === 'FAILED' ? { completedAt: now } : {}),
    });


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

  async getLedgerByApplicationId(loanApplicationId: string) {
    return LoanLedger.findOne({ where: { loanApplicationId } });
  }

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
