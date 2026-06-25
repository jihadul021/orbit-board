import { useCallback, useEffect, useRef, useState } from 'react'
import axiosInstance from '../api/axios'
import ArticleEditor from './ArticleEditor'
import CommentThread from './CommentThread'
import ActivityLog from './ActivityLog'

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
  admin: ['in_review', 'reviewed', 'published'],
}

export default function ArticleModal({ article, myRole, onClose, onSave, isReadOnly = false, currentUserId }) {
  const [title, setTitle] = useState(article.title)
  const [body, setBody] = useState(article.body || '')
  const [status, setStatus] = useState(article.status)
  const [latestArticle, setLatestArticle] = useState(article)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [error, setError] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  const autoSaveTimer = useRef(null)
  const latestBody = useRef(body)
  const latestTitle = useRef(title)
  const latestStatus = useRef(status)
  const isFirstRender = useRef(true)
  const isFirstStatusRender = useRef(true)

  useEffect(() => { latestBody.current = body }, [body])
  useEffect(() => { latestTitle.current = title }, [title])
  useEffect(() => { latestStatus.current = status }, [status])

  useEffect(() => {
    let isMounted = true

    axiosInstance.get(`/articles/${article._id}`)
      .then(res => {
        if (isMounted) setLatestArticle(res.data.article)
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [article._id])

  const backgroundSave = useCallback(async (overrides = {}) => {
    setSaveStatus('saving')
    try {
      await axiosInstance.patch(`/articles/${article._id}`, {
        title: overrides.title ?? latestTitle.current,
        body: overrides.body ?? latestBody.current,
      })

      const currentStatus = overrides.status ?? latestStatus.current
      if (currentStatus !== article.status) {
        if (article.isCopy) {
          await axiosInstance.patch(`/review/copy/${article._id}/status`, {
            status: currentStatus,
          })
        } else {
          await axiosInstance.patch(`/articles/${article._id}/status`, {
            status: currentStatus,
          })
        }
      }

      setSaveStatus('saved')
    } catch (err) {
      setSaveStatus('unsaved')
      setError(err.response?.data?.message || 'Auto-save failed')
    }
  }, [article._id, article.isCopy, article.status])

  useEffect(() => {
    if (isReadOnly) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setSaveStatus('unsaved')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      backgroundSave()
    }, 2000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [backgroundSave, body, isReadOnly, title])

  useEffect(() => {
    if (isReadOnly) return
    if (isFirstStatusRender.current) {
      isFirstStatusRender.current = false
      return
    }
    backgroundSave()
  }, [backgroundSave, isReadOnly, status])

  const handleSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaveStatus('saving')
    try {
      const res = await axiosInstance.patch(`/articles/${article._id}`, {
        title: latestTitle.current,
        body: latestBody.current,
      })

      if (latestStatus.current !== article.status) {
        if (article.isCopy) {
          await axiosInstance.patch(`/review/copy/${article._id}/status`, {
            status: latestStatus.current
          })
        } else {
          await axiosInstance.patch(`/articles/${article._id}/status`, {
            status: latestStatus.current
          })
        }
      }

      setSaveStatus('saved')
      onSave({ ...res.data.article, status: latestStatus.current })
    } catch (err) {
      setSaveStatus('unsaved')
      setError(err.response?.data?.message || 'Failed to save')
    }
  }

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
  const availableStatuses = roleStatuses.includes(status)
    ? roleStatuses
    : [status, ...roleStatuses]

  const canDelete = !isReadOnly && (myRole === 'admin' || article.author?._id === currentUserId)

  // Compare logic
  const compareArticle = latestArticle || article
  const sourceArticle = compareArticle.sourceArticle && typeof compareArticle.sourceArticle === 'object'
    ? compareArticle.sourceArticle
    : null
  const originalVersion = compareArticle.isCopy && sourceArticle
    ? { title: sourceArticle.title, body: sourceArticle.body }
    : { title: compareArticle.title, body: compareArticle.body }
  const editedVersion = compareArticle.isCopy
    ? { title, body }
    : { title: compareArticle.editedTitle || compareArticle.title, body: compareArticle.editedBody }
  const hasEditedVersion = compareArticle.isCopy
    ? Boolean(sourceArticle)
    : compareArticle.editedBody !== null && compareArticle.editedBody !== undefined
  const canCompare = hasEditedVersion && ['reviewed', 'published'].includes(status)
  const editedVersionLabel = status === 'published' ? 'Published Version' : 'Editor Version'
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] mx-4 sm:mx-0 flex flex-col transition-all duration-300 ${compareMode ? 'max-w-7xl' : 'max-w-4xl'}`}>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 flex-shrink-0">
          <span className="text-base font-semibold text-slate-600 truncate mr-0 sm:mr-4">
            {compareMode ? 'Compare Versions' : (title || 'Untitled')}
          </span>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            {canCompare && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-lg border font-medium transition-colors ${
                  compareMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {compareMode ? 'Exit' : 'Compare'}
              </button>
            )}
            {!compareMode && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isReadOnly}
                className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
              >
                {availableStatuses.map(s => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-slate-800 p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 flex flex-col ${compareMode ? 'overflow-y-auto md:overflow-hidden' : 'overflow-hidden'}`}>
          {compareMode ? (
            <div className="flex flex-col md:flex-row md:h-full divide-y md:divide-y-0 md:divide-x divide-gray-200">

              {/* Left — Original */}
              <div className="flex flex-col min-w-0 md:min-h-0 md:flex-1">
                <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Original Version
                  </span>
                </div>
                <div className="p-3 sm:p-4 md:flex-1 md:overflow-y-auto">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">{originalVersion.title}</h2>
                  <ArticleEditor
                    content={originalVersion.body}
                    onChange={() => {}}
                    editable={false}
                  />
                </div>
              </div>

              {/* Right — Edited version */}
              <div className="flex flex-col min-w-0 md:min-h-0 md:flex-1">
                <div className="px-3 sm:px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    {editedVersionLabel}
                  </span>
                </div>
                <div className="p-3 sm:p-4 md:flex-1 md:overflow-y-auto">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">
                    {editedVersion.title}
                  </h2>
                  <ArticleEditor
                    content={editedVersion.body}
                    onChange={() => {}}
                    editable={false}
                  />
                </div>
              </div>

            </div>
          ) : (
            // Normal view
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg px-4 py-3 mb-4">
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
              <CommentThread articleId={article._id} myRole={myRole} boardId={article.board?._id || article.board} />

              {(myRole === 'editor' || myRole === 'admin') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="flex items-center space-x-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showActivity}
                      onChange={(e) => setShowActivity(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Activity Log</span>
                  </label>

                  {showActivity && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-gray-200">
                      <ActivityLog articleId={article._id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!compareMode && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm w-full sm:w-auto">
              <span className="text-slate-500">by {article.author?.name}</span>
              <StatusBadge status={status} />
              <span className={`font-medium ${
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
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 px-3 py-2 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-xs sm:text-sm text-slate-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {!isReadOnly && (
                <button
                  onClick={handleSave}
                  className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
