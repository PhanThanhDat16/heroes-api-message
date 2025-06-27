import express from 'express';
import { notificationController } from '~/controller/notification.controller';

const router = express.Router();

router.post('/', notificationController.createNotification)
router.get('/user/:id', notificationController.getNotifications)
router.delete('/:id/user/:userId', notificationController.deleteNotification)
router.put('/:id/user/:userId/read', notificationController.updateReadNotification)
export const routerNotification = router;