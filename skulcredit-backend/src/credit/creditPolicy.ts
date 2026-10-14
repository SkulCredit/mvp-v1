export interface ScoreCheckRawData {
  credit_score?: string;
  decision_data?: {
    pass?: boolean;
    decision?: string;
    advisory_amount?: number;
  };
}

export interface CreditEvaluation {
  pass: boolean;
  decision: string;
  creditScore: string;
  advisoryAmount: number;
}


export function evaluateCreditScore(
  raw: ScoreCheckRawData | null | undefined,
): CreditEvaluation {
  if (!raw) {
    return {
      pass:            true,
      decision:        'score_unavailable',
      creditScore:     'N/A',
      advisoryAmount:  0,
    };
  }

  const dd = raw.decision_data;

  return {
    pass:           dd?.pass ?? true,
    decision:       dd?.decision ?? 'unknown',
    creditScore:    raw.credit_score ?? '0%',
    advisoryAmount: dd?.advisory_amount ?? 0,
  };
}
