import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { generateAccessToken, generateRefreshToken, sendRefreshToken } from '../lib/generateTokens.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const normalizeEmail = (email) => email.trim().toLowerCase()

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
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const hashedPassword = await bcryptjs.hash(password, 10)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: 'local'
    })

    sendAuthResponse(res, user, 'Registration successful', 201)

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

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

// @route  POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google login. Continue with Gmail instead.' })
    }

    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

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
