import express from 'express'
import { getActivityLog } from '../controllers/activityLogController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.use(protect)

router.get('/:articleId', getActivityLog)

export default router