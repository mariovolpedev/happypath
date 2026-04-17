import { useState, useEffect, useCallback } from 'react'
import { getFeed, getFeedSettings, updateFeedSettings } from '../api/feed'
import type { FeedItemResponse, FeedSettings, FeedSortStrategy } from '../types'
import ContentCard from '../components/content/ContentCard'
import Spinner from '../components/common/Spinner'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

const SORT_OPTIONS: { value: FeedSortStrategy; label: string; icon: string; desc: string }[] = [
  { value: 'RECENT', label: 'Recenti', icon: '🕐', desc: 'Dal più nuovo' },
  { value: 'SMART',  label: 'Smart',   icon: '🧠', desc: 'Pesato e bilanciato' },
  { value: 'RANDOM', label: 'Random',  icon: '🎲', desc: 'Ordine casuale' },
]

const TYPE_OPTIONS: { key: keyof Pick<FeedSettings, 'showContents' | 'showComments' | 'showReactions' | 'showFollowEvents'>; label: string; icon: string }[] = [
  { key: 'showContents',     label: 'Contenuti',  icon: '📝' },
  { key: 'showComments',     label: 'Commenti',   icon: '💬' },
  { key: 'showReactions',    label: 'Reazioni',   icon: '❤️' },
  { key: 'showFollowEvents', label: 'Follow',     icon: '👥' },
]

