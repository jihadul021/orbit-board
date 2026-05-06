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
import { validate } from '../middleware/validate.js'
import { createArticleSchema, updateArticleSchema, updateArticleStatusSchema, moveArticleSchema } from '../lib/validationSchemas.js'

const router = express.Router()

router.use(protect)

router.post('/', validate(createArticleSchema), createArticle)
router.get('/list/:listId', getArticlesByList)
router.get('/:id', getArticleById)
router.patch('/:id', validate(updateArticleSchema), updateArticle)
router.patch('/:id/status', validate(updateArticleStatusSchema), updateArticleStatus)
router.patch('/:id/move', validate(moveArticleSchema), moveArticle)
router.delete('/:id', deleteArticle)

export default router