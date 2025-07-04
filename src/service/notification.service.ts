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
        readUsers: false
      })
      await noti.save()
    }
    return true
  },

  getNotification: async (userId: string) => {
    const notification = await Notification.find({ userId }).sort({ createdAt: -1 }).populate('notification').lean()
    return notification
  },

  updateReadNotification: async (userId: string, notiId: string) => {
    const noti = await Notification.findOneAndUpdate({ _id: notiId, userId }, { readUsers: true }, { new: true })
    return noti
  },

  deleteNotification: async (userId: string, notiId: string) => {
    const noti = await Notification.findOneAndDelete({ _id: notiId, userId })
    return noti
  },

  deleteAllNotification: async (userId: string) => {
    await Notification.deleteMany({ userId })
    return true
  }
}
