import express from 'express'
import { register, login, logout, refresh } from '../controllers/authController.js'
import { protect } from '../middleware/protect.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})
export default router