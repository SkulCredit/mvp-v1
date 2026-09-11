import { Notification, DeviceToken } from '../models/index';
import { emitToUser, isSocketReady } from '../config/socketio';
import { getFirebaseMessaging, isFirebaseReady } from '../config/firebase';
import { AnyNotificationPayload } from './notification.types';
import logger from '../config/logger';

class NotificationService {

  async dispatch(payload: AnyNotificationPayload): Promise<void> {
    const notification = await this.persist(payload);
    await Promise.allSettled([
      this.pushSocket(payload.userId, notification),
      this.pushFCM(payload.userId, payload.title, payload.message),
    ]);
  }

  async persist(payload: AnyNotificationPayload) {
    return Notification.create({
      userId:        payload.userId,
      title:         payload.title,
      message:       payload.message,
      type:          payload.type,
      referenceId:   payload.referenceId   ?? null,
      referenceType: payload.referenceType ?? null,
    });
  }

  private async pushSocket(userId: string, notification: InstanceType<typeof Notification>): Promise<void> {
    if (!isSocketReady()) return;
    emitToUser(userId, 'notification:new', notification.toJSON());
    logger.info(`Socket.IO emit → user:${userId} [${notification.type}]`);
  }

  private async pushFCM(userId: string, title: string, body: string): Promise<void> {
    if (!isFirebaseReady()) return;

    const tokens = await DeviceToken.findAll({ where: { userId } });
    if (tokens.length === 0) return;

    const messaging = getFirebaseMessaging() as {
      sendEachForMulticast: (msg: {
        tokens: string[];
        notification?: { title: string; body: string };
        android?: { priority: string };
        apns?: { payload: { aps: { sound: string } } };
      }) => Promise<{
        successCount: number;
        responses: Array<{ success: boolean; error?: { code?: string } }>;
      }>;
    } | null;
    if (!messaging) return;

    const fcmTokens = tokens.map((t) => t.token);

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        android: { priority: 'high' },
        apns:    { payload: { aps: { sound: 'default' } } },
      });

      const failed = response.responses.filter((r: { success: boolean }) => !r.success);
      if (failed.length > 0) {
        logger.warn(`FCM: ${failed.length}/${fcmTokens.length} tokens failed for userId=${userId}`);
        await this.pruneInvalidTokens(userId, tokens, response.responses);
      }

      logger.info(`FCM sent to userId=${userId} — success=${response.successCount}/${fcmTokens.length}`);
    } catch (err) {
      logger.error(`FCM send error for userId=${userId}: ${(err as Error).message}`);
    }
  }

  private async pruneInvalidTokens(
    userId: string,
    tokens: InstanceType<typeof DeviceToken>[],
    responses: Array<{ success: boolean; error?: { code?: string } }>
  ): Promise<void> {
    const invalidCodes = new Set([
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
    ]);

    const toDelete = tokens
      .filter((_, i) => !responses[i].success && invalidCodes.has(responses[i].error?.code ?? ''))
      .map((t) => t.id);

    if (toDelete.length > 0) {
      await DeviceToken.destroy({ where: { id: toDelete } });
      logger.info(`Pruned ${toDelete.length} stale FCM tokens for userId=${userId}`);
    }
  }

  async getForUser(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return {
      notifications: rows,
      unreadCount:   await Notification.count({ where: { userId, isRead: false } }),
      pagination: {
        total:      count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await Notification.findOne({ where: { id: notificationId, userId } });
    if (!notification || notification.isRead) return notification;
    return notification.update({ isRead: true, readAt: new Date() });
  }

  async markAllRead(userId: string) {
    const [count] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    return { updated: count };
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const deleted = await Notification.destroy({ where: { id: notificationId, userId } });
    return deleted > 0;
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web'
  ) {
    const [record] = await DeviceToken.findOrCreate({
      where: { token },
      defaults: { userId, token, platform },
    });
    if (record.userId !== userId) {
      await record.update({ userId, platform });
    }
    return record;
  }

  async removeDeviceToken(userId: string, token: string): Promise<boolean> {
    const deleted = await DeviceToken.destroy({ where: { userId, token } });
    return deleted > 0;
  }
}

export default new NotificationService();
