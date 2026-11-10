import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  UserRepository,
  ParentRepository,
  SchoolRepository,
  RefreshTokenRepository,
} from "../repositories";
import { sequelize } from "../config/db";
import env from "../config/env";
import ApiError from "../utils/apiError";
import redis from "../config/redis";
import { RefreshToken, AdminProfile } from "../models/index";
import { AuthEventPublisher } from "../notifications/auth.event.publisher";
import emailService from "../emails/email.service";
import logger from "../config/logger";
import type { GenerateAccessTokenInput, JwtPayload } from "../types/jwt";

const lockKey = (email: string) => `lockout:${email}`;
const cooldownKey = (email: string) => `cooldown:${email}`;
const pwResetKey = (token: string) => `pw_reset:${token}`;
const emailVerifyKey = (token: string) => `email_verify:${token}`;
const otpKey = (email: string) => `otp:${email}`;

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SEC = 15 * 60;
const LOCKOUT_COOLDOWN_SEC = 15 * 60;
const PW_RESET_TTL_SEC = 15 * 60;
const EMAIL_VERIFY_TTL_SEC = 24 * 60 * 60;
const OTP_TTL_SEC = 30 * 60;

const isRedisReady = (): boolean => redis.status === "ready";

interface RegisterParentData {
  email: string;
  password: string;
  phoneNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}

interface RegisterSchoolData {
  email: string;
  password: string;
  phoneNumber: string;
  schoolName: string;
  contactPerson: string;
}

interface CreateAdminData {
  email: string;
  password: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  role?:
    | "admin"
    | "customer_service"
    | "customer_service_manager"
    | "risk_management"
    | "accountant";
}

class AuthService {
  async checkAvailability(
    email?: string,
    phone?: string,
  ): Promise<{ email?: boolean; phone?: boolean }> {
    const result: { email?: boolean; phone?: boolean } = {};

    if (email) {
      const existing = await UserRepository.findOne({ email });
      result.email = !existing;
    }

    if (phone) {
      const existing = await UserRepository.findOne({ phoneNumber: phone });
      result.phone = !existing;
    }

    return result;
  }

