import express from 'express';
import { messageController } from '~/controller/message.controller';

const router = express.Router();

router.post('/groups/:id/messages', messageController.createMessageByGroup)
router.get("/groups/:id/messages", messageController.getMessagesByGroup)
router.put("/groups/messages/:id", messageController.updateMessage)
router.put("/groups/:id/users/:userId/message/read",messageController.updateIsReadMessage)
router.put("/groups/users/:userId/message/:id", messageController.deleteMessageForMe)
router.delete("/groups/message/:id", messageController.deleteMessageForEveryone)

// router.get("/groups/messages/users/:id", messageController.getGeneral)

export const routerMessage = router;