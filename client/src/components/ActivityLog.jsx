import { useCallback, useEffect, useState } from 'react'
import axiosInstance from '../api/axios'

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  const hours = Math.floor(seconds / 3600)

  if (hours < 24) {
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${hours}h ago`
  }

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const actionLabel = (log) => {
  switch (log.action) {
    case 'article_created':
      return 'created this article'
    case 'article_edited':
      return 'edited this article'
    case 'status_changed':
      return (
        <span>
          changed status from{' '}
          <span className="font-medium text-slate-700">
            {log.meta?.from?.replace('_', ' ')}
          </span>
          {' '}to{' '}
          <span className="font-medium text-slate-700">
            {log.meta?.to?.replace('_', ' ')}
          </span>
        </span>
      )
    case 'comment_added':
      return 'added a comment'
    case 'comment_deleted':
      return 'deleted a comment'
    case 'picked_for_review':
      return 'sent this article for review'
    case 'article_copied':
      return (
        <span>
          copied this article for review to <span className="font-medium text-slate-700">{log.meta?.targetBoardName}</span>
        </span>
      )
    case 'copy_deleted':
      return 'deleted the review copy'
    // case 'selected_for_review':
    //   return (
    //     <span>
    //       was picked for review by <span className="font-medium text-slate-700">{log.meta?.editorName}</span>
    //     </span>
    //   )
    default:
      return log.action
  }
}

export default function ActivityLog({ articleId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/activity/${articleId}`)
      setLogs(res.data.logs)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('forbidden')
      } else {
        setError('failed')
      }
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    queueMicrotask(() => fetchLogs())
  }, [fetchLogs])

  if (error === 'forbidden') return null
  if (error === 'failed') return (
    <p className="text-xs text-red-400 mt-2">Failed to load activity log.</p>
  )

  if (loading) return (
    <p className="text-xs text-slate-400 mt-2 text-center">Loading activity...</p>
  )

  if (logs.length === 0) return (
    <p className="text-xs text-slate-400 mt-2 text-center">No activity recorded yet.</p>
  )

  return (
    <div className="space-y-3 mt-2">
      {logs.map((log) => (
        <div key={log._id} className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
            {log.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">{log.user?.name}</span>
              {' '}
              {actionLabel(log)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{timeAgo(log.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
