import ActivityLog from '../models/ActivityLog.js'
import Article from '../models/Article.js'
import Board from '../models/Board.js'

export const getActivityLog = async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId)
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    // Only editors and admins can see activity log
    const board = await Board.findById(article.board)
    const member = board?.members.find(m => m.user.equals(req.user._id))
    if (!member || !['editor', 'admin'].includes(member.role)) {
      return res.status(403).json({ message: 'Only editors and admins can view activity logs' })
    }

    // Collect article IDs to fetch logs for
    const articleIds = [article._id]

    // If this is a copy — also include original article's logs
    if (article.isCopy && article.sourceArticle) {
      articleIds.push(article.sourceArticle)
    }

    // If this is an original — also include any copy's logs
    if (!article.isCopy) {
      const copy = await Article.findOne({
        sourceArticle: article._id,
        isCopy: true
      })
      if (copy) {
        articleIds.push(copy._id)
      }
    }

    const logs = await ActivityLog.find({
      article: { $in: articleIds }
    })
      .populate('user', 'name email profilePic')
      .sort({ createdAt: 1 })

    res.status(200).json({ logs })

  } catch (err) {
    console.error('Activity log error:', err.message, err.stack)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}