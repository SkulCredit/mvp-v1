import { Request, Response, NextFunction } from "express";
import notificationService from "../notifications/notification.service";
import { successResponse } from "../utils/response";
import ApiError from "../utils/apiError";

class NotificationController {
  async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
      const limit = Math.min(
        50,
        Math.max(1, parseInt(String(req.query.limit ?? 20))),
      );
      const result = await notificationService.getForUser(
        req.user!.userId,
        page,
        limit,
      );
      successResponse(res, 200, "Notifications fetched", result);
    } catch (error) {
      next(error);
    }
  }

  async markRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const notification = await notificationService.markRead(
        req.user!.userId,
        String(req.params.id),
      );
      if (!notification) throw new ApiError(404, "Notification not found");
      successResponse(res, 200, "Notification marked as read", notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await notificationService.markAllRead(req.user!.userId);
      successResponse(res, 200, "All notifications marked as read", result);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const deleted = await notificationService.deleteNotification(
        req.user!.userId,
        String(req.params.id),
      );
      if (!deleted) throw new ApiError(404, "Notification not found");
      successResponse(res, 200, "Notification deleted");
    } catch (error) {
      next(error);
    }
  }

  async registerDeviceToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, platform } = req.body as {
        token: string;
        platform: "ios" | "android" | "web";
      };
      if (!token || !platform)
        throw new ApiError(400, "token and platform are required");
      const record = await notificationService.registerDeviceToken(
        req.user!.userId,
        token,
        platform,
      );
      successResponse(res, 200, "Device token registered", record);
    } catch (error) {
      next(error);
    }
  }

  async removeDeviceToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body as { token: string };
      if (!token) throw new ApiError(400, "token is required");
      const removed = await notificationService.removeDeviceToken(
        req.user!.userId,
        token,
      );
      if (!removed) throw new ApiError(404, "Device token not found");
      successResponse(res, 200, "Device token removed");
    } catch (error) {
      next(error);
    }
  }

  async replyToNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { message } = req.body as { message: string };
      if (!message?.trim()) throw new ApiError(400, "message is required");
      const result = await notificationService.replyToNotification(
        req.user!.userId,
        String(req.params.id),
        message.trim(),
      );
      successResponse(res, 201, "Reply sent", result);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
