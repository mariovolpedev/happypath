import { useState, useEffect, useCallback } from 'react'
import { getFeed, getFeedSettings, updateFeedSettings } from '../api/feed'
import type { FeedItemResponse, FeedSettings, FeedSortStrategy } from '../types'
import ContentCard from '../components/content/ContentCard'
import Spinner from '../components/common/Spinner'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export default function FeedPage() {
  const [items, setItems]           = useState<FeedItemResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(0)
  const [hasMore, setHasMore]       = useState(true)
  const [settings, setSettings]     = useState<FeedSettings | null>(null)
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

  useEffect(() => {
    loadSettings()
    load(0)
  }, [])

  const handleSortChange = async (strategy: FeedSortStrategy) => {
    if (!settings) return
    setSavingSettings(true)
    try {
      const updated = await updateFeedSettings({ sortStrategy: strategy })
      setSettings(updated)
      load(0)
    } finally { setSavingSettings(false) }
  }

  const handleToggle = async (key: keyof Pick<FeedSettings, 'showContents' | 'showComments' | 'showReactions' | 'showFollowEvents'>) => {
    if (!settings) return
    setSavingSettings(true)
    try {
      const updated = await updateFeedSettings({ [key]: !settings[key] })
      setSettings(updated)
      load(0)
    } finally { setSavingSettings(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-800">✨ Feed personalizzato</h1>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {showSettings ? 'Chiudi impostazioni' : '⚙️ Impostazioni'}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && settings && (
        <div className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Impostazioni feed</h2>

          <div>
            <p className="text-sm text-gray-500 mb-2">Ordinamento</p>
            <div className="flex gap-2">
              {(['RECENT', 'SMART', 'RANDOM'] as FeedSortStrategy[]).map(s => (
                <button
                  key={s}
                  disabled={savingSettings}
                  onClick={() => handleSortChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.sortStrategy === s
                      ? 'bg-hp-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'RECENT' ? '🕐 Recenti' : s === 'SMART' ? '🧠 Smart' : '🎲 Random'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Mostra nel feed</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'showContents',     label: '📝 Contenuti' },
                { key: 'showComments',     label: '💬 Commenti' },
                { key: 'showReactions',    label: '❤️ Reazioni' },
                { key: 'showFollowEvents', label: '👥 Follow' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={() => handleToggle(key)}
                    disabled={savingSettings}
                    className="accent-hp-primary"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? <Spinner /> : (
        <div className="space-y-4">
          {items.map((item, i) => <FeedItemCard key={`${item.type}-${i}`} item={item} />)}

          {items.length === 0 && (
            <div className="card text-center py-12 space-y-3">
              <p className="text-gray-500">Il tuo feed è vuoto.</p>
              <p className="text-sm text-gray-400">Segui persone o temi per vedere le loro attività qui.</p>
              <div className="flex justify-center gap-3">
                <Link to="/themes" className="btn-primary">Esplora temi</Link>
                <Link to="/search" className="btn-secondary">Cerca persone</Link>
              </div>
            </div>
          )}

          {hasMore && !loading && (
            <button onClick={() => load(page + 1)} className="btn-secondary w-full">
              Carica altri
            </button>
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
        <p className="text-xs text-gray-400 mb-1 pl-1">
          <Link to={`/u/${item.actor.username}`} className="font-medium text-gray-500 hover:underline">
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
        <p className="text-xs text-gray-400 mb-2">
          <Link to={`/u/${item.actor.username}`} className="font-medium text-gray-500 hover:underline">
            {item.actor.displayName}
          </Link> ha commentato · {ago}
        </p>
        <blockquote className="border-l-2 border-gray-200 pl-3 mb-3">
          <Link to={`/content/${item.content.id}`} className="text-sm text-gray-600 hover:underline line-clamp-2">
            {item.content.title}
          </Link>
        </blockquote>
        <p className="text-sm text-gray-800">{item.comment.text}</p>
      </div>
    )
  }

  if (item.type === 'REACTION' && item.content) {
    return (
      <div className="card">
        <p className="text-xs text-gray-400 mb-2">
          <Link to={`/u/${item.actor.username}`} className="font-medium text-gray-500 hover:underline">
            {item.actor.displayName}
          </Link> ha reagito {item.reactionType} · {ago}
        </p>
        <Link to={`/content/${item.content.id}`} className="text-sm text-gray-600 hover:underline line-clamp-2">
          {item.content.title}
        </Link>
      </div>
    )
  }

  if (item.type === 'FOLLOW_EVENT' && item.targetUser) {
    return (
      <div className="card flex items-center gap-3">
        <div className="flex-1 text-sm text-gray-700">
          <Link to={`/u/${item.actor.username}`} className="font-medium hover:underline">
            {item.actor.displayName}
          </Link>
          {' '}ha iniziato a seguire{' '}
          <Link to={`/u/${item.targetUser.username}`} className="font-medium hover:underline">
            {item.targetUser.displayName}
          </Link>
        </div>
        <span className="text-xs text-gray-400">{ago}</span>
      </div>
    )
  }

  return null
}
