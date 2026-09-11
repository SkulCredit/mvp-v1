import { z } from 'zod';

export const completeProfileSchema = z.object({
  body: z.object({
    middleName:        z.string().optional(),
    dob:               z.string().optional(),
    addressStreet:     z.string().optional(),
    addressCity:       z.string().optional(),
    addressState:      z.string().optional(),
    addressPostalCode: z.string().optional(),
    addressCountry:    z.string().optional(),
    profilePhotoUrl:   z.string().url('profilePhotoUrl must be a valid URL').optional(),
  }),
});

export const verifyKycSchema = z.object({
  body: z.object({
    bvn: z.string().length(11, 'BVN must be exactly 11 digits').regex(/^\d+$/, 'BVN must be numeric'),
    nin: z.string().length(11, 'NIN must be exactly 11 digits').regex(/^\d+$/, 'NIN must be numeric').optional(),
  }),
});

export const addStudentSchema = z.object({
  body: z.object({
    schoolId:      z.string().uuid('School ID must be a valid UUID'),
    firstName:     z.string().min(2, 'First name is required'),
    lastName:      z.string().min(2, 'Last name is required'),
    studentId:     z.string().optional(),
    gradeLevel:    z.string().min(1, 'Grade level is required'),
    tuitionAmount: z.number().positive('Tuition amount must be positive'),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().uuid('Student ID must be a valid UUID') }),
  body: z.object({
    firstName:     z.string().min(2).optional(),
    lastName:      z.string().min(2).optional(),
    studentId:     z.string().optional(),
    gradeLevel:    z.string().min(1).optional(),
    tuitionAmount: z.number().positive().optional(),
    schoolId:      z.string().uuid().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  }),
});

export const schoolRequestSchema = z.object({
  body: z.object({
    schoolName:      z.string().min(2, 'School name is required'),
    schoolAddress:   z.string().optional(),
    schoolCity:      z.string().optional(),
    schoolState:     z.string().optional(),
    contactPerson:   z.string().optional(),
    contactPhone:    z.string().optional(),
    contactEmail:    z.string().email().optional(),
    additionalNotes: z.string().optional(),
    documentUrl:     z.string().url('documentUrl must be a valid URL').optional(),
  }),
});
