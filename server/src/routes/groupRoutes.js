import express from 'express'
import {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  inviteMember,
  removeMember,
  leaveGroup
} from '../controllers/groupController.js'
import { protect } from '../middleware/protect.js'
import { validate } from '../middleware/validate.js'
import { createGroupSchema, inviteMemberSchema, updateGroupSchema } from '../lib/validationSchemas.js'


const router = express.Router()
 
router.use(protect)
router.post('/', validate(createGroupSchema), createGroup)
router.get('/', getMyGroups)
router.get('/:id', getGroupById)
router.patch('/:id', validate(updateGroupSchema), updateGroup)
router.post('/:id/invite', validate(inviteMemberSchema), inviteMember)
router.delete('/:id/remove/:userId', removeMember)
router.delete('/:id/leave', leaveGroup)
 
export default router 
