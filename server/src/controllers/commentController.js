import Comment from '../models/Comment.js'
import Article from '../models/Article.js'
import Board from '../models/Board.js'
import { notify } from '../lib/notify.js'

// helper — check if user is a board member of the article's board
const getBoardMember = async (articleId, userId) => {
  const article = await Article.findById(articleId)
  if (!article) return null
  const board = await Board.findById(article.board)
  if (!board) return null
  const member = board.members.find(m => m.user.equals(userId))
  return member || null
}

// @route  POST /api/comments
export const addComment = async (req, res) => {
  try {
    const { articleId, body, parentId } = req.body

    const member = await getBoardMember(articleId, req.user._id)
    if (!member) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    // If it's a reply, make sure parent comment exists
    if (parentId) {
      const parent = await Comment.findById(parentId)
      if (!parent) {
        return res.status(404).json({ message: 'Parent comment not found' })
      }
      // Replies can't be nested deeper than one level
      if (parent.parentId) {
        return res.status(400).json({ message: 'Cannot reply to a reply' })
      }
    }

    const comment = await Comment.create({
      article: articleId,
      author: req.user._id,
      body,
      parentId: parentId || null
    })

    await comment.populate('author', 'name email profilePic')

    // Fetch article and board once
    const article = await Article.findById(articleId)
    const board = article ? await Board.findById(article.board).populate('members.user', 'name') : null

    if (article && parentId) {
      const parentComment = await Comment.findById(parentId).populate('author', 'name')
      if (
        parentComment &&
        parentComment.author._id.toString() !== req.user._id.toString()
      ) {
        await notify(
          parentComment.author._id,
          'comment_added',
          `${req.user.name} replied to your comment on "${article.title}"`,
          article._id,
          article.board
        )
      }
    }

    if (
      article &&
      !parentId &&
      article.author.toString() !== req.user._id.toString()
    ) {
      await notify(
        article.author,
        'comment_added',
        `${req.user.name} commented on your article "${article.title}"`,
        article._id,
        article.board
      )
    }

    // Detect @mentions by matching actual board member names.
    const mentions = new Set()
    if (board) {
      const memberNames = board.members
        .map(member => member.user.name)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)

      if (memberNames.length > 0) {
        const escapedNames = memberNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        const mentionRegex = new RegExp(`@(${escapedNames.join('|')})(?=$|[\\s.,!?;:)])`, 'gi')

        for (const match of body.matchAll(mentionRegex)) {
          const mentionedName = memberNames.find(name => name.toLowerCase() === match[1].toLowerCase())
          if (mentionedName) mentions.add(mentionedName)
        }
      }
    }

    if (mentions.size > 0 && board) {
      for (const mentionedName of mentions) {
        const boardMember = board.members.find(
          m => m.user.name === mentionedName
        )
        if (
          boardMember &&
          boardMember.user._id.toString() !== req.user._id.toString()
        ) {
          await notify(
            boardMember.user._id,
            'mentioned',
            `${req.user.name} mentioned you in a comment on "${article.title}"`,
            article._id,
            article.board
          )
        }
      }
    }

    res.status(201).json({ message: 'Comment added', comment })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/comments/:articleId
export const getComments = async (req, res) => {
  try {
    const member = await getBoardMember(req.params.articleId, req.user._id)
    if (!member) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    const comments = await Comment.find({ article: req.params.articleId })
      .populate('author', 'name email profilePic')
      .sort({ createdAt: 1 })

    // Structure: top-level comments with their replies nested
    const topLevel = comments.filter(c => !c.parentId)
    const replies = comments.filter(c => c.parentId)

    const threaded = topLevel.map(comment => ({
      ...comment.toObject(),
      replies: replies.filter(r => r.parentId.toString() === comment._id.toString())
    }))

    res.status(200).json({ comments: threaded })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/comments/:id
export const editComment = async (req, res) => {
  try {
    const { body } = req.body

    if (!body || body.trim() === '') {
      return res.status(400).json({ message: 'Comment cannot be empty' })
    }

    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Only the author can edit their comment
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the author can edit this comment' })
    }

    comment.body = body.trim()
    await comment.save()
    await comment.populate('author', 'name email profilePic')

    res.status(200).json({ message: 'Comment updated', comment })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/comments/:id
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    const member = await getBoardMember(comment.article, req.user._id)
    if (!member) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    const isAuthor = comment.author.equals(req.user._id)
    const isAdmin = member.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' })
    }

    // If deleting a top-level comment, delete its replies too
    if (!comment.parentId) {
      await Comment.deleteMany({ parentId: comment._id })
    }

    await comment.deleteOne()

    res.status(200).json({ message: 'Comment deleted' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
