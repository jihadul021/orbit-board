import ActivityLog from '../models/ActivityLog.js'

export const logActivity = async (articleId, userId, action, meta = {}) => {
  try {
    const dedupeWindow = new Date(Date.now() - 5000)

    // Build dedupe query
    const dupeQuery = {
      article: articleId,
      user: userId,
      action,
      createdAt: { $gte: dedupeWindow }
    }

    // For status changes, also match the exact transition
    if (action === 'status_changed' && meta.from && meta.to) {
      dupeQuery['meta.from'] = meta.from
      dupeQuery['meta.to'] = meta.to
    }

    const recentLog = await ActivityLog.findOne(dupeQuery)
    if (recentLog) return

    await ActivityLog.create({
      article: articleId,
      user: userId,
      action,
      meta
    })
  } catch (err) {
    console.error('Activity log error:', err.message)
  }
}