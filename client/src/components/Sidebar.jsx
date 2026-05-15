import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-blue-100 text-blue-700',
  writer: 'bg-green-100 text-green-700',
}

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

  useEffect(() => {
    if (isBoardPage && params.id) {
      fetchBoard(params.id)
    }
  }, [location.pathname, params.id])

  useEffect(() => {
    if (board?.group) {
      fetchBoards(board.group)
    }
  }, [board])

  const fetchBoard = async (boardId) => {
    try {
      const res = await axiosInstance.get(`/boards/${boardId}`)
      setBoard(res.data.board)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBoards = async (groupId) => {
    try {
      const res = await axiosInstance.get(`/boards/group/${groupId}`)
      setBoards(res.data.boards)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    await axiosInstance.post('/auth/logout')
    logout()
    navigate('/login')
  }

  const myRole = board?.members?.find(m => m.user._id === user?._id)?.role

  return (
    <aside className={`h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        {!collapsed && (
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">O</div>
            <span className="text-white font-bold text-lg">OrbitBoard</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="mx-auto">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={`text-slate-400 hover:text-white p-1 rounded transition-colors ${collapsed ? 'mx-auto mt-2' : ''}`}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">

        {/* Groups Page */}
        {isGroupsPage && (
          <Link
            to="/"
            className="flex items-center px-3 py-2.5 rounded-lg bg-indigo-600 text-white"
          >
            <span className="text-lg">🏠</span>
            {!collapsed && <span className="ml-3 font-medium text-sm">Your Groups</span>}
          </Link>
        )}

        {/* Boards Page */}
        {isBoardsPage && (
          <Link
            to="/"
            className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg">←</span>
            {!collapsed && <span className="ml-3 text-sm">All Groups</span>}
          </Link>
        )}

        {/* Board Page */}
        {isBoardPage && board && (
          <>
            <Link
              to={`/groups/${board.group}`}
              className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <span className="text-lg">←</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-xs ml-2 flex-shrink-0 transition-colors"
              title="Logout"
            >
              ⏻
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-xs transition-colors"
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