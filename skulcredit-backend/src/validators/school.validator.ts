import { z } from 'zod';

export const completeSchoolRegistrationSchema = z.object({
  body: z.object({
    website:         z.string().url('Invalid URL').optional(),
    population:      z.string().optional(),
    addressStreet:   z.string().optional(),
    addressCity:     z.string().optional(),
    addressState:    z.string().optional(),
    addressCountry:  z.string().optional(),
    documentCac:     z.string().url('CAC document must be a valid URL').optional(),
    documentLicense: z.string().url('License must be a valid URL').optional(),
  }),
});

export const updateSchoolProfileSchema = z.object({
  body: z.object({
    contactPerson:  z.string().min(2).optional(),
    website:        z.string().url('Invalid URL').optional(),
    population:     z.string().optional(),
    addressStreet:  z.string().optional(),
    addressCity:    z.string().optional(),
    addressState:   z.string().optional(),
    addressCountry: z.string().optional(),
  }),
});

export const updateBankDetailsSchema = z.object({
  body: z.object({
    bankName:      z.string().min(2, 'Bank name is required'),
    accountName:   z.string().min(2, 'Account name is required'),
    accountNumber: z
      .string()
      .length(10, 'Account number must be 10 digits')
      .regex(/^\d+$/, 'Account number must be numeric'),
  }),
});

export const enrollmentVerificationSchema = z.object({
  params: z.object({ id: z.string().uuid('Application ID must be a valid UUID') }),
  body: z.object({
    action:                 z.enum(['confirm', 'reject']),
    confirmedTuitionAmount: z.number().positive().optional(),
    note:                   z.string().optional(),
  }),
});
