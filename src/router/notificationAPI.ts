import express from 'express'
import { notificationController } from '~/controller/notification.controller'
import { requireAuth } from '~/middleware/auth.middleware'
import { errorHandler } from '~/middleware/error.middleware'

const router = express.Router()

router.post('/', notificationController.createNotification)
router.get('/user/:id', notificationController.getNotifications)
router.delete('/user/:id', notificationController.deleteAllNotification)
router.put('/user/:userId/read-all', notificationController.readAllNotifications)
router.put('/:id/user/read', requireAuth, notificationController.readNotifications)

router.use(errorHandler)

export const routerNotification = router
