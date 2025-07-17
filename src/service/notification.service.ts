/* eslint-disable prefer-const */
import { GroupMember } from '~/model/grouMember'
import { Notification } from '~/model/notification'

export const notificationService = {
  createNotification: async (data: { content: string; groupId: string }) => {
    const userId = await GroupMember.find({ groupId: data.groupId }).select('userId -_id').lean()
    const listUserId = userId.map((u) => u.userId)
    for (let id of listUserId) {
      const noti = new Notification({
        content: data.content,
        userId: id,
        groupId: data.groupId,
        readUsers: false
      })
      await noti.save()
    }
    return true
  },

  getNotification: async (userId: string) => {
    const notification = await Notification.find({ userId }).sort({ createdAt: -1 }).lean()
    return notification
  },

  updateReadNotification: async (userId: string, notiId: string) => {
    const noti = await Notification.findOneAndUpdate({ _id: notiId, userId }, { readUsers: true }, { new: true })
    return noti
  },

  deleteAllNotification: async (userId: string) => {
    await Notification.deleteMany({ userId })
    return true
  },

  readAllNotifications: async (userId: string) => {
    const result = await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } })
    return result
  },

  readNotifications: async (notiId: string, userId: string) => {
    const result = await Notification.findOneAndUpdate(
      { _id: notiId, userId, isRead: false },
      { isRead: true },
      { new: true }
    )
    return result
  }
}
