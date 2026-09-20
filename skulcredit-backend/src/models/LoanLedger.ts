

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';


export type LedgerState =
  | 'INITIATED'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'SETTLEMENT_PENDING'
  | 'DELIVERED'
  | 'FAILED';

export type LedgerActor = 'SYSTEM' | 'LENDSQR' | 'ADMIN';

export interface StateEntry {
  timestamp: string | null;    
  actor: LedgerActor | null;
  message: string | null;
  nextState: LedgerState | null;
  onFailure: boolean;
  failureState: LedgerState | null;
}

export interface AllowedTransition {
  from: LedgerState;
  to: LedgerState;
}

export interface StateMachine {
  currentState: LedgerState;
  states: Record<LedgerState, StateEntry>;
  allowedTransitions: AllowedTransition[];
}

export interface StatusHistoryEntry {
  status: LedgerState;
  timestamp: string;
  actor: LedgerActor;
  message: string;
}

export interface Settlement {
  settledAt: string | null;
  settlementReference: string | null;
  status: 'PENDING' | 'SETTLED' | 'FAILED';
}

export interface LedgerTimestamps {
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export function buildInitialStateMachine(now: string): StateMachine {
  const blank = (): StateEntry => ({
    timestamp: null,
    actor: null,
    message: null,
    nextState: null,
    onFailure: false,
    failureState: null,
  });

  return {
    currentState: 'INITIATED',
    states: {
      INITIATED: {
        timestamp: now,
        actor: 'SYSTEM',
        message: 'Loan booking initiated',
        nextState: 'PROCESSING',
        onFailure: false,
        failureState: 'FAILED',
      },
      PROCESSING: blank(),
      AUTHORIZED: blank(),
      SETTLEMENT_PENDING: blank(),
      DELIVERED: blank(),
      FAILED: blank(),
    },
    allowedTransitions: [
      { from: 'INITIATED', to: 'PROCESSING' },
      { from: 'PROCESSING', to: 'AUTHORIZED' },
      { from: 'AUTHORIZED', to: 'SETTLEMENT_PENDING' },
      { from: 'SETTLEMENT_PENDING', to: 'DELIVERED' },
      { from: 'INITIATED', to: 'FAILED' },
      { from: 'PROCESSING', to: 'FAILED' },
      { from: 'AUTHORIZED', to: 'FAILED' },
      { from: 'SETTLEMENT_PENDING', to: 'FAILED' },
    ],
  };
}


export interface LoanLedgerAttributes {
  id: string;
  loanApplicationId: string;
  lendsqrLoanId: number | null;
  lendsqrLoanProfileId: number | null;
  lendsqrProductId: number | null;
  bvnLast4: string | null;
  status: LedgerState;
  stateMachine: StateMachine;
  statusHistory: StatusHistoryEntry[];
  settlement: Settlement;
  webhookPayloads: Record<string, unknown>[];
  queuedAt: string | null;
  bookedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type LoanLedgerCreationAttributes = Optional<
  LoanLedgerAttributes,
  | 'id'
  | 'lendsqrLoanId'
  | 'lendsqrLoanProfileId'
  | 'lendsqrProductId'
  | 'bvnLast4'
  | 'status'
  | 'statusHistory'
  | 'settlement'
  | 'webhookPayloads'
  | 'queuedAt'
  | 'bookedAt'
  | 'completedAt'
  | 'errorMessage'
>;

export class LoanLedgerInstance
  extends Model<LoanLedgerAttributes, LoanLedgerCreationAttributes>
  implements LoanLedgerAttributes
{
  declare id: string;
  declare loanApplicationId: string;
  declare lendsqrLoanId: number | null;
  declare lendsqrLoanProfileId: number | null;
  declare lendsqrProductId: number | null;
  declare bvnLast4: string | null;
  declare status: LedgerState;
  declare stateMachine: StateMachine;
  declare statusHistory: StatusHistoryEntry[];
  declare settlement: Settlement;
  declare webhookPayloads: Record<string, unknown>[];
  declare queuedAt: string | null;
  declare bookedAt: string | null;
  declare completedAt: string | null;
  declare errorMessage: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;


  async transition(
    nextState: LedgerState,
    actor: LedgerActor,
    message: string,
    extra: Partial<Pick<LoanLedgerAttributes, 'lendsqrLoanId' | 'lendsqrLoanProfileId' | 'bookedAt' | 'completedAt' | 'errorMessage' | 'settlement'>> = {},
  ): Promise<this> {
    const now = new Date().toISOString();
    const sm = JSON.parse(JSON.stringify(this.stateMachine)) as StateMachine;
    const history = [...this.statusHistory];

    const allowed = sm.allowedTransitions.some(
      (t) => t.from === sm.currentState && t.to === nextState,
    );
    if (!allowed) {
      throw new Error(
        `Invalid state transition: ${sm.currentState} → ${nextState}`,
      );
    }

    sm.states[nextState] = {
      timestamp: now,
      actor,
      message,
      nextState: null,
      onFailure: false,
      failureState: null,
    };
    sm.currentState = nextState;

    history.push({ status: nextState, timestamp: now, actor, message });

    await this.update({
      status: nextState,
      stateMachine: sm,
      statusHistory: history,
      ...extra,
    });

    return this;
  }
}

LoanLedgerInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanApplicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'loan_applications', key: 'id' },
      onDelete: 'CASCADE',
    },
    lendsqrLoanId:        { type: DataTypes.INTEGER, allowNull: true },
    lendsqrLoanProfileId: { type: DataTypes.INTEGER, allowNull: true },
    lendsqrProductId:     { type: DataTypes.INTEGER, allowNull: true },
    bvnLast4:             { type: DataTypes.STRING(4), allowNull: true },
    status: {
      type: DataTypes.ENUM(
        'INITIATED', 'PROCESSING', 'AUTHORIZED',
        'SETTLEMENT_PENDING', 'DELIVERED', 'FAILED',
      ),
      allowNull: false,
      defaultValue: 'INITIATED',
    },
    stateMachine:    { type: DataTypes.JSONB, allowNull: false },
    statusHistory:   { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    settlement: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { settledAt: null, settlementReference: null, status: 'PENDING' },
    },
    webhookPayloads: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    queuedAt:        { type: DataTypes.STRING, allowNull: true },
    bookedAt:        { type: DataTypes.STRING, allowNull: true },
    completedAt:     { type: DataTypes.STRING, allowNull: true },
    errorMessage:    { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'LoanLedger',
    tableName: 'loan_ledgers',
    timestamps: true,
    underscored: true,
  },
);

export default LoanLedgerInstance;
