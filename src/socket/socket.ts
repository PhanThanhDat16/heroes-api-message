import { Server } from 'socket.io'
import http from 'http'

let io: Server
const onlineUsers = new Map<string, string>()
export const setupSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id)

    socket.on('joinGroup', (data) => {
      socket.join(data.groupId)
    })

    socket.on('newGroup', (group) => {
      const members = group.members
      members.forEach((member: any) => {
        const memberId = member
        const memberSocketId = onlineUsers.get(memberId)
        if (memberSocketId) {
          io.to(memberSocketId).emit('newGroup', group)
        }
      })
    })

    socket.on('userOnline', (userId: string) => {
      onlineUsers.set(userId, socket.id)
      io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()))
    })

    socket.on('leaveGroup', (data) => {
      socket.leave(data.groupId)
    })

    socket.on('sendMessage', (data) => {
      const {
        senderId,
        senderName,
        content,
        groupId,
        type,
        replyToMessageId,
        replyToContent,
        replyToSenderName,
        replyToType
      } = data

      io.to(groupId).emit('receiveMessage', {
        content,
        senderId,
        senderName,
        replyToMessageId,
        replyToContent,
        replyToSenderName,
        replyToType,
        type,
        timestamp: new Date()
      })
    })

    socket.on('editGroup', (data) => {
      const { senderId, senderName, name, groupId } = data
      io.to(groupId).emit('editGroup', {
        name,
        groupId,
        senderId,
        senderName,
        timestamp: new Date()
      })
    })

    socket.on('notifications', (data) => {
      const { senderId, senderName, content, groupId } = data
      io.to(groupId).emit('receiveNotification', {
        content,
        groupId,
        senderId,
        senderName,
        timestamp: new Date()
      })
    })

    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId)
          break
        }
      }
      io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()))
      console.log('socket disconnected:', socket.id)
    })
  })
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized')
  }
  return io
}
