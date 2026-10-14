import { z } from 'zod';

export const statusEnum = z.enum(['open', 'in_progress', 'awaiting_customer', 'escalated', 'resolved', 'closed']);
export const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export const categoryEnum = z.enum([
  'loan_application',
  'payment',
  'technical',
  'document_upload',
  'general_inquiry',
  'school_verification',
  'disbursement',
  'other',
]);

export const createTicketSchema = z.object({
  body: z.object({
    subject:  z.string().min(1).max(500),
    message:  z.string().min(1),
    category: categoryEnum.optional(),
    priority: priorityEnum.optional(),
  }),
});

export const listTicketsSchema = z.object({
  query: z.object({
    status:    statusEnum.optional(),
    priority:  priorityEnum.optional(),
    category:  categoryEnum.optional(),
    search:    z.string().optional(),
    escalated: z.enum(['true', 'false']).optional(),
    taggedTo:  z.string().optional(),
    page:      z.string().optional(),
    limit:     z.string().optional(),
  }),
});

export const ticketIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const replyTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    message: z.string().min(1).max(5000),
  }),
});

export const csUpdateTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      status: statusEnum.optional(),
    })
    .refine((v) => !!v.status, { message: 'No updatable fields supplied' }),
});

export const csMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    body:       z.string().min(1).max(5000),
    visibility: z.enum(['public', 'internal']).default('public'),
  }),
});

export const escalateSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    managerId: z.string().uuid(),
    note:      z.string().max(2000).optional(),
  }),
});
