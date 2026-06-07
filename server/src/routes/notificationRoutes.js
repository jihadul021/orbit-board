import express from 'express'
import {
  getNotifications,
  markAllRead,
  markOneRead
} from '../controllers/notificationController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.use(protect)

router.get('/', getNotifications)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markOneRead)

export default router
