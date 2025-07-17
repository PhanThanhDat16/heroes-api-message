import express from 'express'
import { groupController } from '~/controller/group.controller'
import { requireAuth } from '~/middleware/auth.middleware'
import { errorHandler } from '~/middleware/error.middleware'
const router = express.Router()

router.post('/groups', requireAuth, groupController.createGroup)
router.get('/groups/:id', requireAuth, groupController.getGroupDetail)
router.get('/group/:id', requireAuth, groupController.verifyGroupDetail)
router.get('/group/user/:id', requireAuth, groupController.getGroupByUserId)
router.get('/groups/:id/users', requireAuth, groupController.getListUserByGroup)
router.put('/groups/:id', requireAuth, groupController.updateGroup)
router.put('/groups/:id/users/:userId/roles', requireAuth, groupController.updateRoleGroup)
router.put('/groups/:id/users', requireAuth, groupController.addMemberGroup)
router.delete('/groups/:id/members/:memberId', requireAuth, groupController.deleteMemberInGroup)
router.delete('/groups/:id/users/:userId', requireAuth, groupController.updateLeaveGroup)
router.put('/groups/:id/user/:userId/tag', requireAuth, groupController.addTagForGroup)
router.get('/user/groups', requireAuth, groupController.getManyGroupByUser)
router.put('/group/:id/theme', requireAuth, groupController.updateThemeGroup)
router.delete('/group/:id', requireAuth, groupController.deleteGroup)

router.use(errorHandler)

export const routerGroup = router
