import { Server } from 'socket.io'
import http from 'http'
import { ENameEvent } from '~/types/nameEventSocket'

let io: Server
export const onlineUsers = new Map<string, string>()

export const setupSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id)

    socket.on(ENameEvent.JOIN_GROUP, (data) => {
      socket.join(data.groupId)
    })

    socket.on(ENameEvent.USER_ONLINE, (data) => {
      const { userId } = data
      onlineUsers.set(userId, socket.id)
      io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()))
    })

    socket.on(ENameEvent.LEAVE_GROUP, (data) => {
      socket.leave(data.groupId)
    })

    socket.on(ENameEvent.DISCONNECT, () => {
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
