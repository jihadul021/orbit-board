import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Boards() {
  const { id: groupId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [group, setGroup] = useState(null)
  const [boards, setBoards] = useState([])
  const [closedBoards, setClosedBoards] = useState([])
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

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [groupRes, boardsRes, closedBoardsRes] = await Promise.all([
          axiosInstance.get(`/groups/${groupId}`),
          axiosInstance.get(`/boards/group/${groupId}`),
          axiosInstance.get(`/boards/group/${groupId}/closed`)
        ])

        if (!isMounted) return

        setGroup(groupRes.data.group)
        setBoards(boardsRes.data.boards)
        setClosedBoards(closedBoardsRes.data.boards)
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
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { email: memberEmail })
      setGroup(res.data.group)
      setMemberEmail('')
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the group?')) return
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`)
      setGroup(res.data.group)
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2 text-sm">
          <Link to="/" className="text-slate-400 hover:text-indigo-600 transition-colors">Groups</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">
            {isClosedBoardsPage ? 'Closed Boards' : group?.name}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMembers(true)}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-slate-700 transition-colors"
          >
            👥 Members ({group?.members.length || 0})
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(prev => !prev)}
              className="text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 text-slate-700 transition-colors"
            >
              Settings
            </button>
            {showSettingsMenu && (
              <div className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white shadow-lg z-20 p-2">
                {isOwner && (
                  <button
                    onClick={openRenameGroup}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                  >
                    Change Group Name
                  </button>
                )}
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
          {isOwner && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Board
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {!isClosedBoardsPage && boards.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg font-medium">No boards yet</p>
              {isOwner && <p className="text-sm mt-1">Create a board to get started</p>}
            </div>
          ) : isClosedBoardsPage ? (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Closed Boards</h2>
                <p className="text-sm text-slate-500">Boards stay here until a board admin reopens them.</p>
              </div>

              {closedBoards.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl px-6 py-10 text-center text-slate-400">
                  No closed boards yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {closedBoards.map((board) => {
                    const myBoardRole = board.members.find(m => m.user._id === user?._id)?.role
                    const isBoardAdmin = myBoardRole === 'admin'

                    return (
                      <div
                        key={board._id}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                      >
                        <div
                          onClick={() => navigate(`/boards/${board._id}`)}
                          className="cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
                            {board.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-800">{board.name}</h3>
                            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                              Closed
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {isBoardAdmin && (
                          <button
                            onClick={() => handleReopenBoard(board._id)}
                            disabled={reopeningBoardId === board._id}
                            className="mt-4 text-sm text-emerald-700 hover:text-emerald-800 font-medium disabled:opacity-50 transition-colors"
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Active Boards</h2>
                    <p className="text-sm text-slate-500">Open boards your team can keep working in.</p>
                  </div>
                </div>

                {boards.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-xl px-6 py-10 text-center text-slate-400">
                    No active boards right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boards.map((board) => (
                      <div
                        key={board._id}
                        onClick={() => navigate(`/boards/${board._id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
                      >
                        <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
                          {board.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-semibold text-slate-800">{board.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                        </p>
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

              {/* Add Member — owner only */}
              {isOwner && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Member</h3>
                  <form onSubmit={handleAddMember} className="flex space-x-3">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addingMember}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {addingMember ? 'Adding...' : 'Add'}
                    </button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Members ({group?.members.length})
                </h3>
                <div className="space-y-3">
                  {group?.members.map((m) => (
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
                            {m.user._id === group?.owner._id && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Owner</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{m.user.email}</p>
                        </div>
                      </div>

                      {/* Remove — owner only, can't remove self */}
                      {isOwner && m.user._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveMember(m.user._id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
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

    </div>
  )
} 
