import express from 'express'
import {
  createArticle,
  getArticlesByList,
  getArticleById,
  updateArticle,
  updateArticleStatus,
  moveArticle,
  deleteArticle
} from '../controllers/articleController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.use(protect)

router.post('/', createArticle)
router.get('/list/:listId', getArticlesByList)
router.get('/:id', getArticleById)
router.patch('/:id', updateArticle)
router.patch('/:id/status', updateArticleStatus)
router.patch('/:id/move', moveArticle)
router.delete('/:id', deleteArticle)

export default router