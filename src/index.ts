import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import connectMongoDB from './config/mongoose.config'
import { setupSocket } from './socket/socket'
import { routerNotification } from './router/notificationAPI'
import { routerGroup } from './router/groupAPI'
import { routerMessage } from './router/messageAPI'
import { routerUpload } from './router/uploadAPI'
import { connectRedis } from './redis/redisOnlineUserService'

dotenv.config()
connectMongoDB()
connectRedis()

const app = express()
const server = http.createServer(app)
app.use(cors())
app.use(morgan('common'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
setupSocket(server)

app.use('/api/notification', routerNotification)
app.use('/api', routerGroup)
app.use('/api', routerUpload)
app.use('/api', routerMessage)

server.listen(process.env.PORT, () => {
  console.log(`Socket server is running on port ${process.env.PORT}`)
})

// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${process.env.PORT}`)
// })
