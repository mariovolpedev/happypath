import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import NotificationBell from '../common/NotificationBell'

export default function Navbar() {
  const { user, logout, isAuthenticated, isModeratorOrAdmin } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-happy-600">
          ✨ HappyPath
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated() ? (
            <>
              <Link to="/home" className="btn-secondary text-sm">🏠 Home</Link>
              <Link to="/create" className="btn-primary text-sm">+ Pubblica</Link>
              {isModeratorOrAdmin() && (
                <Link to="/moderation" className="btn-secondary text-sm">🛡️ Mod</Link>
              )}
              <NotificationBell />
              <Link to={`/u/${user?.username}`} className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-happy-600">
                {user?.verified && <span title="Verificato">✅</span>}
                {user?.displayName}
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500">Esci</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Accedi</Link>
              <Link to="/register" className="btn-primary text-sm">Registrati</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
