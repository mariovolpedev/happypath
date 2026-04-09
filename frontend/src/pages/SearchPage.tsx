import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { searchAll } from '../api/search'
import type { SearchResult, SearchType } from '../api/search'
import ContentCard from '../components/content/ContentCard'
import Avatar from '../components/common/Avatar'
import VerifiedBadge from '../components/common/VerifiedBadge'
import Spinner from '../components/common/Spinner'
import { useThemes } from '../hooks/useThemes'
import { deleteContent } from '../api/content'

type TabType = 'ALL' | SearchType

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'ALL', label: 'Tutto', emoji: '✨' },
  { id: 'CONTENT', label: 'Contenuti', emoji: '📝' },
  { id: 'USER', label: 'Persone', emoji: '👤' },
  { id: 'ALTER_EGO', label: 'Alter Ego', emoji: '🎭' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQ = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQ)
  const [tab, setTab] = useState<TabType>('ALL')
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

  // Debounce automatico mentre si digita
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, tab, themeId)
      if (query.trim()) setSearchParams({ q: query.trim() }, { replace: true })
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, tab, themeId, doSearch])

  // Carica dalla URL al primo render
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

  const showContents = tab === 'ALL' || tab === 'CONTENT'
  const showUsers = tab === 'ALL' || tab === 'USER'
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

        {/* Filtro tema (solo per contenuti) */}
        {(tab === 'ALL' || tab === 'CONTENT') && themes.length > 0 && (
          <div className="mt-3">
            <select
              className="input text-sm"
              value={themeId ?? ''}
              onChange={e => setThemeId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">🎨 Tutti i temi</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.iconEmoji} {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stato ricerca */}
      {loading && <Spinner />}

      {!loading && searched && query.trim() && (
        <>
          {totalResults === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🌱</p>
              <p className="text-gray-500">
                Nessun risultato per <strong>"{query}"</strong>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Prova con parole diverse o cambia il filtro
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 px-1">
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
                  <Link
                    key={u.id}
                    to={`/u/${u.username}`}
                    className="card flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <Avatar user={u} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800 truncate">
                          {u.displayName}
                        </span>
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
                      <p className="text-gray-400 text-sm">@{u.username}</p>
                    </div>
                    <span className="text-gray-300 text-sm">→</span>
                  </Link>
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
                  <Link
                    key={ae.id}
                    to={`/u/${ae.owner.username}`}
                    className="card flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
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
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{ae.name}</p>
                      {ae.description && (
                        <p className="text-gray-400 text-sm truncate">{ae.description}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-0.5">
                        di @{ae.owner.username}
                      </p>
                    </div>
                    <span className="text-gray-300 text-sm">→</span>
                  </Link>
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
          <p className="text-gray-500 text-lg font-medium">Cosa stai cercando?</p>
          <p className="text-gray-400 text-sm mt-2">
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
