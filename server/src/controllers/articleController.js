import Article from '../models/Article.js'
import List from '../models/List.js'
import Board from '../models/Board.js'
import { logActivity } from '../lib/logActivity.js'
import { notify } from '../lib/notify.js'

const ensureBoardIsActive = (board, res) => {
  if (board.status === 'closed') {
    res.status(403).json({ message: 'This board is closed. Reopen it to make changes.' })
    return false
  }

  return true
}

// @route  POST /api/articles
export const createArticle = async (req, res) => {
  try {
    const { title, listId } = req.body

    const list = await List.findById(listId)
    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const board = await Board.findById(list.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return
    const lastArticle = await Article.findOne({ list: listId }).sort({ position: -1, createdAt: -1 })

    const article = await Article.create({
      title,
      body: {},
      author: req.user._id,
      list: listId,
      board: list.board,
      group: list.group,
      position: lastArticle ? lastArticle.position + 1 : 0
    }) 
    // activity log
    await logActivity(article._id, req.user._id, 'article_created')

    res.status(201).json({ message: 'Article created', article })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/articles/list/:listId
export const getArticlesByList = async (req, res) => {
  try {
    const list = await List.findById(req.params.listId)
    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const board = await Board.findById(list.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    const articles = await Article.find({ list: req.params.listId })
      .populate('author', 'name email profilePic')
      .populate('pickedBy', 'name email profilePic')
      .populate('lockedBy', 'name email profilePic')
      .sort({ position: 1, createdAt: 1 })

    res.status(200).json({ articles })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/articles/:id
export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'name email profilePic')
      .populate('list', 'name')
      .populate('board', 'name')
      .populate('pickedBy', 'name email profilePic')
      .populate('lockedBy', 'name email profilePic')

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    const board = await Board.findById(article.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    res.status(200).json({ article })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/articles/:id
export const updateArticle = async (req, res) => {
  try {
    const { title, body } = req.body

    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    const board = await Board.findById(article.board)

    // Only author or editor/admin can update
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    const isAuthor = article.author.equals(req.user._id)
    const isEditorOrAdmin = ['editor', 'admin'].includes(requester.role)

    if (!isAuthor && !isEditorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this article' })
    }

    article.title = title || article.title
    article.body = body || article.body
    await article.save()
    // activity log
    // await logActivity(article._id, req.user._id, 'article_edited')

    res.status(200).json({ message: 'Article updated', article })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/articles/:id/status
export const updateArticleStatus = async (req, res) => {
  try {
    const { status } = req.body

    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    const board = await Board.findById(article.board)
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    const writerAllowed = ['pending', 'completed', 'published']
    const editorAllowed = ['in_review', 'reviewed', 'published']
    const allowed = requester.role === 'writer' ? writerAllowed : editorAllowed

    if (!allowed.includes(status)) {
      return res.status(403).json({ message: 'Not authorized to set this status' })
    }
    
    const oldStatus = article.status
    article.status = status
    await article.save()
    // activity log
    if (oldStatus !== status) {
      await logActivity(article._id, req.user._id, 'status_changed', {
        from: oldStatus,
        to: status
      })

      if (!article.author.equals(req.user._id)) {
        await notify(
          article.author,
          'status_changed',
          `Your article "${article.title}" status changed to ${status.replace(/_/g, ' ')}`,
          article._id,
          article.board
        )
      }
    }
    // If this is a copy — sync status to original and unlock if reviewed/published
    if (article.isCopy && article.sourceArticle) {
      const originalUpdate = { status }
      if (['reviewed', 'published'].includes(status)) {
        originalUpdate.isLockedForReview = false
        originalUpdate.lockedBy = null
        originalUpdate.editedTitle = article.title
        originalUpdate.editedBody = article.body
      }
      await Article.findByIdAndUpdate(article.sourceArticle, originalUpdate)
    }

    // If this is an original and status is published — sync to its copy if one exists
    if (!article.isCopy && status === 'published') {
      await Article.updateOne(
        { sourceArticle: article._id, isCopy: true },
        { status: 'published' }
      )
    }

    res.status(200).json({ message: 'Status updated', article })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/articles/:id/move
export const moveArticle = async (req, res) => {
  try {
    const { listId, sourceListId, orderedArticleIds = [], sourceOrderedArticleIds = [] } = req.body

    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    const newList = await List.findById(listId)
    if (!newList) {
      return res.status(404).json({ message: 'Target list not found' })
    }

    if (!newList.board.equals(article.board)) {
      return res.status(400).json({ message: 'Target list must be on the same board' })
    }

    if (newList.isArchived) {
      return res.status(400).json({ message: 'Cannot move articles to an archived list' })
    }

    const board = await Board.findById(article.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    const sourceList = sourceListId ? await List.findById(sourceListId) : null
    if (sourceListId && !sourceList) {
      return res.status(404).json({ message: 'Source list not found' })
    }

    if (sourceList && !sourceList.board.equals(article.board)) {
      return res.status(400).json({ message: 'Source list must be on the same board' })
    }

    const updateListOrder = async (orderedIds, targetListId) => {
      await Promise.all(
        orderedIds.map((orderedArticleId, index) =>
          Article.updateOne(
            { _id: orderedArticleId, board: article.board, list: targetListId },
            { $set: { position: index } }
          )
        )
      )
    }

    const movedArticlePosition = orderedArticleIds.indexOf(article._id.toString())
    article.list = listId
    article.position = movedArticlePosition >= 0 ? movedArticlePosition : article.position
    await article.save()

    if (sourceListId && sourceListId !== listId && sourceOrderedArticleIds.length > 0) {
      await updateListOrder(sourceOrderedArticleIds, sourceListId)
    }

    if (orderedArticleIds.length > 0) {
      await updateListOrder(orderedArticleIds, listId)
    }

    res.status(200).json({ message: 'Article moved', article })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/articles/:id
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    const board = await Board.findById(article.board)
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    const isAuthor = article.author.equals(req.user._id)
    const isAdmin = requester.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this article' })
    }

    await article.deleteOne()

    res.status(200).json({ message: 'Article deleted' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
} 
