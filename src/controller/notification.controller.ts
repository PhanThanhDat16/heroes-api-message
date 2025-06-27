import { Request, Response } from 'express'
import { notificationService } from '~/service/notification.service'
import { EHttpStatus } from '~/types/httpStatus'

export const notificationController = {
  createNotification: async (req: Request, res: Response) => {
    const data = req.body
    try {
      const notification = await notificationService.createNotification(data)
      res.status(EHttpStatus.OK).json({
        message: 'Create notification success',
        data: notification
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  getNotifications: async (req: Request, res: Response) => {
    const userId = req.params.id
    try {
      const notification = await notificationService.getNotification(userId)
      res.status(EHttpStatus.OK).json({
        message: 'Get notification success',
        data: notification
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  deleteNotification: async (req: Request, res: Response) => {
    const userId = req.params.userId
    const notiId = req.params.id
    try {
      const notification = await notificationService.deleteNotification(userId, notiId)
      res.status(EHttpStatus.OK).json({
        message: 'Delete notification success',
        data: notification
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  updateReadNotification: async (req: Request, res: Response) => {
    const userId = req.params.userId
    const notiId = req.params.id
    try {
      const noti = await notificationService.updateReadNotification(userId, notiId)
      res.status(EHttpStatus.OK).json({
        message: 'Delete notification success',
        data: noti
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  }
}
