import axios from 'axios'
import { Request, Response } from 'express'
import { groupService } from '~/service/group.service'
import { messageService } from '~/service/message.service'
import { EHttpStatus } from '~/types/httpStatus'
import asyncHandler from 'express-async-handler'

export const messageController = {
  createMessageByGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const { senderId } = req.body
    const data = req.body
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${senderId}`)
    const user = response.data?.data
    if (!user) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `User not found`
      })
      return
    }

    const message = await messageService.createMessageByGroup({
      groupId,
      ...data
    })

    res.status(EHttpStatus.OK).json({
      message: `Create successfully`,
      data: message
    })
  }),

  getMessagesByGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search?.toString() || ''
    const group = await groupService.findGroupById(groupId)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({ message: 'Group not found' })
      return
    }
    const members = await groupService.findManyUserByGroup(groupId)
    // console.l
    const messages = await messageService.getMessagesByGroup(groupId, page, limit, members.data.length, search)
    res.status(EHttpStatus.OK).json({
      message: 'Get group detail successfully',
      data: {
        group,
        members: members.data,
        ...messages
      }
    })
  }),

  // getGeneral: async (req: Request, res: Response) => {

  // },

  updateMessage: asyncHandler(async (req: Request, res: Response) => {
    const messageId = req.params.id
    const data = req.body

    const message = await messageService.updateMessageByGroup(messageId, data)
    res.status(EHttpStatus.OK).json({
      message: 'update message successfull',
      data: message
    })
  }),

  deleteMessageForEveryone: asyncHandler(async (req: Request, res: Response) => {
    const messageId = req.params.id
    const message = await messageService.deleteMessageForEveryone(messageId)
    res.status(EHttpStatus.OK).json({
      message: 'delete message successfull',
      data: message
    })
  }),

  deleteMessageForMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const messageId = req.params.id
    const message = await messageService.deleteMessageForMe(userId, messageId)

    res.status(EHttpStatus.OK).json({
      message: 'delete message successfull',
      data: message
    })
  }),

  updateIsReadMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const groupId = req.params.id
    const group = await messageService.updateIsReadMessage(userId, groupId)
    res.status(EHttpStatus.OK).json({
      message: 'Update is read message successfull',
      data: group
    })
  })
}