export default function FeedPage() {
  const [items, setItems]               = useState<FeedItemResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(0)
  const [hasMore, setHasMore]           = useState(true)
  const [settings, setSettings]         = useState<FeedSettings | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const loadSettings = useCallback(async () => {
    try { setSettings(await getFeedSettings()) } catch {}
  }, [])

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const data = await getFeed(p, 20)
      setItems(p === 0 ? data : prev => [...prev, ...data])
      setHasMore(data.length === 20)
      setPage(p)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSettings(); load(0) }, [])

  const save = async (next: FeedSettings) => {
    setSavingSettings(true)
    try {
      const updated = await updateFeedSettings(next)
      setSettings(updated)
      load(0)
    } finally { setSavingSettings(false) }
  }

  const handleSortChange = (strategy: FeedSortStrategy) => {
    if (!settings) return
    save({ ...settings, sortStrategy: strategy })
  }

  const handleToggle = (key: typeof TYPE_OPTIONS[number]['key']) => {
    if (!settings) return
    save({ ...settings, [key]: !settings[key] })
  }

  const handleSelectAll  = () => {
    if (!settings) return
    save({ ...settings, showContents: true, showComments: true, showReactions: true, showFollowEvents: true })
  }

  const handleDeselectAll = () => {
    if (!settings) return
    save({ ...settings, showContents: false, showComments: false, showReactions: false, showFollowEvents: false })
  }

  const allSelected  = settings ? TYPE_OPTIONS.every(t => settings[t.key])  : false
  const noneSelected = settings ? TYPE_OPTIONS.every(t => !settings[t.key]) : false

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>🏠 Il tuo feed</h1>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="text-sm underline transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {showSettings ? 'Chiudi' : '⚙️ Impostazioni'}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && settings && (
        <div className="card mb-6 space-y-6" style={{ opacity: savingSettings ? 0.6 : 1, transition: 'opacity 200ms' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Impostazioni feed</h2>

          {/* Ordinamento */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>Ordinamento</p>
            <div className="grid grid-cols-3 gap-2">
              {SORT_OPTIONS.map(opt => {
                const active = settings.sortStrategy === opt.value
                return (
                  <button
                    key={opt.value}
                    disabled={savingSettings}
                    onClick={() => handleSortChange(opt.value)}
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    style={active ? {
                      background: 'var(--color-primary, #01696f)',
                      color: '#fff',
                      boxShadow: '0 2px 8px oklch(0.4 0.08 192 / 0.25)',
                    } : {
                      background: 'var(--bg-offset, #f3f0ec)',
                      color: 'var(--text-muted)',
                      border: '1.5px solid var(--border)',
                    }}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-[10px] opacity-70">{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tipi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Mostra nel feed</p>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  disabled={savingSettings || allSelected}
                  className="text-xs px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    background: allSelected ? 'var(--bg-offset)' : 'var(--color-primary, #01696f)',
                    color: allSelected ? 'var(--text-faint)' : '#fff',
                    opacity: allSelected ? 0.5 : 1,
                    cursor: allSelected ? 'default' : 'pointer',
                  }}
                >
                  Tutti
                </button>
                <button
                  onClick={handleDeselectAll}
                  disabled={savingSettings || noneSelected}
                  className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: noneSelected ? 'var(--text-faint)' : 'var(--text-muted)',
                    opacity: noneSelected ? 0.5 : 1,
                    cursor: noneSelected ? 'default' : 'pointer',
                  }}
                >
                  Nessuno
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(({ key, label, icon }) => {
                const active = settings[key]
                return (
                  <button
                    key={key}
                    disabled={savingSettings}
                    onClick={() => handleToggle(key)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={active ? {
                      background: 'var(--color-primary-highlight, #cedcd8)',
                      color: 'var(--color-primary, #01696f)',
                      border: '1.5px solid var(--color-primary, #01696f)',
                    } : {
                      background: 'var(--bg-offset, #f3f0ec)',
                      color: 'var(--text-faint)',
                      border: '1.5px solid var(--border)',
                    }}
                  >
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                    <span className="ml-auto text-xs">{active ? '✔' : ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? <Spinner /> : (
        <div className="space-y-4">
          {items.map((item, i) => <FeedItemCard key={`${item.type}-${i}`} item={item} />)}

          {items.length === 0 && (
            <div className="card text-center py-12 space-y-3">
              <p style={{ color: 'var(--text-muted)' }}>Il tuo feed è vuoto.</p>
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Segui persone o temi per vedere le loro attività qui.</p>
              <div className="flex justify-center gap-3">
                <Link to="/themes" className="btn-primary">Esplora temi</Link>
                <Link to="/search" className="btn-secondary">Cerca persone</Link>
              </div>
            </div>
          )}

          {hasMore && !loading && (
            <button onClick={() => load(page + 1)} className="btn-secondary w-full">Carica altri</button>
          )}
          {loading && items.length > 0 && <Spinner />}
        </div>
      )}
    </div>
  )
}

function FeedItemCard({ item }: { item: FeedItemResponse }) {
  const ago = formatDistanceToNow(new Date(item.eventAt), { addSuffix: true, locale: it })

  if (item.type === 'CONTENT' && item.content) {
    return (
      <div>
        <p className="text-xs mb-1 pl-1" style={{ color: 'var(--text-faint)' }}>
          <Link to={`/u/${item.actor.username}`} className="font-medium hover:underline" style={{ color: 'var(--text-muted)' }}>
            {item.actor.displayName}
          </Link> ha pubblicato · {ago}
        </p>
        <ContentCard content={item.content} />
      </div>
    )
  }

  if (item.type === 'COMMENT' && item.content && item.comment) {
    return (
      <div className="card">
        <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
          <Link to={`/u/${item.actor.username}`} className="font-medium hover:underline" style={{ color: 'var(--text-muted)' }}>
            {item.actor.displayName}
          </Link> ha commentato · {ago}
        </p>
        <blockquote className="border-l-2 pl-3 mb-3" style={{ borderColor: 'var(--border)' }}>
          <Link to={`/content/${item.content.id}`} className="text-sm hover:underline line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {item.content.title}
          </Link>
        </blockquote>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.comment.text}</p>
      </div>
    )
  }

  if (item.type === 'REACTION' && item.content) {
    return (
      <div className="card">
        <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
          <Link to={`/u/${item.actor.username}`} className="font-medium hover:underline" style={{ color: 'var(--text-muted)' }}>
            {item.actor.displayName}
          </Link> ha reagito {item.reactionType} · {ago}
        </p>
        <Link to={`/content/${item.content.id}`} className="text-sm hover:underline line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {item.content.title}
        </Link>
      </div>
    )
  }

  if (item.type === 'FOLLOW_EVENT' && item.targetUser) {
    return (
      <div className="card flex items-center gap-3">
        <div className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
          <Link to={`/u/${item.actor.username}`} className="font-medium hover:underline">{item.actor.displayName}</Link>
          {' '}ha iniziato a seguire{' '}
          <Link to={`/u/${item.targetUser.username}`} className="font-medium hover:underline">{item.targetUser.displayName}</Link>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{ago}</span>
      </div>
    )
  }

  return null
}
