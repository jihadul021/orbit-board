import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'article_picked',
      'status_changed',
      'comment_added',
      'mentioned',
      'added_to_board',
      'article_returned'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    default: null
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
