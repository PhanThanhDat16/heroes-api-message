import mongoose, { Document, Schema } from 'mongoose'

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, required: true },
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
)

groupSchema.index({ name: 1, ownerId: 1 })

export const Group = mongoose.model('Group', groupSchema)

export interface IGroupModel extends Document {
  name: string
  ownerId: string
}
