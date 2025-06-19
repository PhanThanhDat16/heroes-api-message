import express from 'express';
import { notificationController } from '~/controller/notification.controller';

const router = express.Router();

router.post('/', notificationController.createNotification)

export const routerNotification = router;