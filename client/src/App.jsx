import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Groups from './pages/Groups'
import Boards from './pages/Boards'
import Board from './pages/Board'
import Layout from './components/Layout'
import Profile from './pages/Profile'
import Landing from './pages/Landing'

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute><Groups /></ProtectedRoute>} />

        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
        <Route path="/groups/:id/closed" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
        <Route path="/boards/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/boards/:id/archived" element={<ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
