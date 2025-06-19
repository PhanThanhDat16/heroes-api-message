import mongoose, { Document, Schema } from 'mongoose'

const messageSchema = new Schema(
  {
    content: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    groupId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Group' },
    quantityReact: { type: Number, default: 0 },
    isEdited: { type: Boolean , default: false },
    replyToMessageId:  { type: String, default: null },
    replyToContent:  { type: String, default: null },
    replyToSenderName:  { type: String, default: null },
    replyToType:  { type: String, default: null },
    type: {type: String,  enum:['text', 'image', 'excel', 'word'] ,default: 'text'}

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
  replyToMessageId: string | null
  replyToContent: string | null
  replyToSenderName: string | null
  replyToType: string | null,
  type: string
}
