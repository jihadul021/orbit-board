const getUserId = (user) => user?._id || user

export const idsEqual = (left, right) => {
  const leftId = getUserId(left)
  const rightId = getUserId(right)

  if (leftId?.equals) return leftId.equals(rightId)
  if (rightId?.equals) return rightId.equals(leftId)

  return String(leftId) === String(rightId)
}

export const isGroupAdmin = (group, userId) => (
  group.members.some(member => member.role === 'admin' && idsEqual(member.user, userId))
)

export const getGroupAdminBoardMembers = (group) => (
  group.members
    .filter(member => member.role === 'admin')
    .map(member => ({ user: getUserId(member.user), role: 'admin' }))
)

export const ensureGroupAdminsOnBoard = (board, group) => {
  let changed = false

  getGroupAdminBoardMembers(group).forEach(adminMember => {
    const boardMember = board.members.find(member => idsEqual(member.user, adminMember.user))

    if (boardMember) {
      if (boardMember.role !== 'admin') {
        boardMember.role = 'admin'
        changed = true
      }
      return
    }

    board.members.push(adminMember)
    changed = true
  })

  return changed
}
