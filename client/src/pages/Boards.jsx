import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'
import PageHeader from '../components/PageHeader'

export default function Boards() {
  const { id: groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [group, setGroup] = useState(null)
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      const [groupRes, boardsRes] = await Promise.all([
        axiosInstance.get(`/groups/${groupId}`),
        axiosInstance.get(`/boards/group/${groupId}`)
      ])
      setGroup(groupRes.data.group)
      setBoards(boardsRes.data.boards)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = group?.owner._id === user?._id

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await axiosInstance.post('/boards', { name: boardName, groupId })
      setBoards([...boards, res.data.board])
      setBoardName('')
      setShowCreate(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={group?.name || 'Boards'}
        subtitle={`${group?.members.length || 0} members`}
        actions={
          isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Board
            </button>
          )
        }
      />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
          <Link to="/" className="text-sm text-slate-500 hover:text-indigo-600">Groups</Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-800">{group?.name}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{group?.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{group?.members.length} members</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Board
            </button>
          )}
        </div> */}

        {boards.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-medium">No boards yet</p>
            {isAdmin && <p className="text-sm mt-1">Create a board to get started</p>}
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
                <p className="text-xs text-slate-500 mt-1">{board.members.length} member{board.members.length !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Board</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
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
                  onClick={() => { setShowCreate(false); setError('') }}
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
    </div>
  )
}