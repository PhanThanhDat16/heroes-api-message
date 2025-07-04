import mongoose, { Document, Schema } from 'mongoose'

const notificationSchema = new Schema(
  {
    content: { type: String, required: true },
    userId: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

notificationSchema.index({ userId: 1 })


export const Notification = mongoose.model('Notification', notificationSchema)

export interface INotificationModel extends Document {
  content: string
  userId: string
  isRead: boolean
}
