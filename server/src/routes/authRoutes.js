import express from 'express'
import { protect } from '../middleware/protect.js'
import { register, login, logout, refresh, getMe } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)

router.get('/me', protect, getMe)

export default router