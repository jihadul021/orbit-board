import express from 'express'
import {
  pickArticle,
  updateCopyStatus,
  returnArticle,
  getEditorBoards
} from '../controllers/reviewController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.use(protect)

router.post('/pick', pickArticle)
router.patch('/copy/:id/status', updateCopyStatus)
router.delete('/copy/:id', returnArticle)
router.get('/boards', getEditorBoards)

export default router