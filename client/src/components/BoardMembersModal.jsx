import { useState } from 'react'
import axiosInstance from '../api/axios'

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-blue-100 text-blue-700',
  writer: 'bg-green-100 text-green-700',
}

export default function BoardMembersModal({ board, myRole, onClose, onUpdate }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('writer')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState(board.members)

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAdding(true)
    setError('')
    try {
      const res = await axiosInstance.post(`/boards/${board._id}/members`, { email, role })
      setMembers(res.data.board.members)
      onUpdate(res.data.board)
      setEmail('')
      setRole('writer')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axiosInstance.patch(`/boards/${board._id}/members/${userId}/role`, { role: newRole })
      setMembers(res.data.board.members)
      onUpdate(res.data.board)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role')
    }
  }

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member from the board?')) return
    try {
      const res = await axiosInstance.delete(`/boards/${board._id}/members/${userId}`)
      setMembers(res.data.board.members)
      onUpdate(res.data.board)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const isAdmin = myRole === 'admin'

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Board Members</h2>
            <p className="text-xs text-slate-500 mt-0.5">{board.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-slate-800 p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Add Member — admin only */}
          {isAdmin && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Member</h3>
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex space-x-3">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="writer">Writer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={adding}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Members ({members.length})
            </h3>
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.user.name}</p>
                      <p className="text-xs text-slate-500">{m.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isAdmin ? (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                          <option value="writer">Writer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemove(m.user._id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[m.role]}`}>
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}