import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/',             notificationController.getNotifications.bind(notificationController));
router.put('/read-all',     notificationController.markAllRead.bind(notificationController));
router.put('/:id/read',     notificationController.markRead.bind(notificationController));
router.delete('/:id',       notificationController.deleteNotification.bind(notificationController));

router.post('/device-token',        notificationController.registerDeviceToken.bind(notificationController));
router.delete('/device-token',      notificationController.removeDeviceToken.bind(notificationController));

export default router;
