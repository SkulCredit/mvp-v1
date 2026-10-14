import { z } from 'zod';

export const eligibilitySchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
  }),
});

export const applySchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    amount:    z.number().positive('Amount must be greater than 0'),
    tenor:     z.number().int().positive('Tenor must be greater than 0 (in months)'),
  }),
});
