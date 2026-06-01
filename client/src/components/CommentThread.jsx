import { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days <= 6) return `${days}d ago`
  // older than 6 days — show exact date
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const Avatar = ({ name, size = 'sm' }) => {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm' }
  return (
    <div className={`${sizes[size]} rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

const Reply = ({ reply, currentUserId, myRole, onDelete, onEdit }) => {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(reply.body)
  const [saving, setSaving] = useState(false)

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editText.trim() || editText.trim() === reply.body) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onEdit(reply._id, editText.trim())
    setSaving(false)
    setEditing(false)
  }

  const isAuthor = reply.author?._id === currentUserId

  return (
    <div className="flex space-x-2 mt-2 ml-9">
      <Avatar name={reply.author?.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-700">{reply.author?.name}</span>
           <div className="flex items-center space-x-1.5">
                {reply.updatedAt && reply.updatedAt !== reply.createdAt && (
                    <span className="text-xs text-slate-400 italic">(Edited)</span>
             )}
             <span className="text-xs text-slate-400">{timeAgo(reply.createdAt)}</span>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleEdit} className="mt-1">
              <input
                autoFocus
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-sm border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex space-x-2 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditText(reply.body) }}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">{reply.body}</p>
          )}
        </div>

        {!editing && (
          <div className="flex items-center space-x-3 mt-1 ml-1">
            {isAuthor && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Edit
              </button>
            )}
            {(isAuthor || myRole === 'admin') && (
              <button
                onClick={() => onDelete(reply._id)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const Comment = ({ comment, currentUserId, myRole, onDelete, onReply, onEdit }) => {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.body)
  const [saving, setSaving] = useState(false)

  const isAuthor = comment.author?._id === currentUserId

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmitting(true)
    await onReply(comment._id, replyText.trim())
    setReplyText('')
    setShowReplyBox(false)
    setSubmitting(false)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editText.trim() || editText.trim() === comment.body) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onEdit(comment._id, editText.trim())
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex space-x-2">
        <Avatar name={comment.author?.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">{comment.author?.name}</span>
             <div className="flex items-center space-x-1.5">
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-slate-400 italic">(Edited)</span>
                )}
                <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
                </div>
            </div>

            {editing ? (
              <form onSubmit={handleEdit} className="mt-1">
                <input
                  autoFocus
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-sm border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setEditText(comment.body) }}
                    className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{comment.body}</p>
            )}
          </div>

          {!editing && (
            <div className="flex items-center space-x-3 mt-1 ml-1">
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Reply
              </button>
              {isAuthor && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Edit
                </button>
              )}
              {(isAuthor || myRole === 'admin') && (
                <button
                  onClick={() => onDelete(comment._id)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              )}
              {comment.replies?.length > 0 && (
                <span className="text-xs text-slate-400">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}

          {/* Reply input */}
          {showReplyBox && (
            <form onSubmit={handleReply} className="mt-2 flex space-x-2">
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? '...' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => { setShowReplyBox(false); setReplyText('') }}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-2"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Replies — oldest first, top to bottom */}
          {comment.replies?.length > 0 && (
            <div className="mt-1">
              {[...comment.replies]
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .map(reply => (
                  <Reply
                    key={reply._id}
                    reply={reply}
                    currentUserId={currentUserId}
                    myRole={myRole}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommentThread({ articleId, myRole }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchComments()
  }, [articleId])

  const fetchComments = async () => {
    try {
      const res = await axiosInstance.get(`/comments/${articleId}`)
      setComments(res.data.comments)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await axiosInstance.post('/comments', {
        articleId,
        body: newComment.trim()
      })
      setComments(prev => [...prev, { ...res.data.comment, replies: [] }])
      setNewComment('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId, body) => {
    try {
      const res = await axiosInstance.post('/comments', {
        articleId,
        body,
        parentId
      })
      setComments(prev => prev.map(c =>
        c._id === parentId
          ? { ...c, replies: [...(c.replies || []), res.data.comment] }
          : c
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = async (commentId, newBody) => {
    try {
        const res = await axiosInstance.patch(`/comments/${commentId}`, { body: newBody })
        setComments(prev => prev.map(c => {
            if (c._id === commentId) return { ...c, body: res.data.comment.body, updatedAt: res.data.comment.updatedAt }
            return {
                ...c,
                replies: (c.replies || []).map(r =>
                r._id === commentId ? { ...r, body: res.data.comment.body, updatedAt: res.data.comment.updatedAt } : r
                )
            }
        }))
    } catch (err) {
        console.error(err)
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await axiosInstance.delete(`/comments/${commentId}`)
      setComments(prev => {
        const withoutTop = prev.filter(c => c._id !== commentId)
        return withoutTop.map(c => ({
          ...c,
          replies: (c.replies || []).filter(r => r._id !== commentId)
        }))
      })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Comments{comments.length > 0 && (
          <span className="text-slate-400 font-normal ml-1">({comments.length})</span>
        )}
      </h3>

      {loading ? (
        <p className="text-xs text-slate-400 py-4 text-center">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No comments yet. Be the first to comment.</p>
      ) : (
        <div className="mb-4">
          {comments.map(comment => (
            <Comment
              key={comment._id}
              comment={comment}
              currentUserId={user?._id}
              myRole={myRole}
              onDelete={handleDelete}
              onReply={handleReply}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <form onSubmit={handleAddComment} className="flex space-x-2">
        <Avatar name={user?.name} size="sm" />
        <div className="flex-1 flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg disabled:opacity-50 transition-colors font-medium"
          >
            {submitting ? '...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}