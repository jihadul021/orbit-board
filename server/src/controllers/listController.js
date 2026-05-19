import List from '../models/List.js'
import Board from '../models/Board.js'

const ensureBoardIsActive = (board, res) => {
  if (board.status === 'closed') {
    res.status(403).json({ message: 'This board is closed. Reopen it to make changes.' })
    return false
  }

  return true
}

// @route  POST /api/lists
export const createList = async (req, res) => {
  try {
    const { name, boardId } = req.body

    const board = await Board.findById(boardId)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if user is a member of the board
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    const list = await List.create({
      name,
      board: boardId,
      group: board.group,
      createdBy: req.user._id
    })

    res.status(201).json({ message: 'List created', list })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/lists/board/:boardId
export const getListsByBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    const lists = await List.find({
      board: req.params.boardId,
      isArchived: false
    }).populate('createdBy', 'name email profilePic')

    res.status(200).json({ lists })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/lists/board/:boardId/archived
export const getArchivedLists = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    const lists = await List.find({
      board: req.params.boardId,
      isArchived: true
    }).populate('createdBy', 'name email profilePic')

    res.status(200).json({ lists })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/lists/:id/archive
export const archiveList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const board = await Board.findById(list.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    list.isArchived = true
    await list.save()

    res.status(200).json({ message: 'List archived', list })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/lists/:id/unarchive
export const unarchiveList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const board = await Board.findById(list.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    list.isArchived = false
    await list.save()

    res.status(200).json({ message: 'List unarchived', list })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/lists/:id
export const updateList = async (req, res) => {
  try {
    const { name } = req.body

    const list = await List.findById(req.params.id)
    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const board = await Board.findById(list.board)
    const isMember = board.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    if (!ensureBoardIsActive(board, res)) return

    list.name = name || list.name
    await list.save()

    res.status(200).json({ message: 'List updated', list })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/lists/:id
export const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
    if (!list) {
      return res.status(404).json({ message: 'List not found' })
    }

    const board = await Board.findById(list.board)

    // Only admin can delete a list
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can delete lists' })
    }

    if (!ensureBoardIsActive(board, res)) return

    await list.deleteOne()

    res.status(200).json({ message: 'List deleted' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
