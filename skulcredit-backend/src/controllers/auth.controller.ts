import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import { successResponse } from "../utils/response";
import redis from "../config/redis";
import env from "../config/env";

const COOKIE_NAME = "sc_refresh";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; 

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, 
    secure: env.nodeEnv === "production", 
    sameSite: env.nodeEnv === "production" ? "strict" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/api/v1/auth", 
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/api/v1/auth" });
}

class AuthController {
  async checkAvailability(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.query.email as string | undefined;
      const phone = req.query.phone as string | undefined;
      const result = await authService.checkAvailability(email, phone);
      successResponse(res, 200, "Availability checked", result);
    } catch (error) {
      next(error);
    }
  }

  async registerParent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.registerParent(req.body);
      successResponse(
        res,
        201,
        "Parent registered successfully. Check your email to verify your account.",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async registerSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.registerSchool(req.body);
      successResponse(
        res,
        201,
        "School registered successfully. Check your email to verify your account.",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const ip =
        (req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")[0]
          .trim() ??
        req.ip ??
        "unknown";
      const device = req.headers["user-agent"] ?? "unknown";

      const result = await authService.login(email, password, { ip, device });

      setRefreshCookie(res, result.refreshToken);
      const { refreshToken: _drop, ...safeResult } = result;
      successResponse(res, 200, "Login successful", safeResult);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token: string | undefined = req.cookies?.[COOKIE_NAME];
      if (token) {
        await authService.revokeRefreshToken(token).catch(() => {});
      }
      clearRefreshCookie(res);
      successResponse(res, 200, "Logout successful");
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token: string | undefined =
        req.cookies?.[COOKIE_NAME] ?? req.body?.token;

      if (!token) {
        res
          .status(401)
          .json({ success: false, message: "No refresh token provided" });
        return;
      }

      const result = await authService.refreshToken(token);

      setRefreshCookie(res, result.refreshToken);
      successResponse(res, 200, "Token refreshed successfully", {
        accessToken: result.accessToken,
      });
    } catch (error) {
      clearRefreshCookie(res);
      next(error);
    }
  }

  async resendVerification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await authService.resendVerificationEmail(req.body.email);
      successResponse(
        res,
        200,
        "Verification OTP sent. Please check your inbox.",
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await authService.verifyEmail(req.query.token as string);
      successResponse(
        res,
        200,
        "Email verified successfully. You can now log in.",
      );
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      successResponse(
        res,
        200,
        "If an account with that email exists, a password reset link has been sent.",
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await authService.resetPassword(
        req.body.email,
        req.body.otp,
        req.body.password,
      );
      successResponse(
        res,
        200,
        "Password reset successfully. You can now log in with your new password.",
      );
    } catch (error) {
      next(error);
    }
  }

  async sendOtp(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (redis.status !== "ready") {
        res.status(503).json({
          success: false,
          message: "OTP service is temporarily unavailable.",
        });
        return;
      }

      await authService.resendVerificationEmail(email);
      successResponse(res, 200, "OTP sent successfully");
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (redis.status !== "ready") {
        res.status(503).json({
          success: false,
          message: "OTP service is temporarily unavailable.",
        });
        return;
      }

      await authService.verifyEmailOtp(email, String(otp));
      successResponse(
        res,
        200,
        "Email verified successfully. You can now log in.",
      );
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.createAdmin(req.body);
      successResponse(res, 201, "Admin account created successfully", result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
