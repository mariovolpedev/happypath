import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getUnreadCount } from '../../api/messages'
import NotificationBell from '../common/NotificationBell'
import { useThemeStore, ThemeMode } from '../../store/themeStore'
import { usePendingVerifications } from '../../hooks/usePendingVerifications'

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light',  label: 'Chiaro',  icon: '☀️' },
  { mode: 'dark',   label: 'Scuro',   icon: '🌙' },
  { mode: 'system', label: 'Sistema', icon: '💻' },
]

export default function Navbar() {
  const { user, logout, isAuthenticated, isModeratorOrAdmin } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [unread, setUnread]           = useState(0)
  const [menuOpen, setMenuOpen]       = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentTheme = THEME_OPTIONS.find(t => t.mode === mode) ?? THEME_OPTIONS[2]
  const nextTheme    = THEME_OPTIONS[(THEME_OPTIONS.indexOf(currentTheme) + 1) % THEME_OPTIONS.length]

  const pendingVerifCount = usePendingVerifications()
  const pendingVerif = isModeratorOrAdmin() ? pendingVerifCount : 0

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    } else {
      navigate('/search')
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) return
    const fetchUnread = () => getUnreadCount().then(setUnread).catch(() => {})
    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [isAuthenticated()])

  return (
    <nav
      className="border-b sticky top-0 z-50 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-happy-600 shrink-0">
          ✨ HappyPath
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-1.5 flex-1">
          <input
            type="text" placeholder="Cerca..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input text-sm py-1.5 w-full"
          />
          <button type="submit" className="btn-secondary text-sm py-1.5 px-3 shrink-0" aria-label="Cerca">
            🔍
          </button>
        </form>

        {/* Destra */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Cambio tema */}
          <button
            onClick={() => setMode(nextTheme.mode)}
            title={`Passa a: ${nextTheme.label}`}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-base"
            aria-label="Cambia tema"
          >
            {currentTheme.icon}
          </button>

          {isAuthenticated() ? (
            <>
              {/* Pubblica */}
              <Link to="/create" className="btn-primary text-sm shrink-0">+ Pubblica</Link>

              {/* Notifiche */}
              <NotificationBell pendingVerifications={pendingVerif} />

              {/* Messaggi */}
              <Link
                to="/messages"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base"
                title="Messaggi privati"
              >
                💬
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-happy-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-0.5">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>

              {/* Menu avatar dropdown */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  {user?.verified && <span title="Verificato" className="text-base">✅</span>}
                  <span className="max-w-[120px] truncate">{user?.displayName}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {menuOpen ? '▲' : '▼'}
                  </span>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-2xl shadow-xl border py-1 z-50"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                  >
                    <MenuLink to="/home"                   onClick={() => setMenuOpen(false)} icon="🏠" label="Home" />
                    <MenuLink to="/feed"                   onClick={() => setMenuOpen(false)} icon="✨" label="Feed personalizzato" />
                    <MenuLink to="/themes"                 onClick={() => setMenuOpen(false)} icon="🏷️" label="Temi" />
                    <MenuLink to={`/u/${user?.username}`}  onClick={() => setMenuOpen(false)} icon="👤" label="Profilo" />

                    {user?.verified && (
                      <MenuLink to="/alter-egos" onClick={() => setMenuOpen(false)} icon="🎭" label="Alter Ego" />
                    )}

                    {isModeratorOrAdmin() && (
                      <MenuLinkWithBadge
                        to="/moderation"
                        onClick={() => setMenuOpen(false)}
                        icon="🛡️"
                        label="Moderazione"
                        badge={pendingVerif}
                      />
                    )}

                    <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                    <MenuLink to="/settings" onClick={() => setMenuOpen(false)} icon="⚙️" label="Impostazioni" />
                    <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                    >
                      <span className="text-base">🚪</span> Esci
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/themes"   className="btn-secondary text-sm">🏷️ Temi</Link>
              <Link to="/login"    className="btn-secondary text-sm">Accedi</Link>
              <Link to="/register" className="btn-primary  text-sm">Registrati</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function MenuLink({
  to, icon, label, onClick,
}: { to: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      style={{ color: 'var(--text-primary)' }}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  )
}

function MenuLinkWithBadge({
  to, icon, label, onClick, badge,
}: { to: string; icon: string; label: string; onClick: () => void; badge: number }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      style={{ color: 'var(--text-primary)' }}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
