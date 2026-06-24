import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'
import NotificationPanel from '../components/NotificationPanel'

const BackIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ArrowRightIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

const UsersIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const MoreIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

export default function Boards() {
  const { id: groupId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [group, setGroup] = useState(null)
  const [boards, setBoards] = useState([])
  const [closedBoards, setClosedBoards] = useState([])
  const [adminBoard, setAdminBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reopeningBoardId, setReopeningBoardId] = useState('')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showRenameGroup, setShowRenameGroup] = useState(false)
  const [groupSettingsError, setGroupSettingsError] = useState('')
  const [groupSettingsLoading, setGroupSettingsLoading] = useState(false)
  const [groupNameInput, setGroupNameInput] = useState('')

  // Board creation
  const [showCreate, setShowCreate] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const [boardError, setBoardError] = useState('')

  // Members modal
  const [showMembers, setShowMembers] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState('')
  const isClosedBoardsPage = location.pathname.endsWith('/closed')
  const allGroupBoards = [...boards, ...closedBoards]

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [groupRes, boardsRes, closedBoardsRes, adminBoardRes] = await Promise.all([
          axiosInstance.get(`/groups/${groupId}`),
          axiosInstance.get(`/boards/group/${groupId}`),
          axiosInstance.get(`/boards/group/${groupId}/closed`),
          axiosInstance.get(`/boards/group/${groupId}/admin-board`).catch(() => ({ data: { board: null } }))
        ]) 

        if (!isMounted) return

        setGroup(groupRes.data.group)
        setBoards(boardsRes.data.boards)
        setClosedBoards(closedBoardsRes.data.boards)
        setAdminBoard(adminBoardRes.data.board)
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [groupId])

  const isOwner = group?.owner._id === user?._id
  const isAdminOnAnyBoard = allGroupBoards.some(board =>
    board.members.some(member => member.user._id === user?._id && member.role === 'admin')
  )
  const isGroupAdmin = isOwner ||
    group?.members.some(member => member.user._id === user?._id && member.role === 'admin') ||
    isAdminOnAnyBoard
  const getGroupMemberLabel = (userId) => {
    if (group?.owner._id === userId) return 'Owner'
    const groupMember = group?.members.find(member => member.user._id === userId)
    if (groupMember?.role === 'admin') return 'Admin'

    const boardRoles = allGroupBoards
      .flatMap(board => board.members)
      .filter(member => member.user._id === userId)
      .map(member => member.role)

    if (boardRoles.includes('admin')) return 'Admin'
    if (boardRoles.includes('editor')) return 'Editor'
    if (boardRoles.includes('writer')) return 'Writer'
    return 'No board'
  }
  const canRemoveFromGroup = (member) => {
    if (!isOwner || member.user._id === user?._id || member.user._id === group?.owner._id) return false
    const label = getGroupMemberLabel(member.user._id)
    return label === 'Admin' || label === 'No board'
  }

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await axiosInstance.post('/boards', { name: boardName, groupId })
      setBoards([...boards, res.data.board])
      setBoardName('')
      setShowCreate(false)
    } catch (err) {
      setBoardError(err.response?.data?.message || 'Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAddingMember(true)
    setMemberError('')
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/invite`, { email: memberEmail })
      setGroup(res.data.group)
      const [boardsRes, closedBoardsRes] = await Promise.all([
        axiosInstance.get(`/boards/group/${groupId}`),
        axiosInstance.get(`/boards/group/${groupId}/closed`)
      ])
      setBoards(boardsRes.data.boards)
      setClosedBoards(closedBoardsRes.data.boards)
      setMemberEmail('')
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the group and every board in this group?')) return
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/remove/${userId}`)
      setGroup(res.data.group)
      setBoards(prev => prev.map(board => ({
        ...board,
        members: board.members.filter(member => member.user._id !== userId)
      })))
      setClosedBoards(prev => prev.map(board => ({
        ...board,
        members: board.members.filter(member => member.user._id !== userId)
      })))
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleReopenBoard = async (boardId) => {
    setReopeningBoardId(boardId)
    try {
      const res = await axiosInstance.patch(`/boards/${boardId}/reopen`)
      const reopenedBoard = res.data.board
      setClosedBoards(prev => prev.filter(board => board._id !== boardId))
      if (!isClosedBoardsPage) {
        setBoards(prev => [...prev, reopenedBoard])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setReopeningBoardId('')
    }
  }

  const handleRenameGroup = async (e) => {
    e.preventDefault()
    setGroupSettingsLoading(true)
    setGroupSettingsError('')
    try {
      const res = await axiosInstance.patch(`/groups/${groupId}`, { name: groupNameInput })
      setGroup(res.data.group)
      setShowRenameGroup(false)
      setShowSettingsMenu(false)
    } catch (err) {
      setGroupSettingsError(err.response?.data?.message || 'Failed to update group name')
    } finally {
      setGroupSettingsLoading(false)
    }
  }

  const openRenameGroup = () => {
    setGroupSettingsError('')
    setGroupNameInput(group?.name || '')
    setShowRenameGroup(true)
    setShowSettingsMenu(false)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-slate-500">Loading...</div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <Link
              to="/dashboard"
              className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-slate-700 transition-colors hover:bg-gray-50"
              aria-label="Back to groups"
            >
              <BackIcon />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {isClosedBoardsPage ? 'Closed boards' : 'Group boards'}
              </p>
              <h1 className="truncate text-base font-semibold text-slate-900">
                {group?.name || 'Loading group'}
              </h1>
              <p className="mt-1 max-h-8 overflow-hidden text-xs text-slate-500">
                {isClosedBoardsPage
                  ? 'Review inactive boards and reopen them when work resumes.'
                  : isGroupAdmin
                    ? `${boards.length} active board${boards.length === 1 ? '' : 's'}`
                    : `${boards.length} board${boards.length === 1 ? '' : 's'} available to you.`}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {isGroupAdmin && (
                <button
                  onClick={() => setShowMembers(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-700 transition-colors hover:bg-gray-50"
                  aria-label="Members"
                >
                  <UsersIcon />
                </button>
              )}

            {isGroupAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(prev => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-700 transition-colors hover:bg-gray-50"
                  aria-label="Group options"
                >
                  <MoreIcon />
                </button>
                {showSettingsMenu && (
                  <div className="absolute right-0 top-11 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    {isGroupAdmin && (
                      <button
                        onClick={openRenameGroup}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-gray-50"
                      >
                        Change Group Name
                      </button>
                    )}
                    {isGroupAdmin && (
                      <button
                        onClick={() => {
                          navigate(isClosedBoardsPage ? `/groups/${groupId}` : `/groups/${groupId}/closed`)
                          setShowSettingsMenu(false)
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-gray-50"
                      >
                        {isClosedBoardsPage ? 'Active Boards' : 'Closed Boards'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
          {isGroupAdmin && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
              >
                + New Board
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:block">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="min-w-0">
          <Link
            to="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
          >
            <BackIcon className="w-4 h-4" />
            Groups
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700 ring-1 ring-indigo-100">
              {(group?.name || 'G').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-900">
                {isClosedBoardsPage ? 'Closed Boards' : group?.name}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {isClosedBoardsPage
                  ? 'Review inactive boards and reopen them when work resumes.'
                  : isGroupAdmin
                    ? `${boards.length} active board${boards.length === 1 ? '' : 's'}.`
                    : `${boards.length} board${boards.length === 1 ? '' : 's'} available to you.`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center space-x-3">
          {isGroupAdmin && (
            <button
              onClick={() => setShowMembers(true)}
              className="inline-flex items-center gap-2 text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-slate-700 transition-colors"
            >
              <UsersIcon />
              Members ({group?.members.length || 0})
            </button>
          )}
          {isGroupAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(prev => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-slate-700 transition-colors hover:bg-gray-50"
                aria-label="Group options"
              >
                <MoreIcon />
              </button>
              {showSettingsMenu && (
                <div className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white shadow-lg z-20 p-2">
                  <button
                    onClick={openRenameGroup}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                  >
                    Change Group Name
                  </button>
                  <button
                    onClick={() => {
                      navigate(isClosedBoardsPage ? `/groups/${groupId}` : `/groups/${groupId}/closed`)
                      setShowSettingsMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                  >
                    {isClosedBoardsPage ? 'Back to Boards' : 'Closed Boards'}
                  </button>
                </div>
              )}
            </div>
          )}
          {isGroupAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
            >
              + New Board
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-8">
          {/* Admin Overview Board — admins only, pinned at top */}
          {isGroupAdmin && adminBoard && !isClosedBoardsPage && (
            <section className="mb-6 sm:mb-8">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-slate-900">Admin Overview</h2>
                <p className="text-sm text-slate-500">Full visibility across all boards in this group.</p>
              </div>
              <div
                onClick={() => navigate(`/boards/${adminBoard._id}/admin-overview`)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md sm:p-5 max-w-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-lg text-white">
                  ◎
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-indigo-800">Admin Overview</h3>
                  <p className="mt-0.5 text-xs text-indigo-500">View all articles across all boards</p>
                </div>
              </div>
            </section>
          )}

          {!isClosedBoardsPage && boards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-800">No boards yet</p>
              {isGroupAdmin && <p className="text-sm mt-1 text-slate-500">Create a board to start organizing work for this group.</p>}
            </div>
          ) : isClosedBoardsPage ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Closed Boards</h2>
                  <p className="text-sm text-slate-500">Boards stay here until a board admin reopens them.</p>
                </div>
                <button
                  onClick={() => navigate(`/groups/${groupId}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50"
                >
                  <BackIcon />
                  Active boards
                </button>
              </div>

              {closedBoards.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
                  <p className="font-medium text-slate-700">No closed boards yet</p>
                  <p className="mt-1 text-sm text-slate-500">Closed boards will appear here for future reference.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {closedBoards.map((board) => {
                    const myBoardRole = board.members.find(m => m.user._id === user?._id)?.role
                    const isBoardAdmin = myBoardRole === 'admin'

                    return (
                      <div
                        key={board._id}
                        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:block sm:p-5"
                      >
                        <div
                          onClick={() => navigate(`/boards/${board._id}`)}
                          className="min-w-0 cursor-pointer flex-1 sm:block"
                        >
                          <div className="flex items-center justify-between gap-3 sm:mb-4 sm:block">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-700 ring-1 ring-slate-200">
                              {board.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                              Closed
                            </span>
                          </div>
                          <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors sm:whitespace-normal">{board.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {isBoardAdmin && (
                          <button
                            onClick={() => handleReopenBoard(board._id)}
                            disabled={reopeningBoardId === board._id}
                            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 sm:mt-4 sm:w-full sm:text-sm"
                          >
                            {reopeningBoardId === board._id ? 'Reopening...' : 'Reopen Board'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ) : (
            <div className="space-y-10">
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Boards</h2>
                    <p className="text-sm text-slate-500">Open boards your team can keep working in.</p>
                  </div>
                  {isGroupAdmin && closedBoards.length > 0 && (
                    <button
                      onClick={() => navigate(`/groups/${groupId}/closed`)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50"
                    >
                      View closed
                    </button>
                  )}
                </div>

                {boards.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
                    <p className="font-medium text-slate-700">No active boards right now</p>
                    <p className="mt-1 text-sm text-slate-500">Create or reopen a board to continue.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                    {boards.map((board) => (
                      <div
                        key={board._id}
                        onClick={() => navigate(`/boards/${board._id}`)}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md sm:block sm:p-5"
                      >
                        <div className="flex items-center justify-between gap-3 sm:mb-4 sm:block">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-lg font-bold text-indigo-700 ring-1 ring-indigo-100">
                            {board.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                            Active
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 sm:block">
                          <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors sm:whitespace-normal">{board.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                          {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                          </p>
                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] font-medium text-slate-400 sm:mt-5 sm:text-xs">
                            <span>Open board</span>
                            <ArrowRightIcon className="w-4 h-4 text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Create Board Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Board</h2>
            {boardError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {boardError}
              </div>
            )}
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Board Name</label>
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Tech Section"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setBoardError('') }}
                  className="flex-1 border border-gray-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Group Members</h2>
                <p className="text-xs text-slate-500 mt-0.5">{group?.name}</p>
              </div>
              <button
                onClick={() => { setShowMembers(false); setMemberError('') }}
                className="text-gray-400 hover:text-slate-800 p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {memberError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {memberError}
                </div>
              )}

              {/* Add Admin — owner only */}
              {isOwner && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Add Admin</h3>
                  <p className="text-xs text-slate-500 mb-3">Use this to add or promote a group admin. Board writers and editors are added from a board.</p>
                  <form onSubmit={handleAddMember} className="flex space-x-3">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="Admin email address"
                      required
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addingMember}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {addingMember ? 'Adding...' : 'Add Admin'}
                    </button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Group Members ({group?.members.length})
                </h3>
                <div className="space-y-3">
                  {group?.members.map((m) => {
                    const memberLabel = getGroupMemberLabel(m.user._id)
                    const labelClass = memberLabel === 'Owner'
                      ? 'bg-amber-100 text-amber-700'
                      : memberLabel === 'Admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'

                    return (
                    <div
                      key={m.user._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {m.user.name}
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${labelClass}`}>
                              {memberLabel}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">{m.user.email}</p>
                        </div>
                      </div>

                      {canRemoveFromGroup(m) ? (
                        <button
                          onClick={() => handleRemoveMember(m.user._id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      ) : isOwner && memberLabel !== 'Owner' ? (
                        <span className="text-xs text-slate-400">Manage on board</span>
                      ) : null}
                    </div>
                    )
                  })}
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => { setShowMembers(false); setMemberError('') }}
                className="w-full border border-gray-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {showRenameGroup && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Change Group Name</h2>
            {groupSettingsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {groupSettingsError}
              </div>
            )}
            <form onSubmit={handleRenameGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowRenameGroup(false); setGroupSettingsError('') }}
                  className="flex-1 border border-gray-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={groupSettingsLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {groupSettingsLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        <div className="fixed bottom-4 right-4 z-40 sm:hidden">
          <NotificationPanel collapsed={false} mode="mobile" />
        </div>

    </div>
  )
} 
