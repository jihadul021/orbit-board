import express from 'express'
import { register, login, logout, refresh, getMe } from '../controllers/authController.js'
import { protect } from '../middleware/protect.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../lib/validationSchemas.js'

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', protect, getMe)

export default router