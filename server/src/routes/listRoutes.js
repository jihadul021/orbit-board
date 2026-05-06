import express from 'express'
import {
  createList,
  getListsByBoard,
  getArchivedLists,
  archiveList,
  unarchiveList,
  updateList,
  deleteList
} from '../controllers/listController.js'
import { protect } from '../middleware/protect.js'
import { validate } from '../middleware/validate.js'
import { createListSchema, updateListSchema } from '../lib/validationSchemas.js'


const router = express.Router()

router.use(protect)

router.post('/', validate(createListSchema), createList)
router.get('/board/:boardId', getListsByBoard)
router.get('/board/:boardId/archived', getArchivedLists)
router.patch('/:id', validate(updateListSchema), updateList)
router.patch('/:id/archive', archiveList)
router.patch('/:id/unarchive', unarchiveList)
router.delete('/:id', deleteList)

export default router  