import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import OtpToken from '../models/OtpToken.js'
import { generateAccessToken, generateRefreshToken, sendRefreshToken } from '../lib/generateTokens.js'
import { sendOtpEmail } from '../lib/email.js'

const OTP_TTL_MINUTES = 10
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const LOGIN_ATTEMPT_MAX = 5
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const loginAttempts = new Map()

const normalizeEmail = (email) => email.trim().toLowerCase()

const getLoginAttemptKey = (req, email) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  return `${ip}:${normalizeEmail(email)}`
}

const getLoginAttempt = (req, email) => {
  const key = getLoginAttemptKey(req, email)
  const attempt = loginAttempts.get(key)

  if (!attempt || attempt.resetAt <= Date.now()) {
    loginAttempts.delete(key)
    return { key, count: 0, resetAt: Date.now() + LOGIN_ATTEMPT_WINDOW_MS }
  }

  return { key, ...attempt }
}

const isLoginBlocked = (req, email) => {
  const attempt = getLoginAttempt(req, email)
  return {
    blocked: attempt.count >= LOGIN_ATTEMPT_MAX,
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - Date.now()) / 1000))
  }
}

const recordFailedLogin = (req, email) => {
  const attempt = getLoginAttempt(req, email)
  loginAttempts.set(attempt.key, {
    count: attempt.count + 1,
    resetAt: attempt.resetAt
  })
}

const clearFailedLogins = (req, email) => {
  loginAttempts.delete(getLoginAttemptKey(req, email))
}

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

const isEmailError = (err) => (
  err.message?.includes('Resend') ||
  err.message?.includes('Email service') ||
  err.message?.includes('OTP email')
)

const createOtpToken = async ({ email, purpose, payload = {} }) => {
  const otp = generateOtp()
  const otpHash = await bcryptjs.hash(otp, 10)

  await OtpToken.deleteMany({ email, purpose })
  await OtpToken.create({
    email,
    purpose,
    otpHash,
    payload,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
  })

  await sendOtpEmail({ to: email, otp, purpose })
}

const verifyOtpToken = async ({ email, purpose, otp }) => {
  const token = await OtpToken.findOne({ email, purpose }).sort({ createdAt: -1 })
  if (!token) return null

  const isExpired = token.expiresAt.getTime() < Date.now()
  if (isExpired) {
    await token.deleteOne()
    return null
  }

  const isMatch = await bcryptjs.compare(otp, token.otpHash)
  if (!isMatch) return null

  return token
}

const authPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePic: user.profilePic
})

const sendAuthResponse = (res, user, message, status = 200) => {
  const accessToken = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  sendRefreshToken(res, refreshToken)

  res.status(status).json({
    message,
    accessToken,
    user: authPayload(user)
  })
}

// @route  POST /api/auth/register
export const requestRegisterOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const hashedPassword = await bcryptjs.hash(password, 10)
    await createOtpToken({
      email: normalizedEmail,
      purpose: 'register',
      payload: {
        name,
        email: normalizedEmail,
        password: hashedPassword
      }
    })

    res.status(200).json({ message: 'Verification code sent to your email' })

  } catch (err) {
    res.status(500).json({ message: isEmailError(err) ? err.message : 'Server error', error: err.message })
  }
}

// @route  POST /api/auth/register/verify
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    const normalizedEmail = normalizeEmail(email)

    const token = await verifyOtpToken({
      email: normalizedEmail,
      purpose: 'register',
      otp
    })

    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      await token.deleteOne()
      return res.status(400).json({ message: 'Email already in use' })
    }

    const user = await User.create({
      name: token.payload.name,
      email: normalizedEmail,
      password: token.payload.password,
      authProvider: 'local'
    })
    await token.deleteOne()

    sendAuthResponse(res, user, 'Registration verified', 201)

  } catch (err) {
    res.status(500).json({ message: isEmailError(err) ? err.message : 'Server error', error: err.message })
  }
}

// Backward-compatible alias for route imports if needed.
export const register = requestRegisterOtp

// @route  POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google login is not configured. Add GOOGLE_CLIENT_ID to server/.env.' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' })
    }

    const email = normalizeEmail(payload.email)
    const googleId = payload.sub
    let user = await User.findOne({ $or: [{ googleId }, { email }] })
    let status = 200
    let message = 'Login successful'

    if (!user) {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        profilePic: payload.picture || ''
      })
      status = 201
      message = 'Account created with Google'
    } else {
      const updates = {}
      if (!user.googleId) updates.googleId = googleId
      if (user.authProvider !== 'google' && !user.password) updates.authProvider = 'google'
      if (!user.profilePic && payload.picture) updates.profilePic = payload.picture

      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true })
      }
    }

    sendAuthResponse(res, user, message, status)
  } catch (err) {
    res.status(401).json({ message: 'Google authentication failed', error: err.message })
  }
}

// @route  POST /api/auth/forgot-password/send-otp
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body
    const normalizedEmail = normalizeEmail(email)

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' })
    }

    await createOtpToken({
      email: normalizedEmail,
      purpose: 'reset_password'
    })

    res.status(200).json({ message: 'Password reset code sent to your email' })

  } catch (err) {
    res.status(500).json({ message: isEmailError(err) ? err.message : 'Server error', error: err.message })
  }
}

// @route  POST /api/auth/forgot-password/verify-otp
export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    const normalizedEmail = normalizeEmail(email)

    const token = await verifyOtpToken({
      email: normalizedEmail,
      purpose: 'reset_password',
      otp
    })

    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    token.verified = true
    await token.save()

    res.status(200).json({ message: 'OTP verified' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  POST /api/auth/forgot-password/reset
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body
    const normalizedEmail = normalizeEmail(email)

    const token = await verifyOtpToken({
      email: normalizedEmail,
      purpose: 'reset_password',
      otp
    })

    if (!token || !token.verified) {
      return res.status(400).json({ message: 'Verify OTP before resetting password' })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      await token.deleteOne()
      return res.status(404).json({ message: 'No account found with this email' })
    }

    user.password = await bcryptjs.hash(password, 10)
    await user.save()
    await token.deleteOne()

    res.status(200).json({ message: 'Password reset successfully' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = normalizeEmail(email)
    const loginBlock = isLoginBlocked(req, normalizedEmail)

    if (loginBlock.blocked) {
      res.set('Retry-After', loginBlock.retryAfterSeconds.toString())
      return res.status(429).json({ message: 'Too many failed login attempts. Try again later.' })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      recordFailedLogin(req, normalizedEmail)
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.password) {
      recordFailedLogin(req, normalizedEmail)
      return res.status(401).json({ message: 'This account uses Google login. Continue with Gmail instead.' })
    }

    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
      recordFailedLogin(req, normalizedEmail)
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    clearFailedLogins(req, normalizedEmail)
    sendAuthResponse(res, user, 'Login successful')

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('refreshToken')
  res.status(200).json({ message: 'Logged out successfully' })
}

// @route  POST /api/auth/refresh
export const refresh = (req, res) => {
  const token = req.cookies.refreshToken

  if (!token) {
    return res.status(401).json({ message: 'No refresh token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const accessToken = generateAccessToken(decoded.id)
    res.status(200).json({ accessToken })
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

// @route  GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({ user: req.user })
}


// @route  PATCH /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name cannot be empty' })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    ).select('-password')

    res.status(200).json({
      message: 'Profile updated',
      user: {
        ...authPayload(user)
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(req.user._id)

    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google login. Reset your password first to add password login.' })
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    const hashed = await bcryptjs.hash(newPassword, 10)
    user.password = hashed
    await user.save()

    res.status(200).json({ message: 'Password changed successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
