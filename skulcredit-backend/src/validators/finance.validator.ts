import { z } from "zod";

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    search: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const dashboardStatsQuerySchema = z.object({
  query: z.object({
    period: z.enum(["6M", "12M"]).optional().default("12M"),
  }),
});

export const listDisbursementsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    status: z.enum(["all", "completed", "processing", "failed", "reversed", "Completed", "Processing", "Failed", "Reversed"]).optional(),
    search: z.string().optional(),
    date: z.string().optional(),
  }),
});

export const disbursementIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Disbursement ID is required"),
  }),
});

export const initiateDisbursementSchema = z.object({
  body: z.object({
    loanApplicationId: z.string().uuid("Valid loan application ID is required"),
    notes: z.string().optional(),
  }),
});

export const reverseDisbursementSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Disbursement ID is required"),
  }),
  body: z.object({
    reason: z.string().min(3, "Reversal reason is required"),
  }),
});

export const schoolIdParamSchema = z.object({
  params: z.object({
    schoolId: z.string().min(1, "School ID is required"),
  }),
});

export const updateSchoolVerificationStatusSchema = z.object({
  params: z.object({
    schoolId: z.string().min(1, "School ID is required"),
  }),
  body: z.object({
    status: z.enum(["Verified", "Re-verification due", "Pending review", "Unverified"]),
    reason: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const listRepaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    status: z.enum(["All", "On track", "Due soon", "Grace period", "Overdue", "Defaulted"]).optional(),
    search: z.string().optional(),
  }),
});

export const loanIdParamSchema = z.object({
  params: z.object({
    loanId: z.string().min(1, "Loan ID is required"),
  }),
});

export const followUpSchema = z.object({
  body: z.object({
    loanId: z.string().min(1, "Loan ID is required"),
    actionType: z.enum(["call", "sms", "email", "reminder", "general"]).default("reminder"),
    notes: z.string().optional(),
  }),
});

export const waiveLateFeeSchema = z.object({
  body: z.object({
    loanId: z.string().min(1, "Loan ID is required"),
    scheduleId: z.string().optional(),
    amount: z.number().positive().optional(),
    reason: z.string().min(3, "Reason for waiver is required"),
  }),
});

export const bulkRemindersSchema = z.object({
  body: z.object({
    loanIds: z.array(z.string()).min(1, "At least one loan ID is required"),
    channel: z.enum(["sms", "email", "both"]).default("both"),
  }),
});

export const logInteractionSchema = z.object({
  body: z.object({
    loanId: z.string().min(1, "Loan ID is required"),
    interactionType: z.enum(["call", "sms", "email", "in_person", "promise_to_pay"]),
    notes: z.string().min(1, "Notes are required"),
    promiseDate: z.string().optional(),
    promisedAmount: z.number().positive().optional(),
  }),
});

export const assignOfficerSchema = z.object({
  body: z.object({
    loanId: z.string().min(1, "Loan ID is required"),
    officerId: z.string().min(1, "Officer ID is required"),
    officerName: z.string().optional(),
  }),
});

export const createInvestigationSchema = z.object({
  body: z.object({
    transactionReference: z.string().min(1, "Transaction reference is required"),
    schoolId: z.string().optional(),
    issueType: z.string().min(1, "Issue type is required"),
    description: z.string().min(3, "Description is required"),
  }),
});

export const updateFinanceSettingsSchema = z.object({
  body: z.object({
    autoDisbursementLimit: z.number().optional(),
    requireTwoPersonApproval: z.boolean().optional(),
    gracePeriodDays: z.number().optional(),
    defaultLateFeePercentage: z.number().optional(),
    reconciliationThreshold: z.number().optional(),
    notificationEmails: z.array(z.string().email()).optional(),
  }),
});
