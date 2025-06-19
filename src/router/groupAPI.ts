import express from 'express';
import { groupController } from '~/controller/group.controller';
const router = express.Router();

router.post('/groups', groupController.createGroup)
router.get('/groups/:id', groupController.getGroupDetail)
router.get('/groups/users/:id', groupController.getGroupByUserId)
router.get('/groups/:id/users', groupController.getListUserByGroup)
router.put('/groups/:id', groupController.updateGroup)
router.put('/groups/:id/users/:userId', groupController.updateLeaveGroup)
router.put('/groups/:id/users/:userId/roles', groupController.updateRoleGroup)
router.delete('/groups/users/:id', groupController.deleteGroupByUserId)

export const routerGroup = router;