import { Request, Response } from 'express'
import { groupService } from '~/service/group.service'
import { EHttpStatus } from '~/types/httpStatus'
import axios from 'axios'

export const groupController = {
  createGroup: async (req: Request, res: Response) => {
    const { name, ownerId, members } = req.body
    try {
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${ownerId}`)
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
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  getGroupByUserId: async (req: Request, res: Response) => {
    const userId = req.params.id
    try {
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${userId}`)
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

      const groups = await groupService.getGroupByUserId(userId)
      res.status(EHttpStatus.OK).json({
        message: `Get List group successfully`,
        data: groups
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  getGroupDetail: async (req: Request, res: Response) => {
    const groupId = req.params.id
    try {
      const group = await groupService.getGroupDetail(groupId)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: `Group not found`
        })
        return
      }

      let user
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${group.ownerId}`)
        user = response.data?.data
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

      res.status(EHttpStatus.OK).json({
        message: `Get successfully`,
        data: {
          ...group,
          user
        }
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  getListUserByGroup: async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined
    const groupId = req.params.id
    try {
      const group = groupService.getGroupDetail(groupId)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: `Group not found`
        })
        return
      }
      const usersId = await groupService.findManyUserByGroup(groupId, search)

      res.status(EHttpStatus.OK).json({
        message: `get successfully`,
        data: usersId.data
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  deleteGroupByUserId: async (req: Request, res: Response) => {
    try {
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  updateGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const data = req.body
    try {
      const group = await groupService.updateGroup(groupId, data)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: 'Group not found'
        })
        return
      }

      res.status(EHttpStatus.OK).json({
        message: 'Update successfully',
        data: group
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  updateLeaveGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const userId = req.params.userId
    const { ownerId } = req.body
    try {
      const group = await groupService.updateLeaveGroup(groupId, userId, ownerId)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: 'Group not found'
        })
        return
      }
      res.status(EHttpStatus.OK).json({
        message: 'Update successfully',
        data: group
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  updateRoleGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const userId = req.params.userId
    try {
      const groupMember = await groupService.updateRoleGroup(groupId, userId)

      res.status(EHttpStatus.OK).json({
        message: 'Update successfully',
        data: groupMember
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  addMemberGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const userId = req.params.userId
    try {
      const group = await groupService.getGroupDetail(groupId)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: `Group not found`
        })
        return
      }
      const newMember = await groupService.addMember(groupId, userId)
      res.status(EHttpStatus.OK).json({
        message: 'Add member successfully',
        data: newMember
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  },

  deleteMemberInGroup: async (req: Request, res: Response) => {
    const groupId = req.params.id
    const userId = req.params.memberId
    try {
      const group = await groupService.getGroupDetail(groupId)
      if (!group) {
        res.status(EHttpStatus.NOT_FOUND).json({
          message: `Group not found`
        })
        return
      }
      const result = await groupService.deleteMemberInGroup(groupId, userId)

      if (!result) {
        res.status(EHttpStatus.OK).json({
          message: `Member not found in group`
        })
        return
      }
      res.status(EHttpStatus.OK).json({
        message: 'Delete successfully',
        data: result
      })
    } catch (error) {
      res.status(EHttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Internal server error: ${error}`
      })
    }
  }
}
