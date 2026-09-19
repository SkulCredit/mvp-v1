import { z } from "zod";

export const completeProfileSchema = z.object({
  body: z.object({
    middleName: z.string().optional(),
    dob: z.string().optional(),
    addressStreet: z.string().optional(),
    addressCity: z.string().optional(),
    addressLga: z.string().optional(),
    addressState: z.string().optional(),
    addressPostalCode: z.string().optional(),
    addressCountry: z.string().optional(),
    profilePhotoUrl: z
      .string()
      .url("profilePhotoUrl must be a valid URL")
      .optional(),
  }),
});

export const verifyKycSchema = z.object({
  body: z
    .object({
      bvn: z
        .string()
        .length(11, "BVN must be exactly 11 digits")
        .regex(/^\d+$/, "BVN must be numeric")
        .optional(),
      nin: z
        .string()
        .length(11, "NIN must be exactly 11 digits")
        .regex(/^\d+$/, "NIN must be numeric")
        .optional(),
      dob: z.string().optional(),
      state: z.string().optional(),
      lga: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      photoUrl: z.string().url("photoUrl must be a valid URL").optional(),
      accountNumber: z.string().optional(),
      bankCode: z.string().optional(),
      documents: z
        .array(
          z.object({
            url: z.string().url(),
            type_id: z.number(),
            sub_type_id: z.number().optional(),
          }),
        )
        .optional(),
    })
    .refine((data) => data.bvn || data.nin, {
      message: "Either BVN or NIN must be provided",
    }),
});

export const verifyNinSchema = z.object({
  body: z.object({
    nin: z
      .string()
      .length(11, "NIN must be exactly 11 digits")
      .regex(/^\d+$/, "NIN must be numeric"),
  }),
});

export const addStudentSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid("School ID must be a valid UUID"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    studentId: z.string().optional(),
    gradeLevel: z.string().min(1, "Grade level is required"),
    tuitionAmount: z
      .preprocess(
        (v) =>
          v === undefined || v === null || v === ""
            ? 0
            : typeof v === "string"
              ? parseFloat(v)
              : v,
        z.number().nonnegative("Tuition amount must be 0 or greater"),
      )
      .optional(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().uuid("Student ID must be a valid UUID") }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    studentId: z.string().optional(),
    gradeLevel: z.string().min(1).optional(),
    tuitionAmount: z.number().positive().optional(),
    schoolId: z.string().uuid().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
      ),
  }),
});

export const schoolRequestSchema = z.object({
  body: z.object({
    schoolName: z.string().min(2, "School name is required"),
    schoolAddress: z.string().optional(),
    schoolCity: z.string().optional(),
    schoolState: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional(),
    additionalNotes: z.string().optional(),
    documentUrl: z.string().url("documentUrl must be a valid URL").optional(),
  }),
});

export const submitWizardApplicationJsonSchema = z.object({
  body: z.object({
    childId: z.string().min(1, "childId is required"),
    schoolId: z.string().uuid("schoolId must be a valid UUID"),
    institutionTypeId: z
      .string()
      .uuid("institutionTypeId must be a valid UUID"),
    institutionTypeName: z.string().min(1, "Institution type name is required"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    tuitionAmount: z.preprocess(
      (v) => (typeof v === "string" ? parseFloat(v) : v),
      z.number().nonnegative("Tuition amount must be 0 or greater"),
    ),
    repaymentPlanId: z.enum(["full", "3month", "6month"]),
    tenor: z.preprocess(
      (v) => (typeof v === "string" ? parseInt(v as string, 10) : v),
      z.number().int().positive("Tenor must be a positive integer"),
    ),
    academicSession: z.string().optional(),
    term: z.string().optional(),
  }),
});

export const submitApplicationSchema = z.object({
  body: z
    .object({
      dob: z.string().min(1, "Date of birth is required"),
      addressStreet: z.string().min(1, "Street address is required"),
      addressCity: z.string().min(1, "City is required"),
      addressState: z.string().min(1, "State is required"),
      addressLga: z.string().min(1, "LGA is required"),
      addressCountry: z.string().optional(),
      relationship: z.string().min(1, "Relationship is required"),
      employerType: z.string().min(1, "Employer type is required"),
      yearsInRole: z.string().min(1, "Years in role is required"),
      monthlyIncome: z.string().min(1, "Monthly income is required"),
      bvn: z.string().length(11).regex(/^\d+$/).optional(),
      nin: z.string().length(11).regex(/^\d+$/).optional(),
      accountNumber: z.string().optional(),
      bankCode: z.string().optional(),
      schoolId: z.string().uuid("School ID must be a valid UUID"),
      institutionType: z.string().min(1),
      gradeLevel: z.string().min(1),
      repaymentPlan: z.string().min(1),
      academicSession: z.string().min(1),
      tuitionAmount: z.preprocess(
        (v) => (typeof v === "string" ? parseFloat(v) : v),
        z.number().positive("Tuition amount must be positive"),
      ),
      tenor: z.preprocess(
        (v) => (typeof v === "string" ? parseInt(v, 10) : v),
        z.number().int().positive("Tenor must be a positive integer"),
      ),
      students: z.preprocess(
        (v) => {
          if (typeof v === "string") {
            try {
              return JSON.parse(v);
            } catch {
              return v;
            }
          }
          return v;
        },
        z
          .array(
            z.object({
              fullName: z.string().min(2),
              dob: z.string().min(1),
              gender: z.string().min(1),
              admissionNumber: z.string().min(1),
            }),
          )
          .min(1, "At least one student is required"),
      ),
      docTypes: z.preprocess((v) => {
        if (typeof v === "string") {
          try {
            return JSON.parse(v);
          } catch {
            return [];
          }
        }
        return v ?? [];
      }, z.array(z.string()).default([])),
      termsConfirmed: z.preprocess(
        (v) => v === "true" || v === true,
        z.literal(true, {
          message: "You must confirm the information is accurate",
        }),
      ),
    })
    .refine((d) => d.bvn || d.nin, {
      message: "Either BVN or NIN must be provided",
    }),
});
