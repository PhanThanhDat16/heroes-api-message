import { Request, Response } from 'express'
import { notificationService } from '~/service/notification.service'
import { EHttpStatus } from '~/types/httpStatus'
import asyncHandler from 'express-async-handler'
import { IRequestWithUser } from '~/middleware/auth.middleware'

export const notificationController = {
  createNotification: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body
    const notification = await notificationService.createNotification(data)
    res.status(EHttpStatus.OK).json({
      message: 'Create notification success',
      data: notification
    })
  }),

  getNotifications: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id
    const notification = await notificationService.getNotification(userId)
    res.status(EHttpStatus.OK).json({
      message: 'Get notification success',
      data: notification
    })
  }),

  updateReadNotification: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const notiId = req.params.id
    const noti = await notificationService.updateReadNotification(userId, notiId)
    res.status(EHttpStatus.OK).json({
      message: 'Update read notification success',
      data: noti
    })
  }),

  deleteAllNotification: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id
    await notificationService.deleteAllNotification(userId)
    res.status(EHttpStatus.OK).json({
      message: 'Delete all notification success'
    })
  }),

  readAllNotifications: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const result = await notificationService.readAllNotifications(userId)
    res.status(EHttpStatus.OK).json({
      message: 'Marked all notifications as read',
      data: result
    })
  }),

  readNotifications: asyncHandler(async (req: Request, res: Response) => {
    const notiId = req.params.id
    const { user: userJWT } = req as IRequestWithUser
    if (!userJWT) {
      res.status(EHttpStatus.UNAUTHORIZED).json({
        message: 'User not authenticated'
      })
      return
    }
    const result = await notificationService.readNotifications(notiId, userJWT.id)
    res.status(EHttpStatus.OK).json({
      message: 'Marked all notifications as read',
      data: result
    })
  })
}
