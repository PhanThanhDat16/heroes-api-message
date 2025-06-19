import mongoose, { Document, Schema } from 'mongoose'

const notificationSchema = new Schema(
  {
    content: { type: String, required: true },
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

export const Notification = mongoose.model('Notification', notificationSchema)

export interface INotificationModel extends Document {
  content: string
}
