import { GroupMember } from '~/model/grouMember'
import { Notification } from '~/model/notification'
import { NotificationMember } from '~/model/notificationMember'
import { INotificationCreate } from '~/types/notification'

export const notificationService = {
  createNotification: async (data: INotificationCreate) => {
    const notification = new Notification({ content: data.content })
    notification.save()

    const userId = await GroupMember.find({ groupId: data.groupId }).select('userId -_id').lean()
    const listUserId = userId.map((u) => u.userId)
    for (let id of listUserId) {
      const notiMember = new NotificationMember({
        notificationId: notification._id,
        groupId: data.groupId,
        senderId: data.senderId,
        receiveId: id,
        isRead: false
      })
      await notiMember.save()
    }

    return notification
  },

  getNotification: async (userId: string) => {
    const notification = await NotificationMember.findById({ userId }).lean().populate('notification')
    return notification
  },

  updateReadNotification: async (userId: string, notiId: string) => {
    const noti = await NotificationMember.findByIdAndUpdate(
      { notificationId: notiId, userId },
      { isRead: true },
      { new: true }
    )
    return noti
  },

  deleteNotification: async (userId: string, notiId: string) => {
    // await NotificationMember.findByIdAndDelete({ notificationId: notiId, userId })
  }
}
