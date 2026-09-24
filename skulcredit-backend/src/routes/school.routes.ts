import { Router } from "express";
import schoolController from "../controllers/school.controller";
import validate from "../middlewares/validate.middleware";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import {
  completeSchoolRegistrationSchema,
  updateSchoolProfileSchema,
  updateBankDetailsSchema,
  enrollmentVerificationSchema,
} from "../validators/school.validator";

const router = Router();

/**
 * @swagger
 * /schools/disbursement/{id}:
 *   get:
 *     summary: Get funding request details (public — for funding partner portal)
 *     description: >
 *       Returns full application details needed by the funding partner to review
 *       and process disbursement. No auth required — applicationId acts as token.
 *     tags: [School]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Application details
 *       404:
 *         description: Application not found
 */
router.get(
  "/disbursement/:id",
  schoolController.getDisbursementDetails.bind(schoolController),
);

/**
 * @swagger
 * /schools/applications/{id}/disbursement-callback:
 *   post:
 *     summary: Funding partner confirms or rejects disbursement
 *     description: >
 *       Called by the funding partner portal after transferring funds (or declining).
 *       No auth required — the applicationId in the URL acts as the token.
 *     tags: [School]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [disbursed, rejected] }
 *               note:   { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.post(
  "/applications/:id/disbursement-callback",
  schoolController.disbursementCallback.bind(schoolController),
);

router.use(protect, authorize("school"));

/**
 * @swagger
 * tags:
 *   name: School
 *   description: "School portal - profile, applications, enrollment verification (role: school)"
 */

router.get("/profile", schoolController.getProfile.bind(schoolController));
router.put(
  "/profile",
  validate(updateSchoolProfileSchema),
  schoolController.updateProfile.bind(schoolController),
);
router.put(
  "/complete-registration",
  validate(completeSchoolRegistrationSchema),
  schoolController.completeRegistration.bind(schoolController),
);
router.put(
  "/bank-details",
  validate(updateBankDetailsSchema),
  schoolController.updateBankDetails.bind(schoolController),
);

router.get(
  "/applications",
  schoolController.getApplications.bind(schoolController),
);
router.get(
  "/applications/:id",
  schoolController.getApplication.bind(schoolController),
);
router.put(
  "/applications/:id/verify-enrollment",
  validate(enrollmentVerificationSchema),
  schoolController.verifyEnrollment.bind(schoolController),
);

router.get("/dashboard", schoolController.getDashboard.bind(schoolController));

router.get("/students", schoolController.getStudents.bind(schoolController));
router.post("/students", schoolController.createStudent.bind(schoolController));
router.put(
  "/students/:id",
  schoolController.updateStudent.bind(schoolController),
);

router.get(
  "/disbursements",
  schoolController.getDisbursements.bind(schoolController),
);

export default router;
