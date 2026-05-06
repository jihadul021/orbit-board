import Board from '../models/Board.js'
import Group from '../models/Group.js'
import User from '../models/User.js'

// @route  POST /api/boards
export const createBoard = async (req, res) => {
  try {
    const { name, groupId } = req.body

    // Check if group exists
    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if requester is a member of the group
    const isMember = group.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' })
    }

    // Only owner can create board for now
    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group owner can create boards' })
    }

    const board = await Board.create({
      name,
      group: groupId,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    })

    res.status(201).json({ message: 'Board created', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/boards/group/:groupId
export const getBoardsByGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' })
    }

    // Only return boards where user is a member
    const boards = await Board.find({
      group: req.params.groupId,
      'members.user': req.user._id,
      status: 'active'
    })
      .populate('createdBy', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    res.status(200).json({ boards })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/boards/:id
export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('createdBy', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const isMember = board.members.some(m => m.user._id.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    res.status(200).json({ board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  POST /api/boards/:id/members
export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body

    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if requester is admin on this board
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can add members' })
    }

    // Find user by email
    const userToAdd = await User.findOne({ email })
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if already a member
    const alreadyMember = board.members.some(m => m.user.equals(userToAdd._id))
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this board' })
    }

    // Check if user is in the group
    const group = await Group.findById(board.group)
    const inGroup = group.members.some(m => m.user.equals(userToAdd._id))
    if (!inGroup) {
      return res.status(400).json({ message: 'User must be a group member first' })
    }

    board.members.push({ user: userToAdd._id, role: role || 'writer' })
    await board.save()

    res.status(200).json({ message: 'Member added successfully', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/boards/:id/members/:userId
export const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if requester is admin
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can remove members' })
    }

    // Can't remove the board creator
    if (board.createdBy.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot remove the board creator' })
    }

    board.members = board.members.filter(m => !m.user.equals(req.params.userId))
    await board.save()

    res.status(200).json({ message: 'Member removed successfully', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/boards/:id/members/:userId/role
export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body

    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if requester is admin
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can update roles' })
    }

    const member = board.members.find(m => m.user.equals(req.params.userId))
    if (!member) {
      return res.status(404).json({ message: 'Member not found on this board' })
    }

    member.role = role
    await board.save()

    res.status(200).json({ message: 'Role updated successfully', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/boards/:id/close
export const closeBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Only admin can close board
    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can close the board' })
    }

    board.status = 'closed'
    await board.save()

    res.status(200).json({ message: 'Board closed successfully', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/boards/:id/reopen
export const reopenBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const requester = board.members.find(m => m.user.equals(req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can reopen the board' })
    }

    board.status = 'active'
    await board.save()

    res.status(200).json({ message: 'Board reopened successfully', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/boards/group/:groupId/closed
export const getClosedBoards = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some(m => m.user.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' })
    }

    const boards = await Board.find({
      group: req.params.groupId,
      'members.user': req.user._id,
      status: 'closed'
    })
      .populate('createdBy', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    res.status(200).json({ boards })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}