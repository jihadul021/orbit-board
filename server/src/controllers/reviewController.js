import Article from '../models/Article.js'
import Board from '../models/Board.js'
import List from '../models/List.js'

// @route  POST /api/review/pick
// Editor picks an article — creates a copy in their editor board
export const pickArticle = async (req, res) => {
  try {
    const { articleId, targetBoardId, targetListId } = req.body

    // Get original article
    const original = await Article.findById(articleId)
      .populate('board', 'name')
    if (!original) {
      return res.status(404).json({ message: 'Article not found' })
    }

    // Check article is not already locked
    if (original.isLockedForReview) {
      const locker = await Article.findById(articleId)
        .populate('lockedBy', 'name')
      return res.status(400).json({
        message: `Article is already in review by ${locker.lockedBy?.name || 'another editor'}`
      })
    }

    // Check requester is editor or admin on the TARGET board
    const targetBoard = await Board.findById(targetBoardId)
    if (!targetBoard) {
      return res.status(404).json({ message: 'Target board not found' })
    }

    if (original.group.toString() !== targetBoard.group.toString()) {
      return res.status(403).json({ message: 'You can only copy articles within the same group' })
    }

    const requester = targetBoard.members.find(m => m.user.equals(req.user._id))
    if (!requester || !['editor', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Only editors and admins can pick articles for review' })
    }

    // Check target list exists and belongs to target board
    const targetList = await List.findById(targetListId)
    if (!targetList || targetList.board.toString() !== targetBoardId) {
      return res.status(404).json({ message: 'Target list not found' })
    }

    // Create the copy
    const copy = await Article.create({
      title: original.title,
      body: original.body,
      status: 'in_review',
      author: original.author,
      list: targetListId,
      board: targetBoardId,
      group: targetBoard.group,
      isCopy: true,
      sourceArticle: original._id,
      sourceBoardName: original.board.name,
      pickedBy: req.user._id
    })

    // Lock the original
    original.isLockedForReview = true
    original.lockedBy = req.user._id
    original.status = 'in_review'
    await original.save()

    await copy.populate('author', 'name email profilePic')
    await copy.populate('pickedBy', 'name email profilePic')

    res.status(201).json({ message: 'Article picked for review', copy })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/review/copy/:id/status
// Editor updates copy status — syncs back to original
export const updateCopyStatus = async (req, res) => {
  try {
    const { status } = req.body
    const allowedStatuses = ['in_review', 'reviewed', 'published']

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status for review copy' })
    }

    const copy = await Article.findById(req.params.id)
    if (!copy || !copy.isCopy) {
      return res.status(404).json({ message: 'Review copy not found' })
    }

    const board = await Board.findById(copy.board)
    const requester = board?.members.find(m => m.user.equals(req.user._id))
    if (!requester || !['editor', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Only editors and admins can update review status' })
    }

    copy.status = status
    await copy.save()

    if (copy.sourceArticle) {
      const originalUpdate = { status }

      // Save edited snapshot onto original when reviewed or published
      if (['reviewed', 'published'].includes(status)) {
        originalUpdate.isLockedForReview = false
        originalUpdate.lockedBy = null
        originalUpdate.editedTitle = copy.title
        originalUpdate.editedBody = copy.body
      }

      await Article.findByIdAndUpdate(copy.sourceArticle, originalUpdate)
    }

    res.status(200).json({ message: 'Status updated and synced to original', copy })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/review/copy/:id
// Editor returns article — deletes copy and unlocks original
export const returnArticle = async (req, res) => {
  try {
    const copy = await Article.findById(req.params.id)
    if (!copy || !copy.isCopy) {
      return res.status(404).json({ message: 'Review copy not found' })
    }

    const board = await Board.findById(copy.board)
    const requester = board?.members.find(m => m.user.equals(req.user._id))
    if (!requester || !['editor', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Only editors and admins can delete review copies' })
    }

    // Just unlock the original — keep whatever status it currently has
    if (copy.sourceArticle) {
      await Article.findByIdAndUpdate(copy.sourceArticle, {
        isLockedForReview: false,
        lockedBy: null
      })
    }

    await copy.deleteOne()

    res.status(200).json({ message: 'Copy deleted, original unlocked' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/review/boards
// Get all boards where requester is editor or admin (for the pick modal)
export const getEditorBoards = async (req, res) => {
  try {
    const { groupId, currentBoardId } = req.query

    const query = {
      'members': {
        $elemMatch: {
          user: req.user._id,
          role: { $in: ['editor', 'admin'] }
        }
      },
      status: 'active'
    }

    if (groupId) {
      query.group = groupId
    }

    if (currentBoardId) {
      query._id = { $ne: currentBoardId }
    }

    const boards = await Board.find(query).populate('group', 'name')

    res.status(200).json({ boards })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
