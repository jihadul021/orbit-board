import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const typeMeta = (type) => {
  switch (type) {
    case 'article_picked':
      return { label: 'P', className: 'bg-blue-50 text-blue-700 ring-blue-100' }
    case 'status_changed':
      return { label: 'S', className: 'bg-amber-50 text-amber-700 ring-amber-100' }
    case 'comment_added':
      return { label: 'C', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' }
    case 'mentioned':
      return { label: '@', className: 'bg-indigo-50 text-indigo-700 ring-indigo-100' }
    case 'added_to_board':
      return { label: 'A', className: 'bg-violet-50 text-violet-700 ring-violet-100' }
    case 'article_returned':
      return { label: 'R', className: 'bg-rose-50 text-rose-700 ring-rose-100' }
    default:
      return { label: 'N', className: 'bg-slate-100 text-slate-700 ring-slate-200' }
  }
}

export default function NotificationPanel({ collapsed }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)
  const pollRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/notifications')
      setUnreadCount(res.data.unreadCount)
      setNotifications(res.data.notifications)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => fetchUnreadCount())
    pollRef.current = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(pollRef.current)
  }, [fetchUnreadCount])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = async () => {
    setOpen(!open)
    if (!open) {
      setLoading(true)
      try {
        const res = await axiosInstance.get('/notifications')
        setNotifications(res.data.notifications)
        setUnreadCount(res.data.unreadCount)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.patch('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await axiosInstance.patch(`/notifications/${notification._id}/read`)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        )
      } catch (err) {
        console.error(err)
      }
    }

    setOpen(false)

    if (notification.board && notification.article) {
      navigate(`/boards/${notification.board}?articleId=${notification.article}`)
    } else if (notification.board) {
      navigate(`/boards/${notification.board}`)
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
          open
            ? 'border-indigo-500/50 bg-indigo-500/15 text-white'
            : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
        }`}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`fixed bottom-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 ${collapsed ? 'left-20' : 'left-72'}`}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'Everything is up to date'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close notifications"
              >
                ×
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">New mentions, replies, and article updates will show here.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 ${
                    !notification.isRead ? 'bg-indigo-50/45' : 'bg-white'
                  }`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${typeMeta(notification.type).className}`}>
                    {typeMeta(notification.type).label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-5 text-slate-700">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
