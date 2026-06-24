import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import NotificationPanel from '../components/NotificationPanel'
import PageHeader from '../components/PageHeader'
import useAuthStore from '../store/authStore'

export default function Groups() {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const loadGroups = async () => {
      try {
        const res = await axiosInstance.get('/groups')
        if (isMounted) setGroups(res.data.groups)
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadGroups()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await axiosInstance.post('/groups', { name: groupName })
      setGroups([...groups, res.data.group])
      setGroupName('')
      setShowCreate(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout')
    } catch (err) {
      console.error(err)
    } finally {
      logout()
      navigate('/login')
    }
  }

  const avatarInitial = user?.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">O</div>
            <span className="text-base font-bold">OrbitBoard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white ring-2 ring-offset-1 ring-indigo-300 transition-opacity hover:opacity-90"
                aria-label="Profile menu"
                aria-expanded={showProfileMenu}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                  {/* Name + email — clicking goes to profile */}
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
                    </div>
                  </Link>
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Button below sticky header, mobile only */}
      <div className="px-4 pt-4 pb-1 sm:hidden">
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
        >
          + New Group
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden sm:block">
        <PageHeader
          title="Your Groups"
          subtitle="Select a group to enter its workspace"
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Group
            </button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="text-center py-14 sm:py-20 text-slate-400">
              <p className="text-lg font-medium">No groups yet</p>
              <p className="text-sm mt-1">Create a group to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {groups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => navigate(`/groups/${group._id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md sm:block sm:p-6"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700 sm:mb-4 sm:h-10 sm:w-10">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-800 sm:whitespace-normal">{group.name}</h3>
                    {group.canViewGroupStats ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Open workspace</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <NotificationPanel collapsed={false} mode="mobile" />
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Create New Group</h2>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. National Team"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError('') }}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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