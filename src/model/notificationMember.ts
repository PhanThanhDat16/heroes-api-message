import mongoose, { Document, Schema } from 'mongoose'

const notificationMemberSchema = new Schema(
  {
    notificationId: { type: mongoose.Schema.ObjectId, ref: 'Notification', required: true },
    userId: { type: String, required: true },
    senderId: { type: String, required: true },
    groupId: { type: mongoose.Schema.ObjectId, ref: 'Group', required: true },
    isRead: { type: Boolean, default: false }
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

notificationMemberSchema.index({ userId: 1, notificationId: 1 })

export const NotificationMember = mongoose.model('NotificationMember', notificationMemberSchema)
export interface INotificationMemberModel extends Document {
  notificationId: string
  senderId: string
  userId: string
  groupId: string
  isRead: boolean
}
