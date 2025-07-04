import axios from 'axios'
import { GroupMember } from '~/model/grouMember'
import { Group } from '~/model/group'
import { Message } from '~/model/message'
import { IGroup, IGroupCreate, IGroupMember } from '~/types/group'
import { messageService } from './message.service'
import { notificationService } from './notification.service'

export const groupService = {
  createGroup: async ({ name, ownerId, members }: IGroupCreate) => {
    const group = new Group({ name, ownerId })
    await group.save()

    const ownerMember = new GroupMember({
      userId: ownerId,
      groupId: group._id,
      role: 'admin',
      tags: []
    })
    await ownerMember.save()

    const memberDocs = members.map(
      (userId) =>
        new GroupMember({
          userId,
          groupId: group._id,
          role: 'member',
          tags: []
        })
    )

    await Promise.all(memberDocs.map((doc) => doc.save()))
    await notificationService.createNotification({ content: 'You have new group', groupId: group._id.toString() })
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

  getGroupDetail: async (groupId: string) => {
    const group = await Group.findById(groupId).lean()
    return group
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

  updateGroup: async (groupId: string, data: { name: string }) => {
    const oldGroup = await Group.findById(groupId)
    const result = await Group.findByIdAndUpdate(groupId, data, { new: true }).lean()
    if (!result) return false
    let message
    if (oldGroup && oldGroup.name !== data.name) {
      message = await messageService.createSystemMessage(groupId, `Group name changed to '${data.name}'`)
      await notificationService.createNotification({
        content: `Group ${oldGroup.name} changed ${data.name}`,
        groupId: oldGroup._id.toString()
      })
    }
    return {
      result,
      message
    }
  },

  updateLeaveGroup: async (groupId: string, userId: string, newOwnerId?: string | null) => {
    let result
    if (newOwnerId) {
      result = await GroupMember.findByIdAndDelete({ groupId, userId })
      await GroupMember.findByIdAndUpdate({ groupId, userId: newOwnerId }, { role: 'admin' }, { new: true })
    } else {
      result = await GroupMember.findByIdAndDelete({ groupId, userId })
    }
    const res = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${userId}`)
    const user = res.data.data
    let message
    if (user) {
      message = await messageService.createSystemMessage(groupId, `${user.username} has left the group`)
      await notificationService.createNotification({ content: `${user.username} has left the group`, groupId })
    }

    return {
      result,
      message
    }
  },

  addMember: async (groupId: string, data: string[]) => {
    const memberGroup = await Promise.all(
      data.map(async (uId) => {
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
    const group = await Group.findById(groupId).lean()
    const message = await messageService.createSystemMessage(
      groupId,
      `Added ${result.map((u: any) => u.username).join(', ')} to the group ${group?.name}`
    )
    await notificationService.createNotification({
      content: `Added new member to the group`,
      groupId
    })

    return {
      result,
      message
    }
  },

  deleteMemberInGroup: async (groupId: string, userId: string) => {
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
    }
    return {
      result,
      message
    }
  }
}
