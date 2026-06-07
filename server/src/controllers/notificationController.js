import Notification from '../models/Notification.js'

// @route GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    })

    res.status(200).json({ notifications, unreadCount })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route PATCH /api/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    )
    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route PATCH /api/notifications/:id/read
export const markOneRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    )
    res.status(200).json({ message: 'Notification marked as read' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
