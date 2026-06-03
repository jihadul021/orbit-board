import { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'

export default function PickForReviewModal({ article, groupId, boardId, onClose, onPicked }) {
  const [boards, setBoards] = useState([])
  const [lists, setLists] = useState([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const [selectedList, setSelectedList] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingLists, setLoadingLists] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEditorBoards()
  }, [groupId, boardId])

  useEffect(() => {
    if (selectedBoard) fetchLists(selectedBoard)
  }, [selectedBoard])

  const fetchEditorBoards = async () => {
    try {
      const res = await axiosInstance.get('/review/boards', {
        params: {
          groupId,
          currentBoardId: boardId
        }
      })
      setBoards(res.data.boards)
    } catch (err) {
      setError('Failed to load editor boards')
    } finally {
      setLoading(false)
    }
  }

  const fetchLists = async (boardId) => {
    setLoadingLists(true)
    setSelectedList('')
    try {
      const res = await axiosInstance.get(`/lists/board/${boardId}`)
      setLists(res.data.lists)
    } catch (err) {
      setError('Failed to load lists')
    } finally {
      setLoadingLists(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBoard || !selectedList) return
    setSubmitting(true)
    setError('')
    try {
      const res = await axiosInstance.post('/review/pick', {
        articleId: article._id,
        targetBoardId: selectedBoard,
        targetListId: selectedList
      })
      onPicked(res.data.copy)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pick article')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Send to Editor Board</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-64">{article.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-slate-800 p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-400 text-center py-4">Loading your editor boards...</p>
          ) : boards.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              You are not an editor or admin on any board.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Editor Board
                </label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Choose a board...</option>
                  {boards.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} — {b.group?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select List
                </label>
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  required
                  disabled={!selectedBoard || loadingLists}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-slate-400"
                >
                  <option value="">
                    {loadingLists ? 'Loading lists...' : 'Choose a list...'}
                  </option>
                  {lists.map(l => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedBoard || !selectedList}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send to Review'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div> 
    </div>
  )
}