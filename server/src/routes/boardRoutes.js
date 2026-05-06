import express from 'express'
import {
  createBoard,
  getBoardsByGroup,
  getBoardById,
  addMember,
  removeMember,
  updateMemberRole,
  closeBoard,
  reopenBoard,
  getClosedBoards
} from '../controllers/boardController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.use(protect)

router.post('/', createBoard)
router.get('/group/:groupId', getBoardsByGroup)
router.get('/group/:groupId/closed', getClosedBoards)
router.get('/:id', getBoardById)
router.post('/:id/members', addMember)
router.delete('/:id/members/:userId', removeMember)
router.patch('/:id/members/:userId/role', updateMemberRole)
router.patch('/:id/close', closeBoard)
router.patch('/:id/reopen', reopenBoard)

export default router