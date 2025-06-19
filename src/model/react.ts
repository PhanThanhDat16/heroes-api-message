import mongoose, { Document, Schema } from 'mongoose'

const messageMemberSchema = new Schema(
  {
    name: { type: String, required: true }
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

messageMemberSchema.index({ name: 1 })
export const MessageMember = mongoose.model('MessageMember', messageMemberSchema)
export interface IMessageMemberModel extends Document {
  name: string
}
