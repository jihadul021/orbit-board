import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const Groups = lazy(() => import('./pages/Groups'))
const Boards = lazy(() => import('./pages/Boards'))
const Board = lazy(() => import('./pages/Board'))
const AdminBoard = lazy(() => import('./pages/AdminBoard'))
const Profile = lazy(() => import('./pages/Profile'))
const Landing = lazy(() => import('./pages/Landing'))

const PageFallback = () => (
  <div className="min-h-screen bg-slate-50" aria-label="Loading" />
)

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

const GuestRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
          <Route path="/groups/:id/closed" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
          <Route path="/boards/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/boards/:id/archived" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/boards/:id/admin-overview" element={<ProtectedRoute><AdminBoard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}