import { Request, Response } from 'express'
import { groupService } from '~/service/group.service'
import { EHttpStatus } from '~/types/httpStatus'
import axios from 'axios'
import asyncHandler from 'express-async-handler'

export const groupController = {
  createGroup: asyncHandler(async (req: Request, res: Response) => {
    const { name, ownerId, members } = req.body
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${ownerId}`)
    const user = response.data?.data
    if (!user) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `User not found`
      })
      return
    }
    if (members.length > 0) {
      for (const memberId of members) {
        const memberUser = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${ownerId}`)
        if (!memberUser) {
          res.status(EHttpStatus.NOT_FOUND).json({ error: `Member user ${memberId} not found` })
          return
        }
      }
    }
    const group = await groupService.createGroup({ name, ownerId, members })
    res.status(EHttpStatus.OK).json({
      message: 'Group created successfully',
      data: group
    })
  }),

  getGroupByUserId: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${userId}`)
    const user = response.data?.data
    if (!user) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `User not found`
      })
      return
    }
    const groups = await groupService.getGroupByUserId(userId)
    res.status(EHttpStatus.OK).json({
      message: `Get List group successfully`,
      data: groups
    })
  }),

  getGroupDetail: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const group = await groupService.getGroupDetail(groupId)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `Group not found`
      })
      return
    }
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${group.ownerId}`)
    const user = response.data?.data
    if (!user) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `User not found`
      })
      return
    }
    res.status(EHttpStatus.OK).json({
      message: `Get successfully`,
      data: {
        ...group,
        user
      }
    })
  }),

  getListUserByGroup: asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined
    const groupId = req.params.id
    const group = groupService.getGroupDetail(groupId)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `Group not found`
      })
      return
    }
    const usersId = await groupService.findManyUserByGroup(groupId, search)

    res.status(EHttpStatus.OK).json({
      message: `Get list user by group successfully`,
      data: usersId.data
    })
  }),

  deleteGroupByUserId: asyncHandler(async (req: Request, res: Response) => {}),

  updateRoleGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const userId = req.params.userId
    const groupMember = await groupService.updateRoleGroup(groupId, userId)

    res.status(EHttpStatus.OK).json({
      message: 'Update successfully',
      data: groupMember
    })
  }),

  updateGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const data = req.body
    const group = await groupService.updateGroup(groupId, data)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: 'Group not found'
      })
      return
    }

    res.status(EHttpStatus.OK).json({
      message: 'Update successfully',
      data: { ...group }
    })
  }),

  addMemberGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const data = req.body
    const group = await groupService.getGroupDetail(groupId)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `Group not found`
      })
      return
    }
    const newMember = await groupService.addMember(groupId, data)
    res.status(EHttpStatus.OK).json({
      message: 'Add member successfully',
      data: {
        ...newMember
      }
    })
  }),

  updateLeaveGroup: asyncHandler(async (req: Request, res: Response) => {
    // const groupId = req.params.id
    // const userId = req.params.userId
    const { groupId, userId } = req.params
    const { newOwnerId } = req.body
    const group = await groupService.updateLeaveGroup(groupId, userId, newOwnerId)
    res.status(EHttpStatus.OK).json({
      message: 'Update successfully',
      data: { ...group }
    })
  }),

  deleteMemberInGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const userId = req.params.memberId
    const group = await groupService.getGroupDetail(groupId)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `Group not found`
      })
      return
    }
    const result = await groupService.deleteMemberInGroup(groupId, userId)
    res.status(EHttpStatus.OK).json({
      message: 'Delete successfully',
      data: { ...result }
    })
  })
}
