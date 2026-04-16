import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  type NotificationResponse,
} from '../../api/notifications'

function notificationText(n: NotificationResponse): string {
  const name = n.actor?.displayName ?? 'Qualcuno'
  switch (n.type) {
    case 'REACTION': return `${name} ha reagito al tuo contenuto "${n.contentTitle ?? ''}"`
    case 'COMMENT':  return `${name} ha commentato "${n.contentTitle ?? ''}"`
    case 'FOLLOW':   return `${name} ha iniziato a seguirti`
    default:         return 'Nuova notifica'
  }
}

function notificationLink(n: NotificationResponse): string {
  if (n.type === 'FOLLOW') return `/u/${n.actor?.username}`
  if (n.contentId) return `/content/${n.contentId}${n.commentId ? '#comments' : ''}`
  return '/'
}

interface Props {
  /** Numero di richieste di verifica pendenti (solo per mod/admin). */
  pendingVerifications?: number
}

export default function NotificationBell({ pendingVerifications = 0 }: Props) {
  const [open, setOpen]                   = useState(false)
  const [unread, setUnread]               = useState(0)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading]             = useState(false)
  const [markingId, setMarkingId]         = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Badge totale = notifiche non lette + verifiche pendenti (mod/admin)
  const totalBadge = unread + pendingVerifications

  // ── Polling badge ogni 30 s ──
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => clearInterval(interval)
  }, [])

  // ── Chiudi cliccando fuori ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchCount = async () => {
    try {
      const data = await getUnreadCount()
      setUnread(data.count)
    } catch {}
  }

  // Carica sempre notifiche fresche all'apertura (fix stale data)
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getNotifications()
      setNotifications(data.content)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      // Carica sempre dati freschi ad ogni apertura
      await fetchNotifications()
    }
  }

  const handleMarkAll = async () => {
    await markAllRead()
    // Aggiorna UI ottimisticamente
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    // Riallinea subito il badge (non aspetta il polling)
    await fetchCount()
  }

  // Click sul link della notifica: marca come letta e naviga
  const handleNotificationClick = async (n: NotificationResponse) => {
    if (!n.read) {
      await markRead(n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      // Riallinea subito il badge (fix: prima aspettava il polling dei 30 s)
      await fetchCount()
    }
    setOpen(false)
  }

  // Click sul pulsante "✓": marca come letta in-place senza navigare
  const handleMarkSingleRead = async (e: React.MouseEvent, n: NotificationResponse) => {
    e.preventDefault()
    e.stopPropagation()
    if (n.read || markingId === n.id) return
    setMarkingId(n.id)
    try {
      await markRead(n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      await fetchCount()
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* ── Pulsante campanella ── */}
      <button
        onClick={handleOpen}
        className="relative btn-secondary text-sm px-3"
        aria-label="Notifiche"
      >
        🔔
        {totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
            {totalBadge > 99 ? '99+' : totalBadge}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card, #fff)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Notifiche
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-happy-600 hover:underline"
              >
                Segna tutte come lette
              </button>
            )}
          </div>

          {/* ── Sezione Moderazione (solo mod/admin) ── */}
          {pendingVerifications > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-1.5 bg-blue-50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                  Moderazione
                </span>
              </div>
              <Link
                to="/moderation"
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                  🛡️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug font-medium">
                    {pendingVerifications === 1
                      ? '1 richiesta di verifica in attesa'
                      : `${pendingVerifications} richieste di verifica in attesa`}
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">Vai alla sezione Moderazione →</p>
                </div>
                <span className="flex-shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 mt-0.5">
                  {pendingVerifications > 99 ? '99+' : pendingVerifications}
                </span>
              </Link>
            </div>
          )}

          {/* ── Lista notifiche utente ── */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="text-center text-gray-400 py-6 text-sm">Caricamento…</p>
            )}

            {!loading && notifications.length === 0 && pendingVerifications === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Nessuna notifica ancora 🌱</p>
            )}
            {!loading && notifications.length === 0 && pendingVerifications > 0 && (
              <p className="text-center text-gray-400 py-5 text-sm">Nessuna notifica utente 🌱</p>
            )}

            {!loading && notifications.map(n => (
              <div key={n.id} className="relative group">
                <Link
                  to={notificationLink(n)}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 pr-10 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !n.read ? 'bg-happy-50' : ''
                  }`}
                >
                  {/* Icona tipo */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                    {n.type === 'REACTION' ? '❤️' : n.type === 'COMMENT' ? '💬' : '👤'}
                  </div>

                  {/* Testo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug line-clamp-2">
                      {notificationText(n)}
                    </p>
                    {n.commentPreview && (
                      <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">
                        "{n.commentPreview}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
                    </p>
                  </div>

                  {/* Pallino non-letta */}
                  {!n.read && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-happy-500 mt-1" />
                  )}
                </Link>

                {/* Pulsante "Segna come letta" in-place (visibile solo se non letta) */}
                {!n.read && (
                  <button
                    onClick={e => handleMarkSingleRead(e, n)}
                    disabled={markingId === n.id}
                    aria-label="Segna come letta"
                    title="Segna come letta"
                    className="
                      absolute right-3 top-1/2 -translate-y-1/2
                      w-6 h-6 rounded-full
                      flex items-center justify-center
                      text-[11px] font-bold
                      bg-white border border-gray-200 text-gray-400
                      opacity-0 group-hover:opacity-100
                      hover:bg-happy-50 hover:border-happy-300 hover:text-happy-600
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-all duration-150
                      shadow-sm
                    "
                  >
                    {markingId === n.id ? '…' : '✓'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
