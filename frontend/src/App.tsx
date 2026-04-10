import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ExplorePage from './pages/ExplorePage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CreateContentPage from './pages/CreateContentPage'
import ContentDetailPage from './pages/ContentDetailPage'
import ProfilePage from './pages/ProfilePage'
import ModerationPage from './pages/ModerationPage'
import SearchPage from './pages/SearchPage'
import MessagesPage from './pages/MessagesPage'
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

function ModRoute({ children }: { children: React.ReactNode }) {
  const { isModeratorOrAdmin } = useAuthStore()
  return isModeratorOrAdmin() ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create" element={<PrivateRoute><CreateContentPage /></PrivateRoute>} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/u/:username" element={<ProfilePage />} />
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/moderation" element={<ModRoute><ModerationPage /></ModRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
