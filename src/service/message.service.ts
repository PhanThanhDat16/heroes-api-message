import { Message } from '~/model/message'
import { MessageMember } from '~/model/messageMember'
import { IMessageCreate } from '~/types/messages'
import { GroupMember } from '~/model/grouMember'

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
    type = 'text'
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
        type
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
        type
      })
      await message.save()
    }

    const users = await GroupMember.find({ groupId: groupId }).select('userId -_id').lean()
    const listUserId = users.map((u) => u.userId)

    for (let u of listUserId) {
      const data = {
        groupId: groupId,
        userId: u,
        isRead: false,
        messageId: message._id,
        isDeleteForMe: false
      }
      const messageMember = new MessageMember(data)
      await messageMember.save()
    }

    return message
  },

  getMessagesByGroup: async (groupId: string, page = 1, limit = 10, quantityMembers: number) => {
    const skip = (page - 1) * limit
    const senderId = await Message.find({ groupId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    const totalMessages = await MessageMember.countDocuments({ groupId })
    return {
      senderId: senderId.reverse(),
      total: Math.floor(totalMessages / quantityMembers),
      page,
      limit,
      totalPages: Math.ceil(Math.floor(totalMessages / quantityMembers) / limit)
    }
  },

  updateMessageByGroup: async ( messageId: string, data: { content: string }) => {
    const message = await Message.findByIdAndUpdate(messageId, { ...data, isEdited: true }, { new: true })
    return message
  },

  deleteMessageForEveryone: async ( messageId: string ) => {
    await MessageMember.findByIdAndDelete({ messageId })
    const message = await Message.findByIdAndDelete(messageId)
    return message
  }
}
