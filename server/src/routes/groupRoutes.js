import express from 'express'
import {
  createGroup,
  getMyGroups,
  getGroupById,
  inviteMember,
  removeMember,
  leaveGroup
} from '../controllers/groupController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.use(protect)

router.post('/', createGroup)
router.get('/', getMyGroups)
router.get('/:id', getGroupById)
router.post('/:id/invite', inviteMember)
router.delete('/:id/remove/:userId', removeMember)
router.delete('/:id/leave', leaveGroup)

export default router