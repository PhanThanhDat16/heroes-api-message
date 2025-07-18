import axios from 'axios'
import { GroupMember } from '~/model/grouMember'
import { Group } from '~/model/group'
import { Message } from '~/model/message'
import { IGroup, IGroupCreate } from '~/types/group'
import { messageService } from './message.service'
import { notificationService } from './notification.service'
import { getIO, onlineUsers } from '~/socket/socket'
import { Notification } from '~/model/notification'
import { listTheme } from '~/constants/theme.constants'
import { IUser } from '~/types/user'
import { ENameEvent } from '~/types/nameEventSocket'

export const groupService = {
  createGroup: async ({ name, ownerId, members }: IGroupCreate) => {
    const group = new Group({ name, ownerId, theme: 'default' })
    await group.save()

    const ownerMember = new GroupMember({
      userId: ownerId,
      groupId: group._id,
      role: 'admin',
      tag: null
    })
    await ownerMember.save()

    const memberDocs = members.map(
      (userId) =>
        new GroupMember({
          userId,
          groupId: group._id,
          role: 'member',
          tag: null
        })
    )

    await Promise.all(memberDocs.map((doc) => doc.save()))
    await notificationService.createNotification({
      content: `You have new group with name ${name}`,
      groupId: group._id.toString()
    })

    const io = getIO()
    const socketIds = Array.from(onlineUsers.values())
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(ENameEvent.NEW_NOTIFICATION, {
        content: `You have a new group with name ${name}`,
        groupId: group._id.toString()
      })
    })
    return group
  },

  getGroupByUserId: async (userId: string) => {
    const groupsMember = await GroupMember.find({ userId }).populate('groupId').lean()
    const result = await Promise.all(
      groupsMember.map(async (member) => {
        const group = member.groupId as unknown as IGroup
        if (!group || !group._id) return null

        const lastMessage = await Message.findOne({
          groupId: group._id
        })
          .sort({ createdAt: -1 })
          .lean()

        let senderName = null
        if (lastMessage !== null) {
          if (lastMessage.senderId === null) {
            senderName = lastMessage.senderName || 'System'
          } else {
            const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${lastMessage.senderId}`)
            senderName = response.data?.data?.username || null
          }
        }

        return {
          ...group,
          readUsers: lastMessage?.readUsers ?? [],
          tag: member.tag,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId ?? 'System',
                senderName: senderName,
                createdAt: lastMessage.createdAt
              }
            : 'New Group'
        }
      })
    )

    return result.sort((a, b) => {
      const getTime = (group: any) => {
        if (typeof group.lastMessage === 'object' && group.lastMessage !== null && 'createdAt' in group.lastMessage) {
          return new Date(group.lastMessage.createdAt).getTime()
        }
        return group.createdAt ? new Date(group.createdAt).getTime() : 0
      }
      return getTime(b) - getTime(a)
    })
  },

  getGroupDetail: async (groupId: string, userId: string) => {
    // const group = await Group.findById(groupId).lean()
    // return group
    const [group, member] = await Promise.all([
      Group.findById(groupId).lean(),
      GroupMember.findOne({ groupId, userId }).lean()
    ])
    if (!group) return null
    return { ...group, tag: member?.tag ?? null }
  },

  findManyUserByGroup: async (groupId: string, search?: string | undefined) => {
    let users
    const userId = await GroupMember.find({ groupId: groupId }).select('userId -_id').lean()
    const listUserId = userId.map((u) => u.userId)

    if (!search || search.trim() === '') {
      const res = await axios.post(`${process.env.AUTH_SERVICE_URL}/internal/users`, { listUserId })
      users = res.data
    } else {
      const res = await axios.post(`${process.env.AUTH_SERVICE_URL}/internal/group/users`, { listUserId, search })
      users = res.data
    }
    return users
  },

  findGroupById: async (groupId: string) => {
    const group = await Group.findById(groupId).lean()
    return group
  },

  updateRoleGroup: async (groupId: string, userId: string) => {
    const groupMember = await GroupMember.findByIdAndUpdate({ groupId, userId }, { role: 'admin' }, { new: true })
    return groupMember
  },

  updateGroup: async (groupId: string, newName: string, senderId: string, senderName: string) => {
    const oldGroup = await Group.findById(groupId)
    const result = await Group.findByIdAndUpdate(groupId, { name: newName }, { new: true }).lean()
    if (!result) return false
    let message
    if (oldGroup && oldGroup.name !== newName) {
      const io = getIO()
      message = await messageService.createSystemMessage(groupId, `Group name changed to '${newName}'`)
      await notificationService.createNotification({
        content: `Group ${oldGroup.name} changed ${newName}`,
        groupId: oldGroup._id.toString()
      })

      // socket
      const dataSocket = {
        senderId,
        senderName,
        groupId: result._id,
        name: result.name
      }
      io.to(groupId).emit(ENameEvent.EDIT_GROUP, {
        ...dataSocket,
        timestamp: new Date()
      })
      io.to(groupId).emit(ENameEvent.RECEIVE_MESSAGE, {
        ...message.toObject(),
        groupId,
        createdAt: new Date()
      })

      const socketIds = Array.from(onlineUsers.values())
      socketIds.forEach((socketId) => {
        io.to(socketId).emit(ENameEvent.NEW_NOTIFICATION, {
          content: `Group name changed to '${newName}'`,
          groupId
        })
      })
    }

    return {
      result,
      message
    }
  },

  updateLeaveGroup: async (groupId: string, userId: string, newOwnerId?: string | null, oldOwnerId?: string | null) => {
    const result = await GroupMember.findOneAndDelete({ groupId, userId })
    await GroupMember.findOneAndUpdate({ groupId, userId: newOwnerId }, { role: 'admin' }, { new: true })
    await Group.findByIdAndUpdate(groupId, { ownerId: newOwnerId }, { new: true })
    const res = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${userId}`)
    const user = res.data.data
    let message
    if (user) {
      message = await messageService.createSystemMessage(groupId, `${user.username} has left the group`)
      await notificationService.createNotification({ content: `${user.username} has left the group`, groupId })

      // socket
      const io = getIO()
      io.to(groupId).emit(ENameEvent.KICK_USER, { oldOwnerId, groupId, userId })
      io.to(groupId).emit(ENameEvent.RECEIVE_MESSAGE, {
        ...message.toObject(),
        groupId,
        createdAt: new Date()
      })
      const socketIds = Array.from(onlineUsers.values())
      socketIds.forEach((socketId) => {
        io.to(socketId).emit(ENameEvent.NEW_NOTIFICATION, {
          content: `${user.username} has left the group`,
          groupId
        })
      })
    }
    return {
      result,
      message
    }
  },

  addMember: async (groupId: string, users: string[], group: IGroup, userId: string) => {
    const memberGroup = await Promise.all(
      users.map(async (uId) => {
        const member = new GroupMember({
          userId: uId,
          groupId,
          role: 'member',
          tags: []
        })
        await member.save()
        return member
      })
    )
    const listUserId = memberGroup.map((u) => u.userId)
    const res = await axios.post(`${process.env.AUTH_SERVICE_URL}/internal/users`, { listUserId })
    const result = res.data.data
    const groupData = await Group.findById(groupId).lean()
    const message = await messageService.createSystemMessage(
      groupId,
      `Added ${result.map((u: any) => u.username).join(', ')} to the group ${groupData?.name}`
    )
    await notificationService.createNotification({
      content: `Added new member to the group ${groupData?.name}`,
      groupId
    })

    // socket
    const io = getIO()
    const listMemberOnline: string[] = []
    const listUser = result
    listUser.map((user: IUser) => {
      const socketId = onlineUsers.get(user._id)
      if (socketId) {
        listMemberOnline.push(user._id)
        io.to(socketId).emit(ENameEvent.ADD_MEMBER, {
          group,
          listUser,
          userId
        })
      }
    })
    io.to(groupId).emit(ENameEvent.ADD_MEMBER, { group, listUser, userId, listMemberOnline })
    io.to(groupId).emit(ENameEvent.RECEIVE_MESSAGE, {
      ...message.toObject(),
      groupId,
      createdAt: new Date()
    })
    const socketIds = Array.from(onlineUsers.values())
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(ENameEvent.NEW_NOTIFICATION, {
        content: `Added new member to the group ${groupData?.name}`,
        groupId
      })
    })

    return {
      result,
      message
    }
  },

  deleteMemberInGroup: async (groupId: string, userId: string, ownerId: string) => {
    const result = await GroupMember.findOneAndDelete({ groupId, userId })
    const res = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${userId}`)
    const user = res.data.data
    let message
    if (user) {
      message = await messageService.createSystemMessage(groupId, `${user.username} was removed from the group`)
      const group = await Group.findById(groupId).lean()
      await notificationService.createNotification({
        content: `Admin was removed ${user.username} from the group ${group?.name}`,
        groupId
      })

      // socket
      const io = getIO()
      io.to(groupId).emit(ENameEvent.KICK_USER, { groupId, userId, ownerId })
      io.to(groupId).emit(ENameEvent.RECEIVE_MESSAGE, {
        ...message.toObject(),
        groupId,
        createdAt: new Date()
      })
      const socketIds = Array.from(onlineUsers.values())
      socketIds.forEach((socketId) => {
        io.to(socketId).emit(ENameEvent.NEW_NOTIFICATION, {
          content: `Admin was removed ${user.username} from the group ${group?.name}`,
          groupId
        })
      })
    }

    return {
      result,
      message
    }
  },

  addTag: async (groupId: string, userId: string, tag: string) => {
    const existingTag = await GroupMember.findOne({ groupId, userId, tag }).lean()
    let groupMember
    if (!existingTag) {
      groupMember = await GroupMember.findOneAndUpdate({ groupId, userId }, { tag }, { new: true })
    } else {
      groupMember = await GroupMember.findOneAndUpdate({ groupId, userId }, { tag: null }, { new: true })
    }
    return groupMember
  },

  findManyGroup: async (userId: string, search?: string) => {
    const groupMemberDocs = await GroupMember.find({ userId }).select('groupId').lean()
    const groupIds = groupMemberDocs.map((doc) => doc.groupId)
    const query: any = {
      $or: [{ ownerId: userId }, { _id: { $in: groupIds } }]
    }

    if (search && search.trim() !== '') {
      query.name = { $regex: `^${search}`, $options: 'i' }
    }

    const listGroup = await Group.find(query).lean()
    return listGroup
  },

  updateThemeGroup: async (groupId: string, theme: string, senderId: string, senderName: string) => {
    const oldGroup = await Group.findById(groupId)
    if (!oldGroup) return false
    const result = await Group.findByIdAndUpdate(groupId, { theme }, { new: true }).lean()
    if (!result) return false

    let message
    if (oldGroup.theme !== theme) {
      message = await messageService.createSystemMessage(groupId, `Group theme changed to '${theme}'`)
      await notificationService.createNotification({
        content: `The theme of the group ${oldGroup.name} has been changed to '${theme}'`,
        groupId: oldGroup._id.toString()
      })

      // socket
      const io = getIO()
      const dataSocket = {
        senderId,
        senderName,
        groupId,
        theme: listTheme.find((t) => t.name === result.theme)
      }
      io.to(groupId).emit(ENameEvent.CHANGE_THEME, dataSocket)
      io.to(groupId).emit(ENameEvent.RECEIVE_MESSAGE, {
        ...message.toObject(),
        groupId,
        createdAt: new Date()
      })
      const socketIds = Array.from(onlineUsers.values())
      socketIds.forEach((socketId) => {
        io.to(socketId).emit(ENameEvent.NEW_NOTIFICATION, {
          content: `Group theme changed to '${theme}'`,
          groupId
        })
      })
    }

    return {
      result,
      message
    }
  },

  deleteGroup: async (groupId: string) => {
    await messageService.deleteAllMessageInGroup(groupId)
    await Promise.all([GroupMember.deleteMany({ groupId }), Notification.deleteMany({ groupId })])
    const groupDeleted = await Group.findByIdAndDelete(groupId)
    return groupDeleted
  }
}
