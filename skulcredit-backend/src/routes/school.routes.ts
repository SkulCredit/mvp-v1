import { Router } from 'express';
import schoolController from '../controllers/school.controller';
import validate from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import {
  completeSchoolRegistrationSchema,
  updateSchoolProfileSchema,
  updateBankDetailsSchema,
  enrollmentVerificationSchema,
} from '../validators/school.validator';

const router = Router();

router.use(protect, authorize('school'));

/**
 * @swagger
 * tags:
 *   name: School
 *   description: "School portal - profile, applications, enrollment verification (role: school)"
 */

router.get('/profile',              schoolController.getProfile.bind(schoolController));
router.put('/profile',              validate(updateSchoolProfileSchema), schoolController.updateProfile.bind(schoolController));
router.put('/complete-registration', validate(completeSchoolRegistrationSchema), schoolController.completeRegistration.bind(schoolController));
router.put('/bank-details',          validate(updateBankDetailsSchema), schoolController.updateBankDetails.bind(schoolController));

router.get('/applications',     schoolController.getApplications.bind(schoolController));
router.get('/applications/:id', schoolController.getApplication.bind(schoolController));
router.put('/applications/:id/verify-enrollment', validate(enrollmentVerificationSchema), schoolController.verifyEnrollment.bind(schoolController));

router.get('/dashboard', schoolController.getDashboard.bind(schoolController));

export default router;
