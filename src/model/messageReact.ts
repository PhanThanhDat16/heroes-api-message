import mongoose, { Document, Schema } from 'mongoose'

const messageReactSchema = new Schema(
  {
    userId: { type: String, required: true },
    messageId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Message' },
    type: { type: String, enum: ['heart', 'kiss-heart', 'laugh', 'cry', 'smile'], default: null }
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

messageReactSchema.index({ userId: 1, messageId: 1 })

export const MessageReact = mongoose.model('MessageReact', messageReactSchema)
export interface IMessageReactModel extends Document {
  userId: string
  messageId: string
  type: string | null
}