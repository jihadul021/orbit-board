import bcryptjs from 'bcryptjs'
import User from '../models/User.js'

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

    res.status(201).json({
      message: 'Registration successful',
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

    res.status(200).json({
      message: 'Login successful',
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