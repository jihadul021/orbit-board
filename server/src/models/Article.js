import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'in_review', 'reviewed', 'published'],
    default: 'pending'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },

  editedTitle: {
    type: String,
    default: null
  },
  editedBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // --- Review copy fields ---
  isCopy: {
    type: Boolean,
    default: false
  },
  sourceArticle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    default: null
  },
  sourceBoardName: {
    type: String,
    default: null
  },
  pickedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // --- Lock fields (set on original when picked) ---
  isLockedForReview: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, { timestamps: true })

const Article = mongoose.model('Article', articleSchema)

export default Article