export interface IMessageCreate {
  groupId: string
  senderId: string
  senderName: string
  content: string
  replyToMessageId: string | null
  replyToContent: string | null
  replyToSenderName: string | null
  replyToType: string | null
  type: string
}
