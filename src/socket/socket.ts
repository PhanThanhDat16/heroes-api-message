// import { Server } from 'socket.io'
// import http from 'http'
// import { ENameEvent } from '~/types/nameEventSocket'
// let io: Server
// export const onlineUsers = new Map<string, string>()
// export const setupSocket = async (server: http.Server) => {
//   io = new Server(server, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST']
//     }
//   })
//   io.on('connection', (socket) => {
//     console.log('socket connected:', socket.id)
//     socket.on(ENameEvent.JOIN_GROUP, (data) => {
//       socket.join(data.groupId)
//     })
//     socket.on(ENameEvent.USER_ONLINE, (data) => {
//       const { userId } = data
//       onlineUsers.set(userId, socket.id)
//       io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()))
//     })
//     socket.on(ENameEvent.LEAVE_GROUP, (data) => {
//       socket.leave(data.groupId)
//     })
//     socket.on(ENameEvent.DISCONNECT, () => {
//       for (const [userId, socketId] of onlineUsers.entries()) {
//         if (socketId === socket.id) {
//           onlineUsers.delete(userId)
//           break
//         }
//       }
//       io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()))
//       console.log('socket disconnected:', socket.id)
//     })
//   })
// }
// export const getIO = (): Server => {
//   if (!io) {
//     throw new Error('Socket.io has not been initialized')
//   }
//   return io
// }

import http from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { ENameEvent } from '~/types/nameEventSocket'
import { getAllOnlineUsers, removeOnlineUser, setOnlineUser } from '~/redis/redisOnlineUserService'

let io: Server
export const setupSocket = async (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  const pubClient = createClient({ url: process.env.REDIS_URL })
  const subClient = pubClient.duplicate()
  await pubClient.connect()
  await subClient.connect()
  io.adapter(createAdapter(pubClient, subClient))

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id)

    socket.on(ENameEvent.JOIN_GROUP, (data) => {
      socket.join(data.groupId)
    })

    socket.on(ENameEvent.USER_ONLINE, async (data) => {
      const { userId } = data
      await setOnlineUser(userId, socket.id)
      const onlineUserIds = await getAllOnlineUsers()
      io.emit(ENameEvent.UPDATE_ONLINE_USER, onlineUserIds)
    })

    socket.on(ENameEvent.LEAVE_GROUP, (data) => {
      socket.leave(data.groupId)
    })

    socket.on('disconnect', async () => {
      await removeOnlineUser(socket.id)
      const onlineUserIds = await getAllOnlineUsers()
      io.emit(ENameEvent.UPDATE_ONLINE_USER, onlineUserIds)
      console.log('socket disconnected:', socket.id)
    })
  })
}

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io has not been initialized')
  return io
}
