import { z } from 'zod';

export const schoolStatusSchema = z.object({
  params: z.object({ id: z.string().uuid('School ID must be a valid UUID') }),
  body:   z.object({ reason: z.string().optional() }),
});

export const loanDecisionSchema = z.object({
  params: z.object({ id: z.string().uuid('Application ID must be a valid UUID') }),
  body: z.object({
    action:         z.enum(['approve', 'reject', 'request_info']),
    amountApproved: z.number().positive().optional(),
    reason:         z.string().optional(),
    note:           z.string().optional(),
  }),
});

export const parentActionSchema = z.object({
  params: z.object({ id: z.string().uuid('Parent ID must be a valid UUID') }),
  body: z.object({
    action: z.enum(['hold', 'unhold', 'flag_fraud', 'unflag_fraud']),
    reason: z.string().optional(),
  }),
});
