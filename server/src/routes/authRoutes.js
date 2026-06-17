import express from 'express'
import {
  register,
  login,
  googleAuth,
  logout,
  refresh,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/authController.js'
import { protect } from '../middleware/protect.js'
import { validate } from '../middleware/validate.js'
import {
  registerSchema,
  loginSchema,
  googleAuthSchema
} from '../lib/validationSchemas.js'

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google', validate(googleAuthSchema), googleAuth)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', protect, getMe)
router.patch('/update-profile', protect, updateProfile)
router.patch('/change-password', protect, changePassword)
export default router
