import mongoose, { Document, Schema } from 'mongoose'

const messageReactSchema = new Schema(
  {
    userId: { type: String, required: true },
    messageId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Message' },
    reactId: { type: mongoose.Schema.ObjectId, required: true, ref: 'React' },
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

messageReactSchema.index({ userId: 1, messageId: 1, reactId: 1 })

export const MessageReact = mongoose.model('MessageReact', messageReactSchema)
export interface IMessageReactModel extends Document {
  userId: string
  messageId: string
  reactId: string
}