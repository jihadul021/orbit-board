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
import { validate } from '../middleware/validate.js'
import { createBoardSchema, addBoardMemberSchema, updateRoleSchema} from '../lib/validationSchemas.js'

const router = express.Router()

router.use(protect)

router.post('/', validate(createBoardSchema), createBoard)
router.get('/group/:groupId', getBoardsByGroup)
router.get('/group/:groupId/closed', getClosedBoards)
router.get('/:id', getBoardById)
router.post('/:id/members', validate(addBoardMemberSchema), addMember)
router.delete('/:id/members/:userId', removeMember)
router.patch('/:id/members/:userId/role', validate(updateRoleSchema), updateMemberRole)
router.patch('/:id/close', closeBoard)
router.patch('/:id/reopen', reopenBoard)

export default router