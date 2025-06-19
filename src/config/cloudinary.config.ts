import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config()

// Config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME?.toString(),
  api_key: process.env.CLOUD_API_KEY?.toString(),
  api_secret: process.env.CLOUD_API_SECRET?.toString()
})

export default cloudinary