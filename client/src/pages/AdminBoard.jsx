import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'
import ArticleModal from '../components/ArticleModal'
import NotificationPanel from '../components/NotificationPanel'

const BackIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-gray-100 text-gray-600',
    completed: 'bg-cyan-100 text-cyan-700',
    in_review: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700',
  }
  const labels = {
    pending: 'Pending',
    completed: 'Completed',
    in_review: 'In Review',
    reviewed: 'Reviewed',
    published: 'Published',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

const COLUMNS = [
  { key: 'published', label: 'Published', color: 'bg-emerald-50 border-emerald-200', headerColor: 'text-emerald-700' },
  { key: 'reviewed', label: 'Reviewed', color: 'bg-blue-50 border-blue-200', headerColor: 'text-blue-700' },
  { key: 'other', label: 'Other', color: 'bg-gray-50 border-gray-200', headerColor: 'text-slate-600' },
]

export default function AdminBoard() {
  const { id: boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [board, setBoard] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [columns, setColumns] = useState({ published: [], reviewed: [], other: [] })
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)

  const loadOverview = useCallback(async () => {
    try {
      const [boardRes, overviewRes] = await Promise.all([
        axiosInstance.get(`/boards/${boardId}`),
        axiosInstance.get(`/boards/${boardId}/admin-overview`)
      ])
      setBoard(boardRes.data.board)
      setGroupName(overviewRes.data.groupName || boardRes.data.board?.name || '')
      setColumns({
        published: overviewRes.data.published,
        reviewed: overviewRes.data.reviewed,
        other: overviewRes.data.other,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOverview()
  }, [loadOverview])

  const handleArticleSave = (updatedArticle) => {
    if (updatedArticle._deleted) {
      setColumns(prev => {
        const next = { ...prev }
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter(a => a._id !== updatedArticle._id)
        }
        return next
      })
      setSelectedArticle(null)
      return
    }

    // Move article to correct column based on new status
    const newStatus = updatedArticle.status
    const targetColumn = newStatus === 'published' ? 'published'
      : newStatus === 'reviewed' ? 'reviewed'
      : 'other'

    setColumns(prev => {
      const next = { published: [...prev.published], reviewed: [...prev.reviewed], other: [...prev.other] }

      // Remove from all columns
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(a => a._id !== updatedArticle._id)
      }

      // Find original article to preserve overview-only metadata
      let original = null
      for (const key of Object.keys(prev)) {
        original = prev[key].find(a => a._id === updatedArticle._id)
        if (original) break
      }

      // Insert updated article into correct column
      next[targetColumn].unshift({
        ...updatedArticle,
        originalBoardName: original?.originalBoardName || '',
        currentListName: original?.currentListName || '',
      })

      return next
    })

    setSelectedArticle(prev => prev ? { ...prev, ...updatedArticle } : null)
    loadOverview()
  }

  const myRole = board?.members.find(m => m.user._id === user?._id)?.role || 'admin'

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-slate-500">Loading...</div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">

      {/* Mobile header */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="flex items-start gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-slate-700"
          >
            <BackIcon />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              {groupName || 'Group'}
            </p>
            <h1 className="mt-0.5 truncate text-base font-semibold text-slate-900">Admin Overview</h1>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden sm:block bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <BackIcon />
          {groupName || 'Back'}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white ring-1 ring-indigo-300">
            ◎
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Admin Overview</h1>
            <p className="mt-0.5 text-sm text-slate-500">Admin overview across every board in this group, organized by status.</p>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-4 p-4 sm:p-6 min-w-max">
          {COLUMNS.map(col => (
            <div key={col.key} className="flex w-72 sm:w-80 flex-col rounded-2xl border bg-white shadow-sm overflow-hidden">

              {/* Column header */}
              <div className={`flex items-center justify-between border-b px-4 py-3 ${col.color}`}>
                <span className={`text-sm font-semibold ${col.headerColor}`}>{col.label}</span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {columns[col.key].length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {columns[col.key].length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">No articles</p>
                ) : (
                  columns[col.key].map(article => (
                    <div
                      key={article._id}
                      onClick={() => setSelectedArticle(article)}
                      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                    >
                      <p className="mb-2 text-sm font-semibold text-slate-800 line-clamp-2">
                        {article.title || 'Untitled'}
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <StatusBadge status={article.status} />
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 truncate max-w-[120px]">
                          {article.originalBoardName}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{article.currentListName}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile notification */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <NotificationPanel collapsed={false} mode="mobile" />
      </div>

      {/* Article modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          myRole={myRole}
          currentUserId={user?._id}
          onClose={() => {
            setSelectedArticle(null)
            loadOverview()
          }}
          onSave={handleArticleSave}
        />
      )}
    </div>
  )
}
