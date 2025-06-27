import { MessageMember } from '~/model/messageMember'
import { IMessageCreate } from '~/types/messages'
import { GroupMember } from '~/model/grouMember'
import { Message } from '~/model/message'
import mongoose from 'mongoose'

export const messageService = {
  createMessageByGroup: async ({
    content,
    senderId,
    groupId,
    senderName,
    replyToMessageId,
    replyToContent,
    replyToSenderName,
    replyToType,
    type = 'text',
    isRead
  }: IMessageCreate) => {
    let message
    if (!replyToMessageId) {
      message = new Message({
        content,
        senderId,
        groupId,
        senderName,
        isEdited: false,
        replyToMessageId: null,
        replyToContent: null,
        replyToSenderName: null,
        replyToType: null,
        type,
        isRead,
        deleteForUser: []
      })
      await message.save()
    } else {
      message = new Message({
        content,
        senderId,
        groupId,
        senderName,
        isEdited: false,
        replyToMessageId,
        replyToContent,
        replyToSenderName,
        replyToType,
        type,
        isRead,
        deleteForUser: []
      })
      await message.save()
    }

    // const users = await GroupMember.find({ groupId: groupId }).select('userId -_id').lean()
    // const listUserId = users.map((u) => u.userId)

    // for (let u of listUserId) {
    //   const data = {
    //     groupId: groupId,
    //     userId: u,
    //     isRead: false,
    //     messageId: message._id,
    //     isDeleteForMe: false
    //   }
    //   const messageMember = new MessageMember(data)
    //   await messageMember.save()
    // }

    return message
  },

  getMessageDetail: async (messageId: string) => {
    const message = await Message.findById(messageId).lean()
    return message
  },

  getMessagesByGroup: async (groupId: string, page = 1, limit = 10, quantityMembers: number, search = '') => {
    const skip = (page - 1) * limit
    let senderId

    if (search === undefined || search === null || search.trim() === '') {
      senderId = await Message.find({ groupId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    } else {
      senderId = await Message.find({ groupId, content: { $regex: `^${search}`, $options: 'i' }, type: 'text' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    }
    const totalMessages = await Message.countDocuments({ groupId })
    // let dataResult: any[] = []
    // for (let m of senderId) {
    //   if (m.replyToMessageId) {
    //     const result = await messageService.getMessageDetail(m.replyToMessageId)
    //     if (result === null) {
    //       dataResult = [...dataResult, { ...m, replyToContent: 'Deleted', replyToType: 'delete' }]
    //     } else {
    //       dataResult = [...dataResult, m]
    //     }
    //   } else {
    //     dataResult = [...dataResult, m]
    //   }
    // }
    // console.log('🚀 message.service.ts:97 - dataResult:', dataResult.length)
    // console.log('🚀 message.service.ts:98 - dataResult:', dataResult)
    return {
      senderId: senderId.reverse(),
      total: Math.floor(totalMessages / quantityMembers),
      page,
      limit,
      totalPages: Math.ceil(Math.floor(totalMessages / quantityMembers) / limit)
    }
  },

  updateMessageByGroup: async (messageId: string, data: { content: string }) => {
    const message = await Message.findByIdAndUpdate(messageId, { ...data, isEdited: true }, { new: true })
    return message
  },

  updateIsReadMessage: async (userId: string, groupId: string) => {
    console.log('userId', userId)
    console.log('groupId', groupId)
    const message = await Message.findOne({ groupId: new mongoose.Types.ObjectId(groupId) }).sort({ createdAt: -1 })
    if (!message?.isRead.includes(userId)) {
      message?.isRead.push(userId)
    }
    await message?.save()
    return message
  },

  deleteMessageForEveryone: async (messageId: string) => {
    // await MessageMember.findByIdAndDelete(messageId)
    const message = await Message.findByIdAndDelete(messageId)
    return message
  },

  deleteMessageForMe: async (userId: string, messageId: string) => {
    const message = await Message.findById(messageId)
    if (!message?.deleteForUser.includes(userId)) {
      message?.deleteForUser.push(userId)
    }
    await message?.save()
    return message
  }
}
