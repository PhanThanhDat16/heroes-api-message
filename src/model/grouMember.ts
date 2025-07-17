import mongoose, { Document, Schema } from 'mongoose'

const groupMember = new Schema(
  {
    userId: { type: String, required: true },
    groupId: { type: mongoose.Schema.ObjectId, required: true, ref: 'Group' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    tag: {
      type: String,
      enum: ['Family', 'Friendly', 'Company', 'Travel', 'Customer', 'Class'],
      default: null
    }
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

groupMember.index({ userId: 1, groupId: 1 })

export const GroupMember = mongoose.model('GroupMember', groupMember)

export interface IGroupMemberModel extends Document {
  userId: string
  groupId: string
  role: 'admin' | 'member'
  tag: string | null
}
