import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs'
import { filesEndpoint } from '~/utils/file.utils'

const uploadDir = path.join(__dirname, '../../public/upload')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (filesEndpoint.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image, Word or Excel files are allowed!'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { files: 1 }
})