  async registerParent(data: RegisterParentData) {
    const t = await sequelize.transaction();
    try {
      const existing = await UserRepository.findOne({ email: data.email });
      if (existing) throw new ApiError(400, "Email already in use");

      const user = await UserRepository.create(
        {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          phoneNumber: data.phoneNumber,
          role: "parent",
        },
        { transaction: t },
      );

      const parent = await ParentRepository.create(
        {
          userId: user.id,
          firstName: data.firstName,
          middleName: data.middleName ?? null,
          lastName: data.lastName,
        },
        { transaction: t },
      );

      await t.commit();

      this._sendVerificationOtp(user.id, user.email).catch((err: Error) =>
        logger.error(
          `[auth.service] _sendVerificationOtp failed: ${err.message}`,
        ),
      );

      const userJson = user.toJSON() as unknown as Record<string, unknown>;
      delete userJson.password;
      return { user: userJson, parent };
    } catch (error) {
      await t.rollback();
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        500,
        `Error registering parent: ${(error as Error).message}`,
      );
    }
  }

  async registerSchool(data: RegisterSchoolData) {
    const t = await sequelize.transaction();
    try {
      const existing = await UserRepository.findOne({ email: data.email });
      if (existing) throw new ApiError(400, "Email already in use");

      const user = await UserRepository.create(
        {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          phoneNumber: data.phoneNumber,
          role: "school",
        },
        { transaction: t },
      );

      const school = await SchoolRepository.create(
        {
          userId: user.id,
          schoolName: data.schoolName,
          contactPerson: data.contactPerson,
        },
        { transaction: t },
      );

      await t.commit();

      this._sendVerificationOtp(user.id, user.email).catch((err: Error) =>
        logger.error(
          `[auth.service] _sendVerificationOtp failed: ${err.message}`,
        ),
      );

      const userJson = user.toJSON() as unknown as Record<string, unknown>;
      delete userJson.password;
      return { user: userJson, school };
    } catch (error) {
      await t.rollback();
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        500,
        `Error registering school: ${(error as Error).message}`,
      );
    }
  }

  async createAdmin(data: CreateAdminData) {
    const existing = await UserRepository.findOne({ email: data.email });
    if (existing) throw new ApiError(400, "Email already in use");

    const assignedRole:
      | "admin"
      | "customer_service"
      | "customer_service_manager"
      | "risk_management"
      | "accountant" = data.role ?? "admin";

    const user = await UserRepository.create({
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      phoneNumber: data.phoneNumber ?? null,
      role: assignedRole,
      isEmailVerified: true,
      isActive: true,
    });

    // Persist first + last name in AdminProfile so the admin UI shows the real name
    const fullName =
      [data.firstName, data.lastName].filter(Boolean).join(" ") || null;
    await AdminProfile.create({
      userId: user.id,
      fullName,
      phone: data.phoneNumber ?? null,
    } as never);

    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;
    return { ...userJson, fullName };
  }

  async login(
    email: string,
    password: string,
    meta?: { ip?: string; device?: string },
  ): Promise<{
    requiresMfa?: boolean;
    user: Record<string, unknown>;
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    if (isRedisReady()) {
      const locked = await redis.get(cooldownKey(email));
      if (locked) {
        const ttl = await redis.ttl(cooldownKey(email));
        const mins = Math.ceil(ttl / 60);
        throw new ApiError(
          429,
          `Account temporarily locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`,
        );
      }
    }

    const user = await UserRepository.findOne(
      { email },
      { attributes: { include: ["password"] } },
    );
    if (!user) throw new ApiError(401, "Invalid credentials");
    if (!user.isActive) throw new ApiError(401, "User account is deactivated");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await this._recordFailedAttempt(email, user.id);
      throw new ApiError(401, "Invalid credentials");
    }

    await this._clearFailedAttempts(email);
    await user.update({ lastLogin: new Date() });

    // Publish login alert — non-blocking
    AuthEventPublisher.login({
      userId: user.id,
      email: user.email,
      ip: meta?.ip ?? "unknown",
      device: meta?.device ?? "unknown",
    });

    // ── Check if 2FA is enabled for admin accounts ───────────────────────────
    if (user.role === "admin" || (user.role as string) === "super_admin") {
      try {
        const { SystemSetting } = await import("../models/index");
        const DEFAULT_TWO_FA = true;
        const row = await SystemSetting.findOne({
          where: { section: "security" },
        });
        const securitySettings = row?.settings as Record<
          string,
          unknown
        > | null;
        const twoFaEnabled =
          securitySettings !== null
            ? securitySettings?.twoFa === true
            : DEFAULT_TWO_FA;

        if (twoFaEnabled) {
          // Send MFA OTP and return a partial response — NO JWT issued yet
          await this.sendMfaOtp(email);
          const userJson = user.toJSON() as unknown as Record<string, unknown>;
          delete userJson.password;
          return {
            requiresMfa: true,
            user: { id: user.id, email: user.email, role: user.role },
            accessToken: null,
            refreshToken: null,
          } as unknown as Awaited<ReturnType<typeof this.login>>;
        }
      } catch {
        // If settings fetch fails, proceed without 2FA
      }
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.isEmailVerified,
    });
    const refreshToken = await this.generateRefreshToken(user.id, {
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;

    let profile: Record<string, unknown> | null = null;
    if (user.role === "parent") {
      const parent = await ParentRepository.findOne({ userId: user.id });
      if (parent) {
        profile = {
          firstName: parent.firstName,
          middleName: parent.middleName ?? null,
          lastName: parent.lastName,
        };
      }
    }

    return {
      user: { ...userJson, profile },
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  private async _sendVerificationOtp(
    userId: string,
    email: string,
  ): Promise<void> {
    if (!isRedisReady()) return;

    const otp = crypto.randomInt(100_000, 1_000_000).toString();
    await redis.set(otpKey(email), `${userId}:${otp}`, "EX", OTP_TTL_SEC);

    logger.info(
      `[auth.service] Email verification OTP generated → ${email} otp=${otp} ttl=${OTP_TTL_SEC}s`,
    );
    AuthEventPublisher.otpSend({ userId, email, otp });
  }

  async resendVerificationEmail(email: string) {
    const user = await UserRepository.findOne({ email });
    if (!user) throw new ApiError(404, "No account found with that email");
    if (user.isEmailVerified)
      throw new ApiError(400, "Email is already verified");

    await this._sendVerificationOtp(user.id, user.email);
  }

  async verifyEmailOtp(email: string, otp: string) {
    if (!isRedisReady())
      throw new ApiError(503, "Verification service temporarily unavailable");

    const stored = await redis.get(otpKey(email));
    if (!stored)
      throw new ApiError(400, "OTP has expired or was never requested");

    const [userId, storedOtp] = stored.split(":");
    if (storedOtp !== otp) throw new ApiError(400, "Invalid OTP");

    const user = await UserRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.isEmailVerified) {
      await redis.del(otpKey(email));
      throw new ApiError(400, "Email is already verified");
    }

    await user.update({ isEmailVerified: true });
    await redis.del(otpKey(email));
  }

  /** @deprecated */
  private async _publishVerificationEmail(
    userId: string,
    email: string,
    name: string,
  ): Promise<void> {
    if (!isRedisReady()) return;

    const token = crypto.randomBytes(32).toString("hex");
    const verifyUrl = `${env.appUrl}/api/v1/auth/verify-email?token=${token}`;

    await redis.set(emailVerifyKey(token), userId, "EX", EMAIL_VERIFY_TTL_SEC);

    AuthEventPublisher.emailVerification({ userId, email, verifyUrl, name });
  }

  async verifyEmail(token: string) {
    if (!isRedisReady())
      throw new ApiError(503, "Verification service temporarily unavailable");

    const userId = await redis.get(emailVerifyKey(token));
    if (!userId)
      throw new ApiError(400, "Verification link is invalid or has expired");

    const user = await UserRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.isEmailVerified) {
      await redis.del(emailVerifyKey(token));
      throw new ApiError(400, "Email is already verified");
    }

    await user.update({ isEmailVerified: true });
    await redis.del(emailVerifyKey(token));
  }

  async forgotPassword(email: string) {
    const user = await UserRepository.findOne({ email });
    if (!user || !isRedisReady()) return;
    const otp = crypto.randomInt(100_000, 1_000_000).toString();
    await redis.set(pwResetKey(email), otp, "EX", PW_RESET_TTL_SEC);

    logger.info(
      `[auth.service] Password reset OTP generated → ${email} otp=${otp} ttl=${PW_RESET_TTL_SEC}s`,
    );
    AuthEventPublisher.otpSend({ userId: user.id, email: user.email, otp });
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!isRedisReady())
      throw new ApiError(503, "Password reset service temporarily unavailable");

    const storedOtp = await redis.get(pwResetKey(email));
    if (!storedOtp)
      throw new ApiError(400, "Reset code is invalid or has expired");
    if (storedOtp !== otp) throw new ApiError(400, "Invalid reset code");

    const user = await UserRepository.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    await redis.del(pwResetKey(email));

    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null } },
    );

    AuthEventPublisher.passwordChanged({ userId: user.id, email: user.email });
  }

  // ── MFA (2FA login OTP) ─────────────────────────────────────────────────────
  // Uses a separate Redis key space ("mfa:") so it never conflicts with
  // email-verification OTPs. No isEmailVerified guard needed.

  private mfaKey = (email: string) => `mfa:${email}`;

  async sendMfaOtp(email: string): Promise<void> {
    if (!isRedisReady())
      throw new ApiError(503, "OTP service is temporarily unavailable");

    const user = await UserRepository.findOne({ email });
    if (!user) throw new ApiError(404, "No account found with that email");
    if (!user.isActive) throw new ApiError(401, "Account is deactivated");

    const otp = crypto.randomInt(100_000, 1_000_000).toString();
    await redis.set(this.mfaKey(email), `${user.id}:${otp}`, "EX", OTP_TTL_SEC);

    logger.info(
      `[auth.service] MFA OTP generated → ${email} otp=${otp} ttl=${OTP_TTL_SEC}s`,
    );
    // Send directly via SMTP — bypasses RabbitMQ so it works even if the
    // message queue is down. MFA OTPs are time-critical and must be delivered.
    await emailService.sendOtp({ email: user.email, otp });
  }

  async verifyMfaOtp(email: string, otp: string): Promise<void> {
    if (!isRedisReady())
      throw new ApiError(503, "OTP service is temporarily unavailable");

    const stored = await redis.get(this.mfaKey(email));
    if (!stored)
      throw new ApiError(400, "OTP has expired or was never requested");

    const [, storedOtp] = stored.split(":");
    if (storedOtp !== otp) throw new ApiError(400, "Invalid OTP code");

    await redis.del(this.mfaKey(email));
  }

  // ── Login with MFA — issues JWT only after OTP verified ─────────────────────
  async loginMfa(email: string, meta?: { ip?: string; device?: string }) {
    const user = await UserRepository.findOne({ email });
    if (!user || !user.isActive)
      throw new ApiError(401, "User not found or deactivated");

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as Parameters<typeof this.generateAccessToken>[0]["role"],
      emailVerified: user.isEmailVerified,
      mfaVerified: true,
      authLevel: "MFA",
    });

    const refreshToken = await this.generateRefreshToken(user.id, {
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;

    return {
      user: { ...userJson, profile: null },
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  generateAccessToken(input: GenerateAccessTokenInput): string {
    const {
      userId,
      email,
      role,
      emailVerified,
      sessionId = `sess_${crypto.randomBytes(8).toString("hex")}`,
      mfaVerified = false,
      authLevel = "STANDARD",
    } = input;

    const tokenId = `jti_${crypto.randomBytes(8).toString("hex")}`;
    const now = Math.floor(Date.now() / 1000);

    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      iss: env.jwtIssuer,
      sub: userId,
      aud: env.jwtAudience,
      userId,
      email,
      roles: [role.toUpperCase() as Uppercase<typeof role>],
      permissions: {
        parent: role === "parent",
        school: role === "school",
        admin: role === "admin",
      },
      security: {
        tokenType: "ACCESS",
        sessionId,
        tokenId,
        authLevel,
        mfaVerified,
        emailVerified,
      },
      nbf: now,
    };

    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  async generateRefreshToken(
    userId: string,
    user: { email: string; role: string; isEmailVerified: boolean },
    sessionId?: string,
  ) {
    const role = user.role as Parameters<
      typeof this.generateAccessToken
    >[0]["role"];
    const sid = sessionId ?? `sess_${crypto.randomBytes(8).toString("hex")}`;
    const tokenId = `jti_${crypto.randomBytes(8).toString("hex")}`;
    const now = Math.floor(Date.now() / 1000);

    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      iss: env.jwtIssuer,
      sub: userId,
      aud: env.jwtAudience,
      userId,
      email: user.email,
      roles: [role.toUpperCase() as Uppercase<typeof role>],
      permissions: {
        parent: role === "parent",
        school: role === "school",
        admin: role === "admin",
      },
      security: {
        tokenType: "REFRESH",
        sessionId: sid,
        tokenId,
        authLevel: "STANDARD",
        mfaVerified: false,
        emailVerified: user.isEmailVerified,
      },
      nbf: now,
    };

    const token = jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"],
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const record = await RefreshTokenRepository.create({
      token,
      userId,
      expiresAt,
    });
    return record;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const stored = await RefreshTokenRepository.findOne({ token });
    if (stored) {
      await stored.update({ revokedAt: new Date() });
    }
  }

  async refreshToken(token: string) {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    if (decoded.security?.tokenType !== "REFRESH") {
      throw new ApiError(401, "Invalid token type");
    }

    const stored = await RefreshTokenRepository.findOne({ token });
    if (!stored || !stored.isActive) {
      throw new ApiError(401, "Refresh token has been revoked");
    }

    const user = await UserRepository.findById(stored.userId);
    if (!user) throw new ApiError(401, "User no longer exists");
    if (!user.isActive) throw new ApiError(401, "User account is deactivated");

    const newRefreshRecord = await this.generateRefreshToken(
      user.id,
      {
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      decoded.security.sessionId,
    );

    await stored.update({
      revokedAt: new Date(),
      replacedByToken: newRefreshRecord.token,
    });

    return {
      accessToken: this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.isEmailVerified,
        sessionId: decoded.security.sessionId,
      }),
      refreshToken: newRefreshRecord.token,
    };
  }

  private async _recordFailedAttempt(email: string, userId: string) {
    if (!isRedisReady()) return;

    const attempts = await redis.incr(lockKey(email));
    if (attempts === 1) await redis.expire(lockKey(email), LOCKOUT_WINDOW_SEC);

    if (attempts >= LOCKOUT_MAX_ATTEMPTS) {
      await redis.set(cooldownKey(email), "1", "EX", LOCKOUT_COOLDOWN_SEC);
      await redis.del(lockKey(email));

      const minutes = Math.ceil(LOCKOUT_COOLDOWN_SEC / 60);
      AuthEventPublisher.accountLocked({ email, minutes });
    }
  }

  private async _clearFailedAttempts(email: string) {
    if (!isRedisReady()) return;
    await redis.del(lockKey(email));
    await redis.del(cooldownKey(email));
  }
}

export default new AuthService();
