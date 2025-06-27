import axios from 'axios'
import { Request, Response } from 'express'
import { groupService } from '~/service/group.service'
import { messageService } from '~/service/message.service'
import { EHttpStatus } from '~/types/httpStatus'

export const messageController = {
  createMessageByGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const { senderId } = req.body
    try {
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${senderId}`)
        const user = response.data?.data
        if (!user) {
          res.status(EHttpStatus.NOT_FOUND).json({
            message: `User not found`
          })
          return
        }
      } catch (error) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: `User not found`
        })
        return
      }

      const message = await messageService.createMessageByGroup({
        senderId,
        groupId,
        ...req.body
      })

      res.status(EHttpStatus.OK).json({
        message: `Create successfully`,
        data: message
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  getMessagesByGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search?.toString() || ''

    try {
      const group = await groupService.findGroupById(groupId)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({ message: 'Group not found' })
        return
      }

      const members = await groupService.findManyUserByGroup(groupId)

      const messages = await messageService.getMessagesByGroup(groupId, page, limit, members.data.length, search)

      res.status(EHttpStatus.OK).json({
        message: 'Get group detail successfully',
        data: {
          group,
          members: members.data,
          ...messages
        }
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  // getGeneral: async (req: Request, res: Response) => {

  // },

  updateMessage: async (req: Request, res: Response) => {
    const messageId = req.params.id
    const data = req.body

    try {
      const message = await messageService.updateMessageByGroup(messageId, data)
      res.status(EHttpStatus.OK).json({
        message: 'update message successfull',
        data: message
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  deleteMessageForEveryone: async (req: Request, res: Response) => {
    const messageId = req.params.id
    try {
      const message = await messageService.deleteMessageForEveryone(messageId)
      res.status(EHttpStatus.OK).json({
        message: 'delete message successfull',
        data: message
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  deleteMessageForMe: async (req: Request, res: Response) => {
    const userId = req.params.userId
    const messageId = req.params.id
    try {
      const message = await messageService.deleteMessageForMe(userId, messageId)

      res.status(EHttpStatus.OK).json({
        message: 'delete message successfull',
        data: message
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  updateIsReadMessage: async (req: Request, res: Response) => {
    const userId = req.params.userId
    const groupId = req.params.id
    try {
      const group = await messageService.updateIsReadMessage(userId, groupId)
      res.status(EHttpStatus.OK).json({
        message: 'Update is read message successfull',
        data: group
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  }
}
