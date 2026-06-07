import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import OtpToken from '../models/OtpToken.js'
import { generateAccessToken, generateRefreshToken, sendRefreshToken } from '../lib/generateTokens.js'
import { sendOtpEmail } from '../lib/email.js'

const OTP_TTL_MINUTES = 10

const normalizeEmail = (email) => email.trim().toLowerCase()

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

const isEmailError = (err) => (
  err.message?.includes('Gmail') ||
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
      password: token.payload.password
    })
    await token.deleteOne()

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    sendRefreshToken(res, refreshToken)

    res.status(201).json({
      message: 'Registration verified',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      }
    })

  } catch (err) {
    res.status(500).json({ message: isEmailError(err) ? err.message : 'Server error', error: err.message })
  }
}

// Backward-compatible alias for route imports if needed.
export const register = requestRegisterOtp

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

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    sendRefreshToken(res, refreshToken)

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      }
    })

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
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
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
