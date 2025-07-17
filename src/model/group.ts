import mongoose, { Document, Schema } from 'mongoose'
import { ITheme } from '~/types/theme'

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, required: true },
    theme: { type: String, enum: ['cloud', 'family', 'green', 'default'], required: true, default: 'default' }
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
  theme: ITheme
}
