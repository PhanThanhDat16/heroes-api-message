import express from 'express'
import { notificationController } from '~/controller/notification.controller'
import { errorHandler } from '~/middleware/error.middleware'

const router = express.Router()

router.post('/', notificationController.createNotification)
router.get('/user/:id', notificationController.getNotifications)
router.delete('/:id/user/:userId', notificationController.deleteNotification)
router.delete('/user/:id', notificationController.deleteAllNotification)
router.put('/:id/user/:userId/read', notificationController.updateReadNotification)

router.use(errorHandler)

export const routerNotification = router
