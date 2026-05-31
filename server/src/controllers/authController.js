import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { generateAccessToken, generateRefreshToken, sendRefreshToken } from '../lib/generateTokens.js'

// @route  POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    sendRefreshToken(res, refreshToken)

    res.status(201).json({
      message: 'Registration successful',
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