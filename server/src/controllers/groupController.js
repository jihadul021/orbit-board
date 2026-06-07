import Group from '../models/Group.js'
import User from '../models/User.js'
import Board from '../models/Board.js'

// @route  POST /api/groups
export const createGroup = async (req, res) => {
  try {
    const { name } = req.body

    const group = await Group.create({
      name,
      owner: req.user._id,
      members: [{ user: req.user._id }]
    })

    res.status(201).json({ message: 'Group created', group })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/groups
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('owner', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    res.status(200).json({ groups })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  GET /api/groups/:id
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('owner', 'name email profilePic')
      .populate('members.user', 'name email profilePic')

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    const isMember = group.members.some(m => m.user._id.equals(req.user._id))
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' })
    }

    res.status(200).json({ group })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  PATCH /api/groups/:id
export const updateGroup = async (req, res) => {
  try {
    const { name } = req.body

    const group = await Group.findById(req.params.id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group owner can rename the group' })
    }

    group.name = name
    await group.save()
    await group.populate('owner', 'name email profilePic')
    await group.populate('members.user', 'name email profilePic')

    res.status(200).json({ message: 'Group updated', group })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  POST /api/groups/:id/invite
export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body

    const group = await Group.findById(req.params.id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if requester is owner
    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group owner can invite members' })
    }

    // Find user to invite
    const userToInvite = await User.findOne({ email })
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' })
    }

    const alreadyMember = group.members.some(m => m.user.equals(userToInvite._id))
    if (!alreadyMember) {
      group.members.push({ user: userToInvite._id })
      await group.save()
    }

    await Board.updateMany(
      {
        group: group._id,
        'members.user': userToInvite._id
      },
      {
        $set: { 'members.$.role': 'admin' }
      }
    )
    await Board.updateMany(
      {
        group: group._id,
        'members.user': { $ne: userToInvite._id }
      },
      {
        $push: { members: { user: userToInvite._id, role: 'admin' } }
      }
    )

    await group.populate('owner', 'name email profilePic')
    await group.populate('members.user', 'name email profilePic')

    res.status(200).json({ message: 'Admin added successfully', group })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/groups/:id/remove/:userId
export const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Check if requester is owner
    if (!group.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group owner can remove members' })
    }

    // Can't remove the owner
    if (group.owner.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot remove the group owner' })
    }

    const targetBoards = await Board.find({
      group: group._id,
      'members.user': req.params.userId
    })
    const isAdminOnAnyBoard = targetBoards.some(board =>
      board.members.some(member =>
        member.user.equals(req.params.userId) && member.role === 'admin'
      )
    )

    if (targetBoards.length > 0 && !isAdminOnAnyBoard) {
      return res.status(400).json({ message: 'Writers and editors must be removed from their board member list' })
    }

    group.members = group.members.filter(m => !m.user.equals(req.params.userId))
    await group.save()
    await Board.updateMany(
      { group: group._id },
      { $pull: { members: { user: req.params.userId } } }
    )

    await group.populate('owner', 'name email profilePic')
    await group.populate('members.user', 'name email profilePic')

    res.status(200).json({ message: 'Member removed successfully', group })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// @route  DELETE /api/groups/:id/leave
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Owner can't leave
    if (group.owner.equals(req.user._id)) {
      return res.status(400).json({ message: 'Owner cannot leave the group, transfer ownership first' })
    }

    group.members = group.members.filter(m => !m.user.equals(req.user._id))
    await group.save()

    res.status(200).json({ message: 'Left group successfully' })

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}
