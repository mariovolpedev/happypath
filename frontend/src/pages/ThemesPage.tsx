import { useState, useEffect } from 'react'
import { getAllThemes, createTheme, followTheme, unfollowTheme } from '../api/themes'
import type { ThemeResponse } from '../types'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'

export default function ThemesPage() {
  const { isAuthenticated } = useAuthStore()
  const authed = isAuthenticated()

  const [themes, setThemes]     = useState<ThemeResponse[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'all' | 'preset' | 'custom'>('all')
  const [search, setSearch]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]         = useState({ name: '', description: '', iconEmoji: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAllThemes(0, 100)
      setThemes(data.content)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = themes.filter(t => {
    const matchesTab = tab === 'all' || (tab === 'preset' ? t.preset : !t.preset)
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleFollow = async (t: ThemeResponse) => {
    if (!authed) return
    if (t.followedByMe) {
      await unfollowTheme(t.id)
    } else {
      await followTheme(t.id)
    }
    setThemes(prev => prev.map(x => x.id === t.id
      ? { ...x, followedByMe: !x.followedByMe, followersCount: x.followersCount + (x.followedByMe ? -1 : 1) }
      : x
    ))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const created = await createTheme({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        iconEmoji: form.iconEmoji.trim() || undefined,
      })
      setThemes(prev => [created, ...prev])
      setForm({ name: '', description: '', iconEmoji: '' })
      setShowCreate(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore durante la creazione')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-800">🏷️ Temi</h1>
        {authed && (
          <button onClick={() => setShowCreate(v => !v)} className="btn-primary">
            {showCreate ? 'Annulla' : '+ Nuovo tema'}
          </button>
        )}
      </div>

      {/* Form creazione */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">Crea un tema personalizzato</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <input
              className="input w-16 text-center text-xl"
              placeholder="🎭"
              maxLength={2}
              value={form.iconEmoji}
              onChange={e => setForm(f => ({ ...f, iconEmoji: e.target.value }))}
            />
            <input
              className="input flex-1"
              placeholder="Nome del tema *"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <textarea
            className="input w-full resize-none"
            rows={2}
            placeholder="Descrizione (opzionale)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Salvataggio...' : 'Crea tema'}
          </button>
        </form>
      )}

      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          className="input flex-1"
          placeholder="Cerca tema..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(['all', 'preset', 'custom'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-hp-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'Tutti' : t === 'preset' ? '⭐ Predefiniti' : '👤 Custom'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(theme => (
            <div key={theme.id} className="card flex items-start justify-between gap-3">
              <Link to={`/explore?theme=${theme.id}`} className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <span className="text-2xl flex-shrink-0">{theme.iconEmoji || '🏷️'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {theme.name}
                    {theme.preset && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">preset</span>}
                  </p>
                  {theme.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{theme.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{theme.followersCount} follower</p>
                </div>
              </Link>
              {authed && (
                <button
                  onClick={() => handleFollow(theme)}
                  className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    theme.followedByMe
                      ? 'bg-hp-primary text-white hover:bg-hp-primary/80'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {theme.followedByMe ? '✓ Seguito' : '+ Segui'}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 card text-center py-10 text-gray-500">
              Nessun tema trovato.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
