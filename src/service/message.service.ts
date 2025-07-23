import { IMessageCreate } from '~/types/messages'
import { Message } from '~/model/message'
import mongoose from 'mongoose'
import { MessageReact } from '~/model/messageReact'
import { getIO } from '~/socket/socket'
import { GroupMember } from '~/model/grouMember'
import { Types } from 'mongoose'
import { ENameEvent } from '~/types/nameEventSocket'
import axios from 'axios'

export const messageService = {
  createMessageByGroup: async ({
    content,
    senderId,
    groupId,
    senderName,
    replyToMessageId,
    type = 'text',
    readUsers
  }: IMessageCreate) => {
    let message
    // eslint-disable-next-line prefer-const
    message = new Message({
      content,
      senderId,
      groupId,
      senderName,
      isEdited: false,
      replyToMessageId: replyToMessageId || null,
      type,
      readUsers,
      deleteForUser: []
    })
    await message.save()
    await message.populate({
      path: 'replyToMessageId',
      select: 'content senderName type'
    })

    const io = getIO()
    io.to(groupId).emit(ENameEvent.RECEIVE_MESSAGE, {
      ...message.toObject(),
      groupId,
      createdAt: new Date()
    })
    return message
  },

  createSystemMessage: async (groupId: string, content: string) => {
    const message = new Message({
      content,
      groupId,
      senderId: null,
      senderName: 'System',
      type: 'system',
      quantityReact: 0,
      isEdited: false,
      replyToMessageId: null,
      deleteForUsers: [],
      readUsers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await message.save()
    return message
  },

  getMessagesByGroup: async (groupId: string, page = 1, limit = 20, search = '', userId: string) => {
    const skip = (page - 1) * limit
    const baseFilter: any = {
      groupId,
      deleteForUser: { $nin: [userId] },
      type: { $ne: 'delete' }
    }

    function escapeRegex(str: string) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    const escapedSearch = escapeRegex(search.trim())
    const listFilter: any = !search.trim()
      ? baseFilter
      : {
          ...baseFilter,
          type: { $nin: ['system', 'delete'] },
          content: { $regex: `^${escapedSearch}`, $options: 'i' }
        }

    const msgs = await Message.find(listFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    if (!msgs.length) {
      return {
        senderId: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        mediaImageCount: 0,
        mediaFileCount: 0
      }
    }

    const replyMessageIds = msgs
      .filter((m) => m.replyToMessageId)
      .map((m) => new mongoose.Types.ObjectId(m.replyToMessageId))
    const replyMessages = await Message.find({ _id: { $in: replyMessageIds } }, '_id content senderName type').lean()
    const replyMessagesMap: Record<string, { _id: string; content: string; senderName: string | null; type: string }> =
      {}

    replyMessages.forEach((rm) => {
      const isDeleted = rm.type === 'delete'
      replyMessagesMap[rm._id.toString()] = {
        _id: rm._id.toString(),
        content: isDeleted ? 'Deleted' : rm.content,
        senderName: isDeleted ? null : rm.senderName,
        type: isDeleted ? 'delete' : rm.type
      }
    })

    const messageIds = msgs.map((m) => m._id)
    const reactionsRaw = await MessageReact.aggregate([
      { $match: { messageId: { $in: messageIds } } },
      {
        $group: {
          _id: { messageId: '$messageId', type: '$type' },
          count: { $sum: 1 },
          users: { $push: '$userId' }
        }
      }
    ])
    const reactionsMap: Record<string, Record<string, { count: number; users: string[] }>> = {}
    reactionsRaw.forEach((r) => {
      const { messageId, type } = r._id
      const key = messageId.toString()
      reactionsMap[key] ??= {}
      reactionsMap[key][type] = { count: r.count, users: r.users }
    })

    const uniqueSenderIds = [...new Set(msgs.map((m) => m.senderId).filter(Boolean))]
    const userMap: Record<string, string> = {}
    await Promise.all(
      uniqueSenderIds.map(async (senderId) => {
        const res = await axios.get(`${process.env.AUTH_SERVICE_URL}/internal/users/${senderId}`)
        const user = res.data?.data
        userMap[senderId as string] = user?.username || 'Unknown'
      })
    )
    const messagesWithExtras = msgs
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => {
        const replyObject = m.replyToMessageId ? replyMessagesMap[m.replyToMessageId.toString()] || null : null
        return {
          ...m,
          senderName: userMap[m.senderId as string] || 'System',
          reactions: reactionsMap[m._id.toString()] || {},
          replyToMessageId: replyObject
        }
      })

    const userOnlyFilter = { ...baseFilter, type: { $nin: ['system', 'delete'] } }
    const [imageCount, fileCount, totalVisible] = await Promise.all([
      Message.countDocuments({ ...baseFilter, type: 'image' }),
      Message.countDocuments({
        ...baseFilter,
        type: { $in: ['excel', 'word'] }
      }),
      Message.countDocuments(userOnlyFilter)
    ])

    return {
      senderId: messagesWithExtras,
      page,
      limit,
      totalPages: Math.ceil(totalVisible / limit),
      mediaImageCount: imageCount,
      mediaFileCount: fileCount
    }
  },

  updateMessageByGroup: async (messageId: string, data: { content: string }) => {
    const message = await Message.findByIdAndUpdate(messageId, { ...data, isEdited: true }, { new: true }).populate(
      'replyToMessageId'
    )

    // socket
    const io = getIO()
    const groupId = message?.groupId?.toString()
    if (groupId) {
      io.to(groupId).emit(ENameEvent.EDIT_MESSAGE, {
        ...message?.toObject(),
        groupId
      })
    }
    return message
  },

  updateIsReadMessage: async (userId: string, groupId: string) => {
    const message = await Message.findOne({ groupId: new mongoose.Types.ObjectId(groupId) })
      .sort({ createdAt: -1 })
      .populate({ path: 'replyToMessageId', select: 'content senderName type' })
      .lean()
    const messages = await Message.find({ groupId: new mongoose.Types.ObjectId(groupId) }).lean()

    if (!message) return null
    const resultMessage = messages.filter((m) => m.readUsers.length <= 1)
    await resultMessage.map(async (m) => await Message.updateMany({ _id: m._id }, { $addToSet: { readUsers: userId } }))
    return message
  },

  deleteMessageForEveryone: async (messageId: string) => {
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          content: 'Deleted',
          senderName: null,
          type: 'delete'
        }
      },
      { new: true }
    )
    // await Message.updateMany(
    //   { replyToMessageId: messageId },
    //   {
    //     $set: {
    //       replyToContent: 'Deleted',
    //       replyToType: 'delete',
    //       replyToSenderName: null
    //     }
    //   }
    // )

    // socket
    const io = getIO()
    const groupId = message?.groupId?.toString()
    if (groupId) {
      io.to(groupId).emit(ENameEvent.DELETE_MESSAGE, {
        groupId,
        ...message?.toObject()
      })
    }
    return message
  },

  deleteMessageForMe: async (userId: string, messageId: string) => {
    const message = await Message.findById(messageId)
    if (!message?.deleteForUser.includes(userId)) {
      message?.deleteForUser.push(userId)
    }
    await message?.save()

    // socket
    const io = getIO()
    const groupId = message?.groupId?.toString()
    if (groupId) {
      io.to(groupId).emit(ENameEvent.DELETE_MESSAGE_ME, {
        groupId,
        ...message?.toObject()
      })
    }
    return message
  },

  reactToMessage: async (userId: string, messageId: string, type: string, groupId: string) => {
    const existingReact = await MessageReact.findOne({ userId, messageId, type }).lean()
    if (!existingReact) {
      await MessageReact.create({ userId, messageId, type })
      await Message.findByIdAndUpdate(messageId, { $inc: { quantityReact: 1 } })
    } else {
      await MessageReact.deleteOne({ _id: existingReact._id })
      await Message.findByIdAndUpdate(messageId, { $inc: { quantityReact: -1 } })
    }

    const reactionsRaw = await MessageReact.aggregate([
      { $match: { messageId: new mongoose.Types.ObjectId(messageId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          users: { $push: '$userId' }
        }
      }
    ])

    const reactions: Record<string, { count: number; users: string[] }> = {}
    for (const item of reactionsRaw) {
      reactions[item._id] = {
        count: item.count,
        users: item.users
      }
    }

    const message = await Message.findById(messageId).lean()

    const io = getIO()
    io.to(groupId).emit(ENameEvent.REACT_MESSAGE, {
      reactions,
      messageId,
      userId,
      quantityReact: message?.quantityReact
    })

    return {
      reactions,
      messageId,
      quantityReact: message?.quantityReact ?? 0
    }
  },

  findManyMessageByUser: async (userId: string, search?: string) => {
    const groupMemberDocs = await GroupMember.find({ userId }).select('groupId').lean()
    const groupIds = groupMemberDocs.map((doc) => new Types.ObjectId(doc.groupId))

    const nonSystemQuery: any = {
      groupId: { $in: groupIds },
      type: { $ne: 'system' }
    }

    function escapeRegex(str: string) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    if (search && search.trim() !== '') {
      const escapedSearch = escapeRegex(search.trim())
      nonSystemQuery.content = { $regex: `^${escapedSearch}`, $options: 'i' }
    }

    const nonSystemMessages = await Message.find(nonSystemQuery)
      .populate({ path: 'groupId', select: '_id name' })
      .sort({ createdAt: -1 })
      .lean()

    return {
      senderId: nonSystemMessages
    }
  },

  deleteAllMessageInGroup: async (groupId: string) => {
    const docs = await Message.find({ groupId }).select('_id').lean()
    const messageIds = docs.map((d) => d._id)
    if (messageIds.length) {
      await MessageReact.deleteMany({ messageId: { $in: messageIds } })
    }
    await Message.deleteMany({ groupId })
    return true
  }
}
