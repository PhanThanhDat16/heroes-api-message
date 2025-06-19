import { GroupMember } from '~/model/grouMember'
import { Notification } from '~/model/notification'
import { INotificationCreate } from '~/types/notification'

export const notificationService = {
  createNotification: async (data: INotificationCreate) => {
    const notification = new Notification({ content: data.content })
    notification.save()
    
    const userId = await GroupMember.find({ groupId: data.groupId }).select('userId -_id').lean()
    const listUserId = userId.map((u) => u.userId)
    for(let id of listUserId) {
      const notiMember = {
        notificationId: notification._id,
        groupId: data.groupId,
        senderId: data.senderId,
        receiveId: id,
        isRead: false
      }
      // await Notification
    }
  }
}
