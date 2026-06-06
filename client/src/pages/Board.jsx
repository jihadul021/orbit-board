import { useEffect, useState } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import useAuthStore from '../store/authStore'
import ArticleModal from '../components/ArticleModal'
import BoardMembersModal from '../components/BoardMembersModal'
import PickForReviewModal from '../components/PickForReviewModal'

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

export default function Board() {
  const { id: boardId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [articles, setArticles] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showAddList, setShowAddList] = useState(false)
  const [listName, setListName] = useState('')
  const [showAddArticle, setShowAddArticle] = useState(null)
  const [articleTitle, setArticleTitle] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [boardActionLoading, setBoardActionLoading] = useState('')
  const [boardActionError, setBoardActionError] = useState('')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showBoardMenu, setShowBoardMenu] = useState(false)
  const [showRenameBoard, setShowRenameBoard] = useState(false)
  const [boardNameInput, setBoardNameInput] = useState('')
  const [listMenuOpenId, setListMenuOpenId] = useState('')
  const [showRenameList, setShowRenameList] = useState(false)
  const [selectedList, setSelectedList] = useState(null)
  const [listNameInput, setListNameInput] = useState('')
  const [listActionLoading, setListActionLoading] = useState('')
  const [listActionError, setListActionError] = useState('')
  const isArchivedView = location.pathname.endsWith('/archived')
  const [showPickModal, setShowPickModal] = useState(null) 

  const fetchBoard = async () => {
    try {
      const [boardRes, listsRes] = await Promise.all([
        axiosInstance.get(`/boards/${boardId}`),
        axiosInstance.get(isArchivedView ? `/lists/board/${boardId}/archived` : `/lists/board/${boardId}`)
      ])
      const fetchedBoard = boardRes.data.board
      const fetchedLists = listsRes.data.lists

      const articleMap = {}
      await Promise.all(
        fetchedLists.map(async (list) => {
          const res = await axiosInstance.get(`/articles/list/${list._id}`)
          articleMap[list._id] = res.data.articles
        })
      )

      setBoard(fetchedBoard)
      setLists(fetchedLists)
      setArticles(articleMap)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoard()
  }, [boardId, isArchivedView])
  const myRole = board?.members.find(m => m.user._id === user?._id)?.role
  const isBoardAdmin = myRole === 'admin'
  const isAdmin = myRole === 'admin'
  const isEditor = myRole === 'editor'
  const isClosed = board?.status === 'closed'

  const handleAddList = async (e) => {
    e.preventDefault()
    if (isClosed) return
    try {
      const res = await axiosInstance.post('/lists', { name: listName, boardId })
      setLists([...lists, res.data.list])
      setArticles({ ...articles, [res.data.list._id]: [] })
      setListName('')
      setShowAddList(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddArticle = async (e, listId) => {
    e.preventDefault()
    if (isClosed) return
    try {
      const res = await axiosInstance.post('/articles', { title: articleTitle, listId })
      setArticles({
        ...articles,
        [listId]: [...(articles[listId] || []), res.data.article]
      })
      setArticleTitle('')
      setShowAddArticle(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCloseBoard = async () => {
    if (!confirm('Close this board? It will move to the closed boards list and become read-only until reopened.')) return

    setBoardActionLoading('close')
    setBoardActionError('')
    try {
      const res = await axiosInstance.patch(`/boards/${boardId}/close`)
      setBoard(res.data.board)
      setShowSettingsMenu(false)
      setShowBoardMenu(false)
    } catch (err) {
      setBoardActionError(err.response?.data?.message || 'Failed to close board')
    } finally {
      setBoardActionLoading('')
    }
  }

  const handleReopenBoard = async () => {
    setBoardActionLoading('reopen')
    setBoardActionError('')
    try {
      const res = await axiosInstance.patch(`/boards/${boardId}/reopen`)
      setBoard(res.data.board)
      setShowSettingsMenu(false)
      setShowBoardMenu(false)
    } catch (err) {
      setBoardActionError(err.response?.data?.message || 'Failed to reopen board')
    } finally {
      setBoardActionLoading('')
    }
  }

  const handleRenameBoard = async (e) => {
    e.preventDefault()
    setBoardActionLoading('rename')
    setBoardActionError('')
    try {
      const res = await axiosInstance.patch(`/boards/${boardId}`, { name: boardNameInput })
      setBoard(res.data.board)
      setShowRenameBoard(false)
      setShowSettingsMenu(false)
    } catch (err) {
      setBoardActionError(err.response?.data?.message || 'Failed to rename board')
    } finally {
      setBoardActionLoading('')
    }
  }

  const openRenameBoard = () => {
    setBoardNameInput(board?.name || '')
    setBoardActionError('')
    setShowRenameBoard(true)
    setShowSettingsMenu(false)
    setShowBoardMenu(false)
  }

  const openRenameList = (list) => {
    setSelectedList(list)
    setListNameInput(list.name)
    setListActionError('')
    setShowRenameList(true)
    setListMenuOpenId('')
  }

  const handleRenameList = async (e) => {
    e.preventDefault()
    if (!selectedList) return

    setListActionLoading('rename')
    setListActionError('')
    try {
      const res = await axiosInstance.patch(`/lists/${selectedList._id}`, { name: listNameInput })
      setLists(prev => prev.map(list => list._id === selectedList._id ? res.data.list : list))
      setShowRenameList(false)
      setSelectedList(null)
    } catch (err) {
      setListActionError(err.response?.data?.message || 'Failed to update list name')
    } finally {
      setListActionLoading('')
    }
  }

  const handleArchiveList = async (list) => {
    setListActionLoading(list._id)
    setListActionError('')
    try {
      await axiosInstance.patch(`/lists/${list._id}/archive`)
      setLists(prev => prev.filter(item => item._id !== list._id))
      setArticles(prev => {
        const next = { ...prev }
        delete next[list._id]
        return next
      })
      setListMenuOpenId('')
    } catch (err) {
      setListActionError(err.response?.data?.message || 'Failed to archive list')
    } finally {
      setListActionLoading('')
    }
  }

  const handleUnarchiveList = async (list) => {
    setListActionLoading(list._id)
    setListActionError('')
    try {
      await axiosInstance.patch(`/lists/${list._id}/unarchive`)
      setLists(prev => prev.filter(item => item._id !== list._id))
      setArticles(prev => {
        const next = { ...prev }
        delete next[list._id]
        return next
      })
      setListMenuOpenId('')
    } catch (err) {
      setListActionError(err.response?.data?.message || 'Failed to restore list')
    } finally {
      setListActionLoading('')
    }
  }
  const handleReturnArticle = async (copyId) => {
    if (!confirm('Delete this copy? The original article will be unlocked and keep its current status.')) return
    try {
      await axiosInstance.delete(`/review/copy/${copyId}`)
      setArticles(prev => {
        const updated = {}
        for (const listId in prev) {
          updated[listId] = prev[listId].filter(a => a._id !== copyId)
        }
        return updated
      })
    } catch (err) {
      console.error(err)
    }
  }


  const handleDeleteList = async (list) => {
    if (!confirm('Delete this list permanently? This cannot be undone.')) return

    setListActionLoading(list._id)
    setListActionError('')
    try {
      await axiosInstance.delete(`/lists/${list._id}`)
      setLists(prev => prev.filter(item => item._id !== list._id))
      setArticles(prev => {
        const next = { ...prev }
        delete next[list._id]
        return next
      })
      setListMenuOpenId('')
    } catch (err) {
      setListActionError(err.response?.data?.message || 'Failed to delete list')
    } finally {
      setListActionLoading('')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
          <Link to="/" className="text-sm text-slate-500 hover:text-indigo-600">Groups</Link>
          <span className="text-slate-300">/</span>
          <Link to={`/groups/${board?.group}`} className="text-sm text-slate-500 hover:text-indigo-600">Boards</Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-800">{isArchivedView ? 'Archived Lists' : board?.name}</span>
        </div>
        <div className="flex items-center space-x-3">
          {isClosed && (
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium">
              Closed
            </span>
          )}
            <button
              onClick={() => setShowMembers(true)}
              className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-slate-700 transition-colors"
            >
              👥 Members {isAdmin && `(${board?.members?.length || 0})`}
            </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowBoardMenu(prev => !prev)
                setShowSettingsMenu(false)
              }}
              className="h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-slate-700 transition-colors flex items-center justify-center"
              aria-label="Board options"
            >
              ⋯
            </button>
            {showBoardMenu && (
              <div className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white shadow-lg z-20 p-2">
                <button
                  onClick={() => {
                    navigate(isArchivedView ? `/boards/${boardId}` : `/boards/${boardId}/archived`)
                    setShowBoardMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                >
                  {isArchivedView ? 'Back to Board' : 'Archived Lists'}
                </button>
                {isBoardAdmin && (
                  <button
                    onClick={() => {
                      setShowSettingsMenu(prev => !prev)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                  >
                    Settings
                  </button>
                )}
                {isBoardAdmin && showSettingsMenu && (
                  <div className="mt-1 border-t border-gray-100 pt-2">
                    <button
                      onClick={openRenameBoard}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                    >
                      Change Board Name
                    </button>
                    <button
                      onClick={isClosed ? handleReopenBoard : handleCloseBoard}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg ${
                        isClosed ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isClosed ? 'Reopen Board' : 'Close Board'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">{myRole}</span> */}
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {(isClosed || boardActionError || listActionError) && (
          <div className="mb-4 space-y-3">
            {isClosed && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
                This board is closed. Content is now read-only until a board admin reopens it.
              </div>
            )}
            {boardActionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
                {boardActionError}
              </div>
            )}
            {listActionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
                {listActionError}
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-4 h-full items-start">

          {lists.map((list) => (
            <div key={list._id} className="w-72 flex-shrink-0 flex flex-col max-h-full">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-semibold text-slate-700 text-sm flex items-center">
                  {list.name}
                  <span className="ml-2 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                    {(articles[list._id] || []).length}
                  </span>
                </h3>
                {!isClosed && (
                  <div className="relative">
                    <button
                      onClick={() => setListMenuOpenId(prev => prev === list._id ? '' : list._id)}
                      className="h-7 w-7 rounded-md text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                    >
                      ⋯
                    </button>
                    {listMenuOpenId === list._id && (
                      <div className="absolute right-0 top-8 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-20 p-2">
                        <button
                          onClick={() => openRenameList(list)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                        >
                          Change List Name
                        </button>
                        {isArchivedView ? (
                          <button
                            onClick={() => handleUnarchiveList(list)}
                            className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-gray-50 rounded-lg"
                          >
                            Restore List
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveList(list)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-lg"
                          >
                            Archive List
                          </button>
                        )}
                        {isBoardAdmin && (
                          <button
                            onClick={() => handleDeleteList(list)}
                            className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-gray-50 rounded-lg"
                          >
                            Delete Permanently
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-200/60 rounded-xl p-2 flex-1 overflow-y-auto space-y-2 min-h-24">
                {(articles[list._id] || []).map((article) => (
                  <div
                    key={article._id}
                    className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md"
                  >
                    {/* Clickable area — opens modal */}
                    <div
                      onClick={() => setSelectedArticle(article)}
                      className="cursor-pointer"
                    >
                      <StatusBadge status={article.status} />

                      {/* Copy badge */}
                      {article.isCopy && (
                        <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          Copy
                        </span>
                      )}

                      <h4 className="font-medium text-slate-800 text-sm mt-2">{article.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                          {article.isCopy ? article.sourceBoardName : board?.name}
                      </p>

                      {article.isCopy && article.pickedBy && (
                        <p className="text-xs text-indigo-500 mt-0.5">
                          Editor: {article.pickedBy?.name}
                        </p>
                      )}

                      {/* Locked badge — shown on original */}
                      {article.isLockedForReview && !article.isCopy && (
                        <p className="text-xs text-amber-600 mt-1">
                          🔒 In review by {article.lockedBy?.name}
                        </p>
                      )}
                    </div>

                    {/* Send to Review button — editor/admin, not a copy, not locked */}
                    {(isEditor || isAdmin) && !article.isCopy && !article.isLockedForReview && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowPickModal(article) }}
                        className="mt-2 w-full text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 py-1 rounded-lg transition-colors"
                      >
                        Send to Review
                      </button>
                    )}

                    {/* Return article button — editor/admin on copies */}
                    {(isEditor || isAdmin) && article.isCopy && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReturnArticle(article._id) }}
                        className="mt-2 w-full text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 py-1 rounded-lg transition-colors"
                      >
                        Delete Copy
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Article */}
                {!isClosed && !isArchivedView && showAddArticle === list._id ? (
                  <form onSubmit={(e) => handleAddArticle(e, list._id)} className="bg-white p-2 rounded-lg border border-indigo-300">
                    <input
                      autoFocus
                      type="text"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="Article title..."
                      className="w-full text-sm border-none outline-none p-1"
                      required
                    />
                    <div className="flex space-x-2 mt-2">
                      <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1 rounded">Add</button>
                      <button type="button" onClick={() => setShowAddArticle(null)} className="text-slate-500 text-xs px-2 py-1">Cancel</button>
                    </div>
                  </form>
                ) : !isClosed && !isArchivedView ? (
                  <button
                    onClick={() => setShowAddArticle(list._id)}
                    className="w-full text-left text-xs text-slate-400 hover:text-slate-700 px-2 py-1.5 hover:bg-white rounded transition-colors"
                  >
                    + Add article
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {/* Add List */}
          {!isClosed && !isArchivedView && (
            <div className="w-72 flex-shrink-0">
              {showAddList ? (
              <form onSubmit={handleAddList} className="bg-white rounded-xl p-3 border border-indigo-300 shadow-sm">
                <input
                  autoFocus
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="List name..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  required
                />
                <div className="flex space-x-2">
                  <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg">Add List</button>
                  <button type="button" onClick={() => setShowAddList(false)} className="text-slate-500 text-xs px-2 py-1">Cancel</button>
                </div>
              </form>
              ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="w-full text-left text-sm text-slate-500 hover:text-slate-800 bg-gray-200/40 hover:bg-gray-200/80 px-4 py-3 rounded-xl transition-colors"
              >
                + Add a list
              </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
          <ArticleModal
            article={selectedArticle}
            myRole={myRole}
            isReadOnly={isClosed}
            currentUserId={user?._id}
            onClose={() => setSelectedArticle(null)}
            onSave={(updated) => {
              if (updated._deleted) {
                setArticles(prev => ({
                  ...prev,
                  [updated.list]: (prev[updated.list] || []).filter(a => a._id !== updated._id)
                }))
              } else {
                setArticles(prev => ({
                  ...prev,
                  [updated.list]: (prev[updated.list] || []).map(a => a._id === updated._id ? updated : a)
                }))
              }
            }}
            onClose={() => {
              setSelectedArticle(null)
              fetchBoard()
            }}
          />
      )}
      {/* Board Members Modal */}
      {showMembers && board && (
        <BoardMembersModal
          board={board}
          myRole={myRole}
          onClose={() => setShowMembers(false)}
          onUpdate={(updatedBoard) => setBoard(updatedBoard)}
        />
      )}
      {showRenameBoard && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Change Board Name</h2>
            {boardActionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {boardActionError}
              </div>
            )}
            <form onSubmit={handleRenameBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Board Name</label>
                <input
                  type="text"
                  value={boardNameInput}
                  onChange={(e) => setBoardNameInput(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowRenameBoard(false); setBoardActionError('') }}
                  className="flex-1 border border-gray-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={boardActionLoading === 'rename'}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {boardActionLoading === 'rename' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showRenameList && selectedList && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Change List Name</h2>
            {listActionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {listActionError}
              </div>
            )}
            <form onSubmit={handleRenameList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">List Name</label>
                <input
                  type="text"
                  value={listNameInput}
                  onChange={(e) => setListNameInput(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowRenameList(false); setSelectedList(null); setListActionError('') }}
                  className="flex-1 border border-gray-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={listActionLoading === 'rename'}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {listActionLoading === 'rename' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Pick for Review Modal */}
      {showPickModal && (
        <PickForReviewModal
          article={showPickModal}
          groupId={board?.group}
          boardId={boardId}
          onClose={() => setShowPickModal(null)}
          onPicked={(copy) => {
            // Mark original as locked in local state
            setArticles(prev => {
              const updated = {}
              for (const listId in prev) {
                updated[listId] = prev[listId].map(a =>
                  a._id === showPickModal._id
                    ? { ...a, isLockedForReview: true, lockedBy: { name: 'You' }, status: 'in_review' }
                    : a
                )
              }
              return updated
            })
            setShowPickModal(null)
          }}
        />
      )}
    </div>
  )
}
