import { Router } from 'express';
import parentController from '../controllers/parent.controller';
import validate from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import {
  completeProfileSchema,
  verifyKycSchema,
  addStudentSchema,
  updateStudentSchema,
  changePasswordSchema,
  schoolRequestSchema,
} from '../validators/parent.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Parent
 *   description: "Parent profile, students, applications, schools (role: parent)"
 */

/**
 * @swagger
 * /parents/schools:
 *   get:
 *     summary: Browse approved partner schools
 *     tags: [Parent]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of partner schools
 */
router.get('/schools', parentController.getSchoolDirectory.bind(parentController));

router.use(protect, authorize('parent'));

router.get('/profile',  parentController.getProfile.bind(parentController));
router.put('/profile',  validate(completeProfileSchema), parentController.completeProfile.bind(parentController));
router.put('/profile/photo',    parentController.updateProfilePhoto.bind(parentController));
router.delete('/profile/photo', parentController.deleteProfilePhoto.bind(parentController));
router.put('/change-password', validate(changePasswordSchema), parentController.changePassword.bind(parentController));
router.post('/kyc',     validate(verifyKycSchema), parentController.verifyKYC.bind(parentController));

router.get('/students',     parentController.getStudents.bind(parentController));
router.post('/students',    validate(addStudentSchema), parentController.addStudent.bind(parentController));
router.get('/students/:id', parentController.getStudent.bind(parentController));
router.put('/students/:id', validate(updateStudentSchema), parentController.updateStudent.bind(parentController));
router.delete('/students/:id', parentController.deleteStudent.bind(parentController));

router.get('/applications',     parentController.getApplications.bind(parentController));
router.get('/applications/:id', parentController.getApplication.bind(parentController));

router.get('/school-requests',  parentController.getSchoolRequests.bind(parentController));
router.post('/school-requests', validate(schoolRequestSchema), parentController.requestSchool.bind(parentController));

router.get('/dashboard', parentController.getDashboard.bind(parentController));

export default router;
