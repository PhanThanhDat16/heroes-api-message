import { createClient } from 'redis'
export const redisClient = createClient({ url: 'redis://redis:6379' })

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('Redis connected from redisOnlineUserService')
  }
}

const ONLINE_USERS_KEY = 'online_users'
export const setOnlineUser = async (userId: string, socketId: string) => {
  await redisClient.hSet(ONLINE_USERS_KEY, userId, socketId)
}

export const removeOnlineUser = async (socketId: string) => {
  const users = await redisClient.hGetAll(ONLINE_USERS_KEY)
  for (const [userId, sId] of Object.entries(users)) {
    if (sId === socketId) {
      await redisClient.hDel(ONLINE_USERS_KEY, userId)
      break
    }
  }
}

export const getOnlineUserSocketId = async (userId: string) => {
  return await redisClient.hGet(ONLINE_USERS_KEY, userId)
}

export const getAllOnlineUsers = async () => {
  return await redisClient.hKeys(ONLINE_USERS_KEY)
}
