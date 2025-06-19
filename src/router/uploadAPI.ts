import express from 'express'
import { uploadController } from '~/controller/upload.controller'
import { upload } from '~/middleware/upload.middleware'

const route = express.Router()

route.post('/upload', upload.single('content') ,uploadController.uploadImages)

export const routerUpload = route