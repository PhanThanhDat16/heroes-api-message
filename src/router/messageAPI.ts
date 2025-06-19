import express from 'express';
import { messageController } from '~/controller/message.controller';

const router = express.Router();

router.post('/groups/:id/messages', messageController.createMessageByGroup)
router.get("/groups/:id/messages", messageController.getMessagesByGroup)
router.put("/groups/messages/:id", messageController.updateMessage)
router.delete("/groups/message/:id", messageController.deleteMessageForEveryone)
// router.delete("/groups/:id/users/:userId/message/:messageId", messageController.deleteMessageForMe)

export const routerMessage = router;