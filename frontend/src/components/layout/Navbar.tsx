import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getUnreadCount } from '../../api/messages'
import NotificationBell from '../common/NotificationBell'
import { useThemeStore, ThemeMode } from '../../store/themeStore'

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light',  label: 'Chiaro',    icon: '☀️' },
  { mode: 'dark',   label: 'Scuro',     icon: '🌙' },
  { mode: 'system', label: 'Sistema',   icon: '💻' },
]

export default function Navbar() {
  const { user, logout, isAuthenticated, isModeratorOrAdmin } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [unread, setUnread] = useState(0)
  const currentTheme = THEME_OPTIONS.find(t => t.mode === mode) ?? THEME_OPTIONS[2]
  const nextTheme = THEME_OPTIONS[(THEME_OPTIONS.indexOf(currentTheme) + 1) % THEME_OPTIONS.length]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    } else {
      navigate('/search')
    }
  }

  // Poll unread count every 30 s while logged in
  useEffect(() => {
    if (!isAuthenticated()) return

    const fetchUnread = () =>
      getUnreadCount()
        .then(setUnread)
        .catch(() => {})

    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [isAuthenticated()])

  return (
    <nav className="border-b sticky top-0 z-50 transition-colors duration-200"
         style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-2xl font-bold text-happy-600 shrink-0"
        >
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
          
          {/* ── Theme toggle ── */}
          <button
            onClick={() => setMode(nextTheme.mode)}
            title={`Passa a: ${nextTheme.label}`}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors
                       hover:bg-gray-100 dark:hover:bg-gray-800 text-base"
            aria-label="Cambia tema"
          >
            {currentTheme.icon}
          </button>
          
          {isAuthenticated() ? (
            <>
              <Link to="/home" className="btn-secondary text-sm">
                🏠 Home
              </Link>

              <Link to="/create" className="btn-primary text-sm">
                + Pubblica
              </Link>

              {/* Messages link with unread badge */}
              <Link
                to="/messages"
                className="relative btn-secondary text-sm"
                title="Messaggi privati"
              >
                💬 Messaggi
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-happy-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-0.5">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>

              {isModeratorOrAdmin() && (
                <Link to="/moderation" className="btn-secondary text-sm">
                  🛡️ Mod
                </Link>
              )}

              <NotificationBell />
              <Link
                to={`/u/${user?.username}`}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-happy-600 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.verified && <span title="Verificato">✅</span>}
                {user?.displayName}
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm hover:text-red-500 transition-colors"
                      style={{ color: 'var(--text-faint)' }}>
                Esci
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">
                Accedi
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
