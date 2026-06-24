import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'
import NotificationPanel from './NotificationPanel'

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-blue-100 text-blue-700',
  writer: 'bg-green-100 text-green-700',
}

const ChevronLeftIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRightIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const GridIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
)

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const params = useParams()

  const [boards, setBoards] = useState([])
  const [board, setBoard] = useState(null)

  const isGroupsPage = location.pathname === '/'
  const isBoardsPage = location.pathname.startsWith('/groups/')
  const isBoardPage = location.pathname.startsWith('/boards/')

  const fetchBoard = useCallback(async (boardId) => {
    try {
      const res = await axiosInstance.get(`/boards/${boardId}`)
      setBoard(res.data.board)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchBoards = useCallback(async (groupId) => {
    try {
      const res = await axiosInstance.get(`/boards/group/${groupId}`)
      setBoards(res.data.boards)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    if (isBoardPage && params.id) {
      queueMicrotask(() => fetchBoard(params.id))
    }
  }, [fetchBoard, isBoardPage, location.pathname, params.id])

  useEffect(() => {
    if (board?.group) {
      queueMicrotask(() => fetchBoards(board.group))
    }
  }, [board, fetchBoards])

  const handleLogout = async () => {
    await axiosInstance.post('/auth/logout')
    logout()
    navigate('/login')
  }

  const myRole = board?.members?.find(m => m.user._id === user?._id)?.role

  return (
    <aside className={`hidden md:flex h-screen bg-slate-900 text-slate-300 flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo + Toggle */}
      <div className={`border-b border-slate-800 ${collapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
        {!collapsed && (
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard" className="flex min-w-0 items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">O</div>
              <span className="text-white font-bold text-lg truncate">OrbitBoard</span>
            </Link>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon />
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-3">
            <Link to="/dashboard">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
            </Link>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">

        {/* Groups Page */}
        {isGroupsPage && (
          <Link
            to="/dashboard"
            className={`flex items-center rounded-lg bg-indigo-600 text-white ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
            title="Your Groups"
          >
            <GridIcon className="w-4 h-4" />
            {!collapsed && <span className="ml-3 font-medium text-sm">Your Groups</span>}
          </Link>
        )}

        {/* Boards Page */}
        {isBoardsPage && (
            <Link
              to="/dashboard"
              className={`flex items-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
              title="Back to groups"
            >
            <ChevronLeftIcon className="w-4 h-4" />
            {!collapsed && <span className="ml-3 text-sm">All Groups</span>}
          </Link>
        )}

        {/* Board Page */}
        {isBoardPage && board && (
          <>
            <Link
              to={`/groups/${board.group}`}
              className={`flex items-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}`}
              title="Back to boards"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              {!collapsed && <span className="ml-3 text-sm">All Boards</span>}
            </Link>

            {!collapsed && (
              <div className="px-3 py-2 mt-2 space-y-4">

                {/* Board Name */}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Board</p>
                  <p className="text-white font-semibold text-sm">{board.name}</p>
                </div>

                {/* My Role */}
                {myRole && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">My Role</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[myRole]}`}>
                      {myRole}
                    </span>
                  </div>
                )}

                {/* Other Boards */}
                {boards.length > 1 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Other Boards</p>
                    <div className="space-y-1">
                      {boards
                        .filter(b => b._id !== board._id)
                        .map(b => (
                          <Link
                            key={b._id}
                            to={`/boards/${b._id}`}
                            className="flex items-center px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                          >
                            <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{b.name}</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed ? ( 
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <Link to="/profile" className="text-sm text-white font-medium truncate hover:text-indigo-300 transition-colors block">
                  {user?.name}
                </Link>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <NotificationPanel collapsed={collapsed} />
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                title="Logout"
              >
                ⏻
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <NotificationPanel collapsed={collapsed} />
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
              title="Logout"
            >
              ⏻
            </button>
          </div>
        )}
      </div>

    </aside>
  )
}
