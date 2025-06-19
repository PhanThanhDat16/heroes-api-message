import mongoose, { Document, Schema } from 'mongoose'

const messageMemberSchema = new Schema(
  {
    groupId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Group' },
    userId: { type: String, required: true },
    messageId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Message' },
    isRead: { type: Boolean, default: false },
    isDeleteForMe: { type: Boolean, default: false }
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

messageMemberSchema.index({ userId: 1, messageId: 1 })

export const MessageMember = mongoose.model('MessageMember', messageMemberSchema)
export interface IMessageMemberModel extends Document {
  userId: string
  messageId: string
  isRead: boolean
  isDeleteForMe: boolean
}
