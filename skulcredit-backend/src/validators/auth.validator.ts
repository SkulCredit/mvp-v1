import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character",
  );

export const registerParentSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    middleName: z
      .string()
      .min(2, "Middle name must be at least 2 characters")
      .optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  }),
});

export const registerSchoolSchema = z.object({
  body: z.object({
    schoolName: z.string().min(2, "School name is required"),
    contactPerson: z.string().min(2, "Contact person name is required"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    // token is optional in the body — the preferred path is the httpOnly
    // sc_refresh cookie set at login. Body fallback is kept for clients
    // (e.g. mobile) that cannot use cookies.
    token: z.string().min(1).optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email("Invalid email address") }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
    password: passwordSchema,
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({ email: z.string().email("Invalid email address") }),
});

export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    phoneNumber: z.string().min(10).optional(),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({ email: z.string().email("Invalid email address") }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
  }),
});
