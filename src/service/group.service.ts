import axios from 'axios'
import { GroupMember } from '~/model/grouMember'
import { Group } from '~/model/group'
import { Message } from '~/model/message'
import { IGroup, IGroupCreate } from '~/types/group'

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
    return group
  },

  getGroupByUserId: async (userId: string) => {
    const groupsMember = await GroupMember.find({ userId }).lean().populate('groupId')

    const result = await Promise.all(
      groupsMember.map(async (member) => {
        const group = member.groupId as unknown as IGroup

        const lastMessage = await Message.findOne({
          groupId: group._id
        })
          .sort({ createdAt: -1 })
          .lean()

        let senderName = null
        if (lastMessage !== null) {
          const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${lastMessage?.senderId}`)
          senderName = response.data?.data?.username || null
        }


        return {
          ...group,
          isRead: lastMessage?.isRead ?? [],
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                senderName: senderName,
                createdAt: lastMessage.createdAt
              }
            : 'New Group'
        }
      })
    )

    return result.reverse()
    // return result.sort((a, b) => {
    //   const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
    //   const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
    //   return bTime - aTime
    // })
  },

  getGroupDetail: async (groupId: string) => {
    const group = await Group.findById(groupId).lean()
    return group
  },

  findManyUserByGroup: async (groupId: string, search?: string | undefined) => {
    let users
    const userId = await GroupMember.find({ groupId: groupId }).select('userId -_id').lean()
    const listUserId = userId.map((u) => u.userId)

    if (search === undefined || search === null || search.trim() === '') {
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

  updateGroup: async (groupId: string, data: { name: string }) => {
    const group = await Group.findByIdAndUpdate(groupId, data, { new: true }).lean()
    if (!group) return false
    return group
  },

  updateLeaveGroup: async (groupId: string, userId: string, ownerId: string) => {
    const group = await Group.findByIdAndUpdate(groupId, { ownerId: userId }, { new: true })
    if (!group) return false
    await GroupMember.findByIdAndDelete({ groupId, userId: ownerId })
    await GroupMember.findByIdAndUpdate({ groupId, userId: ownerId }, { role: 'admin' }, { new: true })
    return group
  },

  updateRoleGroup: async (groupId: string, userId: string) => {
    const groupMember = await GroupMember.findByIdAndUpdate({ groupId, userId }, { role: 'admin' }, { new: true })
    return groupMember
  },

  addMember: async (groupId: string, userId: string) => {
    const member = new GroupMember({
      userId,
      groupId,
      role: 'member',
      tags: []
    })
    await member.save()
    return member
  },

  deleteMemberInGroup: async (groupId: string, userId: string) => {
    const existingMemberInGroup = GroupMember.findByIdAndDelete({groupId ,userId })
    if(!existingMemberInGroup) {
      return false
    }
    return existingMemberInGroup
  }
}
