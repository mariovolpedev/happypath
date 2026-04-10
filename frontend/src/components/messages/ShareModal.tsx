import { useState } from 'react'
import { search } from '../../api/users'
import { getFeed } from '../../api/content'
import type { UserSummary, ContentResponse } from '../../types'
import Avatar from '../common/Avatar'

type Mode = 'content' | 'profile'

interface Props {
  onSelect: (type: 'content' | 'profile', id: number) => void
  onClose: () => void
}

export default function ShareModal({ onSelect, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('content')
  const [query, setQuery] = useState('')
  const [contentResults, setContentResults] = useState<ContentResponse[]>([])
  const [userResults, setUserResults] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setContentResults([])
      setUserResults([])
      return
    }
    setLoading(true)
    try {
      if (mode === 'content') {
        const data = await getFeed(0)
        const filtered = data.content.filter(
          (c) =>
            c.title.toLowerCase().includes(q.toLowerCase()) ||
            (c.body ?? '').toLowerCase().includes(q.toLowerCase())
        )
        setContentResults(filtered.slice(0, 6))
      } else {
        const users = await search(q)
        setUserResults(users.slice(0, 6))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">Condividi nel messaggio</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
          <button
            onClick={() => { setMode('content'); setQuery(''); setContentResults([]); setUserResults([]) }}
            className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'content' ? 'bg-white shadow text-happy-700' : 'text-gray-500'
            }`}
          >
            📄 Contenuto
          </button>
          <button
            onClick={() => { setMode('profile'); setQuery(''); setContentResults([]); setUserResults([]) }}
            className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'profile' ? 'bg-white shadow text-happy-700' : 'text-gray-500'
            }`}
          >
            👤 Profilo
          </button>
        </div>

        {/* Search input */}
        <input
          className="input mb-3"
          placeholder={mode === 'content' ? 'Cerca un contenuto…' : 'Cerca un utente…'}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />

        {/* Results */}
        <div className="overflow-y-auto flex-1 space-y-2">
          {loading && (
            <p className="text-center text-gray-400 text-sm py-4">Ricerca…</p>
          )}

          {mode === 'content' &&
            contentResults.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect('content', c.id)}
                className="w-full text-left flex gap-3 p-3 rounded-xl hover:bg-happy-50 border border-transparent hover:border-happy-200 transition-colors"
              >
                {c.mediaUrl ? (
                  <img src={c.mediaUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
                    {c.theme?.iconEmoji ?? '📄'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                  {c.body && (
                    <p className="text-xs text-gray-500 truncate">{c.body}</p>
                  )}
                  <p className="text-xs text-gray-400">di {c.author.displayName}</p>
                </div>
              </button>
            ))}

          {mode === 'profile' &&
            userResults.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect('profile', u.id)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-happy-50 border border-transparent hover:border-happy-200 transition-colors"
              >
                <Avatar user={u} size="md" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm text-gray-900">{u.displayName}</span>
                    {u.verified && <span className="text-xs text-blue-500">✅</span>}
                  </div>
                  <p className="text-xs text-gray-400">@{u.username}</p>
                </div>
              </button>
            ))}

          {!loading && query && contentResults.length === 0 && userResults.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">Nessun risultato</p>
          )}
          {!query && (
            <p className="text-center text-gray-400 text-sm py-6">
              {mode === 'content'
                ? 'Inizia a digitare per cercare contenuti…'
                : 'Inizia a digitare per cercare utenti…'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
