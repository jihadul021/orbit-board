import Board from '../models/Board.js'
import Group from '../models/Group.js'
import User from '../models/User.js'
import { notify } from '../lib/notify.js'
import { ensureGroupAdminsOnBoard, getGroupAdminBoardMembers, idsEqual, isGroupAdmin } from '../lib/groupBoardRoles.js'

const syncGroupAdminsOnBoard = async (board) => {
  const group = await Group.findById(board.group)
  if (!group) return null

  if (ensureGroupAdminsOnBoard(board, group)) {
    await board.save()
  }

  return group
}

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

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only group admins can create boards' })
    }

    const adminMembers = getGroupAdminBoardMembers(group)
    const board = await Board.create({
      name,
      group: groupId,
      createdBy: req.user._id,
      members: adminMembers.length > 0 ? adminMembers : [{ user: req.user._id, role: 'admin' }]
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

    const requesterIsGroupAdmin = isGroupAdmin(group, req.user._id)
    let boards = await Board.find({
      group: req.params.groupId,
      ...(requesterIsGroupAdmin ? {} : { 'members.user': req.user._id }),
      status: 'active'
    })
      .populate('createdBy', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    if (requesterIsGroupAdmin) {
      await Promise.all(boards.map(async (board) => {
        if (ensureGroupAdminsOnBoard(board, group)) {
          await board.save()
          await board.populate('members.user', 'name email profilePic')
        }
      }))
    }

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

    const group = await Group.findById(board.group)
    const requesterIsGroupAdmin = group ? isGroupAdmin(group, req.user._id) : false

    if (group && requesterIsGroupAdmin && ensureGroupAdminsOnBoard(board, group)) {
      await board.save()
      await board.populate('members.user', 'name email profilePic')
    }

    const isMember = board.members.some(m => idsEqual(m.user, req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this board' })
    }

    res.status(200).json({ board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/boards/:id
export const updateBoard = async (req, res) => {
  try {
    const { name } = req.body

    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    await syncGroupAdminsOnBoard(board)

    const requester = board.members.find(m => idsEqual(m.user, req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can rename the board' })
    }

    board.name = name
    await board.save()
    await board.populate('createdBy', 'name email profilePic')
    await board.populate('members.user', 'name email profilePic')

    res.status(200).json({ message: 'Board updated', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  POST /api/boards/:id/members
export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body
    const memberRole = role || 'writer'

    if (!['writer', 'editor'].includes(memberRole)) {
      return res.status(400).json({ message: 'Board members can only be added as writer or editor. Add admins from group members.' })
    }

    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const group = await syncGroupAdminsOnBoard(board)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if requester is admin on this board
    const requester = board.members.find(m => idsEqual(m.user, req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can add members' })
    }

    // Find user by email
    const userToAdd = await User.findOne({ email })
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userIsGroupAdmin = isGroupAdmin(group, userToAdd._id)
    const existingBoardMember = board.members.find(m => idsEqual(m.user, userToAdd._id))
    if (existingBoardMember) {
      if (userIsGroupAdmin) {
        if (existingBoardMember.role !== 'admin') {
          existingBoardMember.role = 'admin'
          await board.save()
        }
        await board.populate('members.user', 'name email profilePic')

        return res.status(200).json({ message: 'Group admin already has admin access on this board', board })
      }

      return res.status(400).json({ message: 'User is already a member of this board' })
    }

    const alreadyGroupMember = group.members.some(m => m.user.equals(userToAdd._id))
    if (!alreadyGroupMember) {
      group.members.push({ user: userToAdd._id, role: 'member' })
      await group.save()
    }

    // Add to board
    board.members.push({ user: userToAdd._id, role: userIsGroupAdmin ? 'admin' : memberRole })
    await board.save()

    // Notify the user
    await notify(
      userToAdd._id,
      'added_to_board',
      `You were added to the board "${board.name}"`,
      null,
      board._id
    )

    // Populate and return
    await board.populate('members.user', 'name email profilePic')

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

    await syncGroupAdminsOnBoard(board)

    // Check if requester is admin
    const requester = board.members.find(m => idsEqual(m.user, req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can remove members' })
    }

    // Can't remove the board creator
    if (board.createdBy.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot remove the board creator' })
    }

    const memberToRemove = board.members.find(m => idsEqual(m.user, req.params.userId))
    if (!memberToRemove) {
      return res.status(404).json({ message: 'Member not found on this board' })
    }

    if (memberToRemove.role === 'admin') {
      return res.status(400).json({ message: 'Board admins can only be removed from group members' })
    }

    board.members = board.members.filter(m => !idsEqual(m.user, req.params.userId))
    await board.save()
    const remainingBoardMembership = await Board.exists({
      group: board.group,
      'members.user': req.params.userId
    })

    if (!remainingBoardMembership) {
      const group = await Group.findById(board.group)
      if (group && !group.owner.equals(req.params.userId)) {
        group.members = group.members.filter(m => !m.user.equals(req.params.userId))
        await group.save()
      }
    }

    res.status(200).json({ message: 'Member removed successfully', board })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/boards/:id/members/:userId/role
export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body

    if (!['writer', 'editor'].includes(role)) {
      return res.status(400).json({ message: 'Board roles can only be changed to writer or editor. Add admins from group members.' })
    }

    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const group = await syncGroupAdminsOnBoard(board)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if requester is admin
    const requester = board.members.find(m => idsEqual(m.user, req.user._id))
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only board admins can update roles' })
    }

    const member = board.members.find(m => idsEqual(m.user, req.params.userId))
    if (!member) {
      return res.status(404).json({ message: 'Member not found on this board' })
    }

    if (member.role === 'admin') {
      return res.status(400).json({ message: 'Board admins are managed from group members' })
    }

    if (isGroupAdmin(group, req.params.userId)) {
      member.role = 'admin'
      await board.save()
      await board.populate('members.user', 'name email profilePic')

      return res.status(200).json({ message: 'Group admin promoted on this board', board })
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

    await syncGroupAdminsOnBoard(board)

    // Only admin can close board
    const requester = board.members.find(m => idsEqual(m.user, req.user._id))
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

    await syncGroupAdminsOnBoard(board)

    const requester = board.members.find(m => idsEqual(m.user, req.user._id))
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

    const requesterIsGroupAdmin = isGroupAdmin(group, req.user._id)
    const boards = await Board.find({
      group: req.params.groupId,
      ...(requesterIsGroupAdmin ? {} : { 'members.user': req.user._id }),
      status: 'closed'
    })
      .populate('createdBy', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    if (requesterIsGroupAdmin) {
      await Promise.all(boards.map(async (board) => {
        if (ensureGroupAdminsOnBoard(board, group)) {
          await board.save()
          await board.populate('members.user', 'name email profilePic')
        }
      }))
    }

    res.status(200).json({ boards })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
