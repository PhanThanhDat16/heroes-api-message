import { Request, Response } from 'express'
import { groupService } from '~/service/group.service'
import { EHttpStatus } from '~/types/httpStatus'
import axios from 'axios'
import asyncHandler from 'express-async-handler'
import { IRequestWithUser } from '~/middleware/auth.middleware'
import { GroupMember } from '~/model/grouMember'
import { ENameEvent } from '~/types/nameEventSocket'
import { getIO } from '~/socket/socket'
// import { getIO, onlineUsers } from '~/socket/socket'
import { getOnlineUserSocketId } from '~/redis/redisOnlineUserService'

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

    // socket
    const dataSocket = {
      ...group,
      members
    }
    const io = getIO()
    members.forEach(async (member: any) => {
      const memberId = member
      // const memberSocketId = onlineUsers.get(memberId)
      const memberSocketId = await getOnlineUserSocketId(memberId)
      if (memberSocketId) {
        io.to(memberSocketId).emit(ENameEvent.NEW_GROUP, dataSocket)
      }
    })
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
    const { user: userJWT } = req as IRequestWithUser
    if (!userJWT) {
      res.status(EHttpStatus.UNAUTHORIZED).json({
        message: 'User not authenticated'
      })
      return
    }
    const userId = userJWT.id

    const group = await groupService.getGroupDetail(groupId, userId)
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

  verifyGroupDetail: asyncHandler(async (req, res) => {
    const groupId = req.params.id
    const { user: userJWT } = req as IRequestWithUser

    if (!userJWT) {
      res.status(EHttpStatus.FORBIDDEN).json({ message: 'User not authenticated' })
      return
    }

    const inGroup = await GroupMember.findOne({ userId: userJWT.id, groupId }).lean()
    if (!inGroup) {
      res.status(EHttpStatus.OK).json({ message: 'OK', data: { access: false } })
      return
    }
    res.status(EHttpStatus.OK).json({ message: 'OK', data: { access: true } })
  }),

  getListUserByGroup: asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined
    const groupId = req.params.id
    const { user: userJWT } = req as IRequestWithUser
    if (!userJWT) {
      res.status(EHttpStatus.UNAUTHORIZED).json({
        message: 'User not authenticated'
      })
      return
    }
    const userId = userJWT.id

    const group = groupService.getGroupDetail(groupId, userId)
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
    const { name: newName, senderId, senderName } = req.body
    const group = await groupService.updateGroup(groupId, newName, senderId, senderName)
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
    const { users, group } = req.body
    const { user: userJWT } = req as IRequestWithUser
    if (!userJWT) {
      res.status(EHttpStatus.UNAUTHORIZED).json({
        message: 'User not authenticated'
      })
      return
    }
    const userId = userJWT.id

    const checkGroup = await groupService.getGroupDetail(groupId, userId)
    if (!checkGroup) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `Group not found`
      })
      return
    }

    const newMember = await groupService.addMember(groupId, users, group, userId)
    res.status(EHttpStatus.OK).json({
      message: 'Add member successfully',
      data: {
        ...newMember
      }
    })
  }),

  updateLeaveGroup: asyncHandler(async (req: Request, res: Response) => {
    const { id: groupId, userId } = req.params
    const { ownerId: newOwnerId, oldOwnerId } = req.body

    const group = await groupService.updateLeaveGroup(groupId, userId, newOwnerId, oldOwnerId)
    res.status(EHttpStatus.OK).json({
      message: 'Update successfully',
      data: { ...group }
    })
  }),

  deleteMemberInGroup: asyncHandler(async (req: Request, res: Response) => {
    const { id: groupId, memberId: userId } = req.params
    const { ownerId } = req.body
    const { user: userJWT } = req as IRequestWithUser
    if (!userJWT) {
      res.status(EHttpStatus.UNAUTHORIZED).json({
        message: 'User not authenticated'
      })
      return
    }
    const userIdToken = userJWT.id

    const group = await groupService.getGroupDetail(groupId, userIdToken)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: `Group not found`
      })
      return
    }
    const result = await groupService.deleteMemberInGroup(groupId, userId, ownerId)
    res.status(EHttpStatus.OK).json({
      message: 'Delete successfully',
      data: { ...result }
    })
  }),

  addTagForGroup: asyncHandler(async (req: Request, res: Response) => {
    const { id: groupId, userId } = req.params
    const { tag } = req.body
    const groupMember = await groupService.addTag(groupId, userId, tag)
    res.status(EHttpStatus.OK).json({
      message: 'Delete successfully',
      data: groupMember
    })
  }),

  getManyGroupByUser: asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as IRequestWithUser
    if (!user) {
      res.status(EHttpStatus.UNAUTHORIZED).json({
        message: 'User not authenticated'
      })
      return
    }
    const userId = user.id
    const search = req.query.search?.toString() || ''
    const listGroup = await groupService.findManyGroup(userId, search)
    res.status(EHttpStatus.OK).json({
      message: 'find list group successfully',
      data: listGroup
    })
  }),

  updateThemeGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const { theme, senderId, senderName } = req.body
    const group = await groupService.updateThemeGroup(groupId, theme, senderId, senderName)
    if (!group) {
      res.status(EHttpStatus.NOT_FOUND).json({
        message: 'Group not found'
      })
      return
    }

    res.status(EHttpStatus.OK).json({
      message: 'Update Theme successfully',
      data: { ...group }
    })
  }),

  deleteGroup: asyncHandler(async (req: Request, res: Response) => {
    const groupId = req.params.id
    const groupDeleted = await groupService.deleteGroup(groupId)
    res.status(EHttpStatus.OK).json({
      message: 'Delete group successfully',
      data: groupDeleted
    })
  })
}
