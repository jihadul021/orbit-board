import { useState, useEffect, useRef, useEffectEvent } from 'react'
import axiosInstance from '../api/axios'
import ArticleEditor from './ArticleEditor'

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-gray-100 text-gray-700',
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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

const statusTransitions = {
  writer: ['pending', 'completed', 'published'],
  editor: ['in_review', 'reviewed', 'published'],
  admin: [ 'in_review', 'reviewed', 'published'],
}

export default function ArticleModal({ article, myRole, onClose, onSave, isReadOnly = false, currentUserId }) {
  const [title, setTitle] = useState(article.title)
  const [body, setBody] = useState(article.body || '')
  const [status, setStatus] = useState(article.status)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [error, setError] = useState('')

  const autoSaveTimer = useRef(null)
  const latestBody = useRef(body)
  const latestTitle = useRef(title)
  const latestStatus = useRef(status)
  const isFirstRender = useRef(true)
  const isFirstStatusRender = useRef(true)

  // Keep refs in sync
  useEffect(() => { latestBody.current = body }, [body])
  useEffect(() => { latestTitle.current = title }, [title])
  useEffect(() => { latestStatus.current = status }, [status])

  // background save — does NOT call onSave, does NOT close modal
  async function backgroundSave(overrides = {}) {
    setSaveStatus('saving')
    try {
      const res = await axiosInstance.patch(`/articles/${article._id}`, {
        title: overrides.title ?? latestTitle.current,
        body: overrides.body ?? latestBody.current,
      })

      const currentStatus = overrides.status ?? latestStatus.current
      let updatedArticle = res.data.article
      if (currentStatus !== article.status) {
        const statusRes = await axiosInstance.patch(`/articles/${article._id}/status`, {
          status: currentStatus,
        })
        updatedArticle = statusRes.data.article
      }
      onSave(updatedArticle)
      setSaveStatus('saved')
    } catch (err) {
      setSaveStatus('unsaved')
      setError(err.response?.data?.message || 'Auto-save failed')
    }
  }

  const runBackgroundSave = useEffectEvent((overrides = {}) => {
    backgroundSave(overrides)
  })

  // Auto-save on body or title change
  useEffect(() => {
    if (isReadOnly) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setSaveStatus('unsaved')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      runBackgroundSave()
    }, 2000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [body, title, isReadOnly])

  // Save immediately on status change
  useEffect(() => {
    if (isReadOnly) return
    if (isFirstStatusRender.current) {
      isFirstStatusRender.current = false
      return
    }
    runBackgroundSave()
  }, [status, isReadOnly])

  // manual save — saves and updates the card in board
  const handleSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaveStatus('saving')
    try {
      const res = await axiosInstance.patch(`/articles/${article._id}`, {
        title: latestTitle.current,
        body: latestBody.current,
      })

      if (latestStatus.current !== article.status) {
        await axiosInstance.patch(`/articles/${article._id}/status`, {
          status: latestStatus.current,
        })
      }

      setSaveStatus('saved')
      onSave({ ...res.data.article, status: latestStatus.current })
    } catch (err) {
      setSaveStatus('unsaved')
      setError(err.response?.data?.message || 'Failed to save')
    }
  }

  // close — background save first, then close
    const handleClose = async () => {
    if (isReadOnly) {
      onClose()
      return
    }

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    await backgroundSave({
      title: latestTitle.current,
      body: latestBody.current,
      status: latestStatus.current,
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this article?')) return
    try {
      await axiosInstance.delete(`/articles/${article._id}`)
      onSave({ ...article, _deleted: true })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  const roleStatuses = statusTransitions[myRole] || []
  const availableStatuses = roleStatuses.includes(status) ? roleStatuses : [status, ...roleStatuses]
  const canDelete = !isReadOnly && (myRole === 'admin' || article.author?._id === currentUserId)

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-600 truncate mr-4">
            {title || 'Untitled'}
          </span>
          <div className="flex items-center space-x-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isReadOnly}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {availableStatuses.map(s => (
                <option key={s} value={s}>
                  {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-slate-800 p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Article Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              readOnly={isReadOnly}
              placeholder="Article title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-slate-50"
            />
          </div>
          <ArticleEditor
            content={body}
            onChange={setBody}
            editable={!isReadOnly}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">by {article.author?.name}</span>
            <StatusBadge status={status} />
            <span className={`text-xs font-medium ${
              saveStatus === 'saved' ? 'text-emerald-600' :
              saveStatus === 'saving' ? 'text-amber-500' :
              'text-slate-400'
            }`}>
              {isReadOnly ? 'Read only' :
               saveStatus === 'saved' ? '✓ Saved' :
               saveStatus === 'saving' ? 'Saving...' :
               '● Unsaved changes'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700 px-4 py-2 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-sm text-slate-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            {!isReadOnly && (
              <button
                onClick={handleSave}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
