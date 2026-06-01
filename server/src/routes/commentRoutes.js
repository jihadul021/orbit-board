import express from 'express'
import {
  addComment,
  getComments,
  editComment,
  deleteComment
} from '../controllers/commentController.js'
import { protect } from '../middleware/protect.js'
import { validate } from '../middleware/validate.js'
import { addCommentSchema } from '../lib/validationSchemas.js'


const router = express.Router()

router.use(protect)

router.post('/', validate(addCommentSchema), addComment)
router.get('/:articleId', getComments)
router.patch('/:id', editComment)
router.delete('/:id', deleteComment)

export default router