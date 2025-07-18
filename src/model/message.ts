import mongoose, { Document, Schema } from 'mongoose'

const messageSchema = new Schema(
  {
    content: { type: String, required: true },
    senderId: { type: String, required: false },
    senderName: { type: String, required: true },
    groupId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Group' },
    quantityReact: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    // replyToSenderId: { type: String, default: null },
    replyToMessageId: { type: String, default: null },
    replyToContent: { type: String, default: null },
    replyToSenderName: { type: String, default: null },
    replyToType: { type: String, default: null },
    type: { type: String, enum: ['text', 'image', 'excel', 'word', 'system'], default: 'text' },
    deleteForUser: { type: [String], default: [] },
    readUsers: { type: [String], default: [] },
    status: { type: String, enum: ['sent', 'read'], default: 'sent' }
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

messageSchema.index({ senderId: 1, groupId: 1, content: 1 })

export const Message = mongoose.model('Message', messageSchema)
export interface IMessageModel extends Document {
  content: string
  senderId: string
  senderName: string
  groupId: string
  quantityReact: number
  isEdited: boolean
  // replyToSenderId: string | null
  replyToMessageId: string | null
  replyToSenderName: string | null
  replyToContent: string | null
  replyToType: string | null
  type: string
  deleteForUser: string[]
  readUsers: string[]
  status: string
}
