import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'article_created',
      'status_changed',
      'selected_for_review',
      'article_copied',
      'copy_deleted'
    ],
    required: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // e.g. { from: 'pending', to: 'in_review' } for status changes
  }
}, { timestamps: true })

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog