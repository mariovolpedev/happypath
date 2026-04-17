import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchAll } from '../api/search'
import type { SearchResult, SearchType } from '../api/search'
import ContentCard from '../components/content/ContentCard'
import Avatar from '../components/common/Avatar'
import VerifiedBadge from '../components/common/VerifiedBadge'
import UserHoverCard from '../components/common/UserHoverCard'
import Spinner from '../components/common/Spinner'
import { useThemes } from '../hooks/useThemes'
import { deleteContent } from '../api/content'

type TabType = 'ALL' | SearchType

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'ALL',       label: 'Tutto',     emoji: '✨' },
  { id: 'CONTENT',   label: 'Contenuti', emoji: '📝' },
  { id: 'USER',      label: 'Persone',   emoji: '👤' },
  { id: 'ALTER_EGO', label: 'Alter Ego', emoji: '🎭' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''

  const [query, setQuery]     = useState(initialQ)
  const [tab, setTab]         = useState<TabType>('ALL')
  const [themeId, setThemeId] = useState<number | undefined>()
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const themes = useThemes()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string, t: TabType, tid?: number) => {
    if (!q.trim()) { setResults(null); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchAll(q.trim(), t === 'ALL' ? undefined : t, tid)
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, tab, themeId)
      if (query.trim()) setSearchParams({ q: query.trim() }, { replace: true })
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, tab, themeId, doSearch])

  useEffect(() => {
    if (initialQ) doSearch(initialQ, 'ALL', undefined)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(query, tab, themeId)
    if (query.trim()) setSearchParams({ q: query.trim() })
  }

  const handleDelete = async (id: number) => {
    await deleteContent(id)
    setResults(r => r ? { ...r, contents: r.contents.filter(c => c.id !== id) } : r)
  }

  const totalResults = results
    ? results.contents.length + results.users.length + results.alterEgos.length
    : 0

  const showContents  = tab === 'ALL' || tab === 'CONTENT'
  const showUsers     = tab === 'ALL' || tab === 'USER'
  const showAlterEgos = tab === 'ALL' || tab === 'ALTER_EGO'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Barra di ricerca */}
      <div className="card">
        <h1 className="font-display font-bold text-2xl mb-4">🔍 Cerca</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            autoFocus
            className="input flex-1"
            placeholder="Cerca contenuti, persone, alter ego..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary px-5">Cerca</button>
        </form>

        {/* Tabs tipo */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-happy-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Filtro tema */}
        {(tab === 'ALL' || tab === 'CONTENT') && themes.length > 0 && (
          <div className="mt-3">
            <select
              className="input text-sm"
              value={themeId ?? ''}
              onChange={e => setThemeId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">🎨 Tutti i temi</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.iconEmoji} {t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <Spinner />}

      {!loading && searched && query.trim() && (
        <>
          {totalResults === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🌱</p>
              <p style={{ color: 'var(--text-muted)' }}>
                Nessun risultato per <strong>"{query}"</strong>
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>
                Prova con parole diverse o cambia il filtro
              </p>
            </div>
          ) : (
            <p className="text-sm px-1" style={{ color: 'var(--text-muted)' }}>
              {totalResults} risultat{totalResults === 1 ? 'o' : 'i'} per{' '}
              <strong>"{query}"</strong>
            </p>
          )}

          {/* Risultati: Persone */}
          {showUsers && results && results.users.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">👤 Persone</h2>
              <div className="space-y-2">
                {results.users.map(u => (
                  <div
                    key={u.id}
                    className="card flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <Link to={`/u/${u.username}`} className="shrink-0">
                      <Avatar user={u} size="md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <UserHoverCard username={u.username} displayName={u.displayName}>
                          <Link
                            to={`/u/${u.username}`}
                            className="font-semibold truncate hover:text-happy-600 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {u.displayName}
                          </Link>
                        </UserHoverCard>
                        {u.verified && <VerifiedBadge />}
                        {u.role !== 'USER' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700'
                              : u.role === 'MODERATOR'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {u.role === 'ADMIN' ? '👑 Admin' : u.role === 'MODERATOR' ? '🛡️ Mod' : '✅'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-faint)' }}>@{u.username}</p>
                    </div>
                    <Link to={`/u/${u.username}`} className="text-sm" style={{ color: 'var(--text-faint)' }}>→</Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Risultati: Alter Ego */}
          {showAlterEgos && results && results.alterEgos.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">🎭 Alter Ego</h2>
              <div className="space-y-2">
                {results.alterEgos.map(ae => (
                  <div
                    key={ae.id}
                    className="card flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <Link to={`/ae/${ae.id}`} className="shrink-0">
                      {ae.avatarUrl ? (
                        <img
                          src={ae.avatarUrl}
                          alt={ae.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base">
                          {ae.name[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/ae/${ae.id}`}
                        className="font-semibold truncate hover:text-happy-600 transition-colors block"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {ae.name}
                      </Link>
                      {ae.description && (
                        <p className="text-sm truncate" style={{ color: 'var(--text-faint)' }}>{ae.description}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        di{' '}
                        <UserHoverCard username={ae.owner.username} displayName={ae.owner.displayName}>
                          <Link
                            to={`/u/${ae.owner.username}`}
                            className="hover:text-happy-600 transition-colors"
                            style={{ color: 'var(--text-faint)' }}
                          >
                            @{ae.owner.username}
                          </Link>
                        </UserHoverCard>
                      </p>
                    </div>
                    <Link to={`/ae/${ae.id}`} className="text-sm" style={{ color: 'var(--text-faint)' }}>→</Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Risultati: Contenuti */}
          {showContents && results && results.contents.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">📝 Contenuti</h2>
              <div className="space-y-4">
                {results.contents.map(c => (
                  <ContentCard key={c.id} content={c} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Stato iniziale */}
      {!searched && !loading && (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Cosa stai cercando?</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-faint)' }}>
            Digita per cercare contenuti, persone o alter ego
          </p>
          <div className="flex justify-center gap-3 mt-5 flex-wrap">
            {themes.slice(0, 5).map(t => (
              <button
                key={t.id}
                onClick={() => { setTab('CONTENT'); setThemeId(t.id) }}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm hover:bg-amber-100 transition-colors"
              >
                {t.iconEmoji} {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
