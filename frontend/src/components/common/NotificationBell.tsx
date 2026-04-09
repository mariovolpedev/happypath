import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { getNotifications, getUnreadCount, markAllRead, markRead, type NotificationResponse } from '../../api/notifications'

const REACTION_EMOJI: Record<string, string> = {
  HEART: '❤️', LAUGH: '😄', WOW: '🤩', CLAP: '👏', SMILE: '😊'
}

function notificationText(n: NotificationResponse): string {
  const name = n.actor?.displayName ?? 'Qualcuno'
  switch (n.type) {
    case 'REACTION': return `${name} ha reagito al tuo contenuto "${n.contentTitle ?? ''}"`
    case 'COMMENT': return `${name} ha commentato "${n.contentTitle ?? ''}"`
    case 'FOLLOW': return `${name} ha iniziato a seguirti`
    default: return 'Nuova notifica'
  }
}

function notificationLink(n: NotificationResponse): string {
  if (n.type === 'FOLLOW') return `/u/${n.actor?.username}`
  if (n.contentId) return `/content/${n.contentId}${n.commentId ? '#comments' : ''}`
  return '/'
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchCount = async () => {
    try {
      const data = await getUnreadCount()
      setUnread(data.count)
    } catch {}
  }

  const handleOpen = async () => {
    if (!open) {
      setLoading(true)
      try {
        const data = await getNotifications()
        setNotifications(data.content)
      } finally { setLoading(false) }
    }
    setOpen(o => !o)
  }

  const handleMarkAll = async () => {
    await markAllRead()
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotificationClick = async (n: NotificationResponse) => {
    if (!n.read) {
      await markRead(n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnread(c => Math.max(0, c - 1))
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative btn-secondary text-sm px-3"
        aria-label="Notifiche"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-display font-bold text-sm">Notifiche</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-happy-600 hover:underline">
                Segna tutte come lette
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="text-center text-gray-400 py-6 text-sm">Caricamento…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Nessuna notifica ancora 🌱</p>
            )}
            {!loading && notifications.map(n => (
              <Link
                key={n.id}
                to={notificationLink(n)}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.read ? 'bg-happy-50' : ''}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                  {n.type === 'REACTION' ? '❤️' : n.type === 'COMMENT' ? '💬' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug line-clamp-2">
                    {notificationText(n)}
                  </p>
                  {n.commentPreview && (
                    <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">"{n.commentPreview}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
                  </p>
                </div>
                {!n.read && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-happy-500 mt-1" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
