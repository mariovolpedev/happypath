import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Navbar() {
  const { user, logout, isAuthenticated, isModeratorOrAdmin } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => { logout(); navigate('/') }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    } else {
      navigate('/search')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-happy-600 shrink-0">
          ✨ HappyPath
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-1.5 flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Cerca..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input text-sm py-1.5 w-full"
          />
          <button
            type="submit"
            className="btn-secondary text-sm py-1.5 px-3 shrink-0"
            aria-label="Cerca"
          >
            🔍
          </button>
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated() ? (
            <>
              <Link to="/home" className="btn-secondary text-sm">🏠 Home</Link>
              <Link to="/create" className="btn-primary text-sm">+ Pubblica</Link>
              {isModeratorOrAdmin() && (
                <Link to="/moderation" className="btn-secondary text-sm">🛡️ Mod</Link>
              )}
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
