import mongoose, {Document, Schema} from "mongoose";

const messageMemberSchema = new Schema(
  {
    notificationId: { type: mongoose.Schema.ObjectId, ref: 'Notification', required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    groupId: { type: mongoose.Schema.ObjectId, ref: 'Group', required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    strict: true,
    timestamps: true
  }
);

messageMemberSchema.index({ userId: 1, messageId: 1 });

export const NotificationMember = mongoose.model('NotificationMember', messageMemberSchema);
export interface IMessageMemberModel extends Document {
    notificationId: string;
    senderId: string;
    receiverId: string;
    groupId: string;
    isRead: boolean;
}