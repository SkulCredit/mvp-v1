import { Router } from "express";
import parentController from "../controllers/parent.controller";
import validate from "../middlewares/validate.middleware";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import upload from "../middlewares/upload.middleware";
import {
  completeProfileSchema,
  verifyKycSchema,
  verifyNinSchema,
  addStudentSchema,
  updateStudentSchema,
  changePasswordSchema,
  schoolRequestSchema,
  submitApplicationSchema,
} from "../validators/parent.validator";

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
router.get(
  "/schools",
  parentController.getSchoolDirectory.bind(parentController),
);

router.use(protect, authorize("parent"));

router.get("/profile", parentController.getProfile.bind(parentController));
router.put(
  "/profile",
  validate(completeProfileSchema),
  parentController.completeProfile.bind(parentController),
);
router.put(
  "/profile/photo",
  parentController.updateProfilePhoto.bind(parentController),
);
router.delete(
  "/profile/photo",
  parentController.deleteProfilePhoto.bind(parentController),
);
router.put(
  "/change-password",
  validate(changePasswordSchema),
  parentController.changePassword.bind(parentController),
);
router.post(
  "/kyc",
  validate(verifyKycSchema),
  parentController.verifyKYC.bind(parentController),
);
router.post(
  "/verify-nin",
  validate(verifyNinSchema),
  parentController.verifyNin.bind(parentController),
);

router.get("/students", parentController.getStudents.bind(parentController));
router.post(
  "/students",
  validate(addStudentSchema),
  parentController.addStudent.bind(parentController),
);
router.get("/students/:id", parentController.getStudent.bind(parentController));
router.put(
  "/students/:id",
  validate(updateStudentSchema),
  parentController.updateStudent.bind(parentController),
);
router.delete(
  "/students/:id",
  parentController.deleteStudent.bind(parentController),
);

router.get(
  "/applications",
  parentController.getApplications.bind(parentController),
);
router.get(
  "/applications/:id",
  parentController.getApplication.bind(parentController),
);

router.get(
  "/school-requests",
  parentController.getSchoolRequests.bind(parentController),
);
router.post(
  "/school-requests",
  validate(schoolRequestSchema),
  parentController.requestSchool.bind(parentController),
);

router.get("/dashboard", parentController.getDashboard.bind(parentController));

/**
 * @swagger
 * /parents/submit-application:
 *   post:
 *     summary: Submit full wizard application (profile + KYC + school + students)
 *     tags: [Parent]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [dob, addressStreet, addressCity, addressState, addressLga,
 *                        relationship, employerType, yearsInRole, monthlyIncome,
 *                        schoolId, institutionType, gradeLevel, repaymentPlan,
 *                        academicSession, tuitionAmount, tenor, students,
 *                        termsConfirmed, photo, kycDocs]
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               kycDocs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               docTypes:
 *                 type: string
 *                 description: JSON array of document type labels e.g. '["Bank Statement","Employment Letter"]'
 *               students:
 *                 type: string
 *                 description: JSON array of student objects
 *     responses:
 *       201:
 *         description: Application submitted successfully
 */
router.post(
  "/submit-application",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "kycDocs", maxCount: 10 },
  ]),
  validate(submitApplicationSchema),
  parentController.submitApplication.bind(parentController),
);

export default router;
