import { Request, Response } from 'express'
import { notificationService } from '~/service/notification.service'
import { EHttpStatus } from '~/types/httpStatus'
import asyncHandler from 'express-async-handler'

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

  deleteNotification: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const notiId = req.params.id
    const notification = await notificationService.deleteNotification(userId, notiId)
    res.status(EHttpStatus.OK).json({
      message: 'Delete notification success',
      data: notification
    })
  }),

  deleteAllNotification: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id
    await notificationService.deleteAllNotification(userId)
    res.status(EHttpStatus.OK).json({
      message: 'Delete all notification success'
    })
  })
}
