import { Server } from 'socket.io'
import http from 'http'
import { IUser } from '~/types/user'

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

    socket.on('userOnline', (data) => {
      const { userId } = data
      onlineUsers.set(userId, socket.id)
      io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()))
    })

    socket.on('leaveGroup', (data) => {
      socket.leave(data.groupId)
    })

    socket.on('kickUserFromGroup', ({ userId, groupId, ownerId }) => {
      io.to(groupId).emit('kickUserFromGroup', { groupId, userId, ownerId })
    })

    socket.on('addMemberFromGroup', ({ listUser, group, userId }) => {
      const groupId = group._id
      listUser.map((user: IUser) => {
        const socketId = onlineUsers.get(user._id)
        if (socketId) {
          io.to(socketId).emit('addMemberFromGroup', {
            group,
            listUser,
            userId
          })
        }
      })
      io.to(groupId).emit('addMemberFromGroup', { group, listUser, userId })
    })

    socket.on('sendMessage', (data) => {
      const { groupId } = data
      io.to(groupId).emit('receiveMessage', {
        ...data,
        groupId,
        createdAt: new Date()
      })
    })

    socket.on('deleteMessage', (data) => {
      const { groupId } = data
      io.to(groupId).emit('deleteMessage', {
        groupId,
        ...data
      })
    })

    socket.on('deleteMessageForMe', (data) => {
      const { groupId } = data
      io.to(groupId).emit('deleteMessageForMe', {
        groupId,
        ...data
      })
    })

    socket.on('editMessage', (data) => {
      const { groupId } = data
      io.to(groupId).emit('editMessage', {
        ...data,
        groupId
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
        console.log(socket.id)
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
