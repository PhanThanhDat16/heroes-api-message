import { get } from 'axios'
import { Request, Response } from 'express'
import { notificationService } from '~/service/notification.service'
import { EHttpStatus } from '~/types/httpStatus'

export const notificationController = {
  createNotification: async (req: Request, res: Response) => {
    const data = req.body
    try {
      const notification = await notificationService.createNotification(data)

      res.status(EHttpStatus.OK).json({
        
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  getNotifications: async (req: Request, res: Response) => {},

  deleteNotification: async (req: Request, res: Response) => {},

  updateNotification: async (req: Request, res: Response) => {}
}
