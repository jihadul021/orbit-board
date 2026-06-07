import express from 'express'
import {
  requestRegisterOtp,
  verifyRegisterOtp,
  login,
  logout,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword
} from '../controllers/authController.js'
import { protect } from '../middleware/protect.js'
import { validate } from '../middleware/validate.js'
import {
  registerSchema,
  loginSchema,
  verifyRegisterOtpSchema,
  forgotPasswordEmailSchema,
  verifyPasswordResetOtpSchema,
  resetPasswordSchema
} from '../lib/validationSchemas.js'

const router = express.Router()

router.post('/register', validate(registerSchema), requestRegisterOtp)
router.post('/register/verify', validate(verifyRegisterOtpSchema), verifyRegisterOtp)
router.post('/login', validate(loginSchema), login)
router.post('/forgot-password/send-otp', validate(forgotPasswordEmailSchema), sendPasswordResetOtp)
router.post('/forgot-password/verify-otp', validate(verifyPasswordResetOtpSchema), verifyPasswordResetOtp)
router.post('/forgot-password/reset', validate(resetPasswordSchema), resetPassword)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', protect, getMe)
router.patch('/update-profile', protect, updateProfile)
router.patch('/change-password', protect, changePassword)
export default router
