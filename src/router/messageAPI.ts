import express from 'express'
import { messageController } from '~/controller/message.controller'
import { requireAuth } from '~/middleware/auth.middleware'
import { errorHandler } from '~/middleware/error.middleware'

const router = express.Router()

router.post('/groups/:id/messages', messageController.createMessageByGroup)
router.get('/groups/:id/messages', requireAuth, messageController.getMessagesByGroup)
router.put('/groups/messages/:id', messageController.updateMessage)
router.put('/groups/:id/users/:userId/message/read', messageController.updateIsReadMessage)
router.put('/groups/users/:userId/message/:id', messageController.deleteMessageForMe)
router.delete('/groups/message/:id', messageController.deleteMessageForEveryone)
router.post('/groups/:id/message/:messageId/react', messageController.reactToMessage)
router.get('/users/messages', requireAuth, messageController.getMessageGeneral)

router.use(errorHandler)

export const routerMessage = router
