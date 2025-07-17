import { Request, Response } from 'express'
import fs from 'fs'
import cloudinary from '~/config/cloudinary.config'
import { EHttpStatus } from '~/types/httpStatus'
import { filesEndpoint } from '~/utils/file.utils'
import asyncHandler from 'express-async-handler'

export const uploadController = {
  uploadImages: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File
    if (!file) {
      res.status(EHttpStatus.BAD_REQUEST).json({ message: 'No file uploaded' })
      return
    }
    const allowedFormat = filesEndpoint
    const maxSize = 1024 * 1024
    if (!allowedFormat.includes(file.mimetype)) {
      res.status(EHttpStatus.BAD_REQUEST).json({
        message: 'Invalid file format'
      })
      return
    }
    if (file.size > maxSize) {
      res.status(EHttpStatus.BAD_REQUEST).json({
        message: 'The file size is too large. Please select a file smaller than 1MB'
      })
      return
    }
    const isImage = file.mimetype.startsWith('image/')
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'clothes-item',
      resource_type: isImage ? 'image' : 'raw'
    })
    fs.unlinkSync(file.path)
    res.status(EHttpStatus.OK).json({
      message: 'Uploaded successfully',
      data: {
        url: result.secure_url,
        originalname: file.originalname,
        mimetype: file.mimetype
      }
    })
  })
}
