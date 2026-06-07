import Notification from '../models/Notification.js'

export const notify = async (recipientId, type, message, articleId = null, boardId = null) => {
  try {
    if (!recipientId) return
    await Notification.create({
      recipient: recipientId,
      type,
      message,
      article: articleId,
      board: boardId
    })
  } catch (err) {
    console.error('Notification error:', err.message)
  }
}
