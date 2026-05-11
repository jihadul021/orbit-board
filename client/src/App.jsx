import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Groups from './pages/Groups'
import Boards from './pages/Boards'
import Board from './pages/Board'
import Layout from './components/Layout'

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
        <Route path="/boards/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}