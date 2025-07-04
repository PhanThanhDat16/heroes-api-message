import express from 'express'
import { uploadController } from '~/controller/upload.controller'
import { errorHandler } from '~/middleware/error.middleware'
import { upload } from '~/middleware/upload.middleware'

const router = express.Router()

router.post('/upload', upload.single('content') ,uploadController.uploadImages)

router.use(errorHandler)

export const routerUpload = router
