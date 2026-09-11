import { Router } from "express";
import authController from "../controllers/auth.controller";
import validate from "../middlewares/validate.middleware";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import {
  registerParentSchema,
  registerSchoolSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  createAdminSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, token management, email verification, OTP, and password recovery
 */

/**
 * @swagger
 * /auth/register/parent:
 *   post:
 *     summary: Register a new parent account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterParent'
 *     responses:
 *       201:
 *         description: Parent registered. Verification email sent.
 *       400:
 *         description: Validation error or email already in use
 */
/**
 * @swagger
 * /auth/check-availability:
 *   get:
 *     summary: Check if an email or phone number is already registered
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *       - in: query
 *         name: phone
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability result
 */
router.get(
  "/check-availability",
  authController.checkAvailability.bind(authController),
);

router.post(
  "/register/parent",
  validate(registerParentSchema),
  authController.registerParent.bind(authController),
);

/**
 * @swagger
 * /auth/register/school:
 *   post:
 *     summary: Register a new school account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSchool'
 *     responses:
 *       201:
 *         description: School registered. Verification email sent.
 *       400:
 *         description: Validation error or email already in use
 */
router.post(
  "/register/school",
  validate(registerSchoolSchema),
  authController.registerSchool.bind(authController),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Account temporarily locked
 */
router.post(
  "/login",
  validate(loginSchema),
  authController.login.bind(authController),
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the authenticated user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", protect, authController.logout.bind(authController));

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Exchange a refresh token for a new access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController),
);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Confirm email address via link sent on registration
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token invalid or expired
 */
router.get("/verify-email", authController.verifyEmail.bind(authController));

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend the email verification link
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  authController.resendVerification.bind(authController),
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link (valid 15 minutes)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPassword'
 *     responses:
 *       200:
 *         description: Reset link sent if account exists
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Set a new password using the reset token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Token invalid or expired
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send a 6-digit OTP to an email (valid 30 minutes)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtp'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  "/send-otp",
  validate(sendOtpSchema),
  authController.sendOtp.bind(authController),
);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify a previously sent OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp.bind(authController),
);

/**
 * @swagger
 * /auth/admin/create:
 *   post:
 *     summary: Create a new admin account (requires existing admin token)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin account created
 */
router.post(
  "/admin/create",
  protect,
  authorize("admin"),
  validate(createAdminSchema),
  authController.createAdmin.bind(authController),
);

export default router;
