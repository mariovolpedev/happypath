import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyAlterEgos, createAlterEgo, deleteAlterEgo } from '../api/alterEgos'
import type { AlterEgoResponse } from '../types'
import Spinner from '../components/common/Spinner'

export default function AlterEgoPage() {
  const [alterEgos, setAlterEgos] = useState<AlterEgoResponse[]>([])
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [showNew,   setShowNew]   = useState(false)
  const [form,      setForm]      = useState({ name: '', description: '', avatarUrl: '' })
  const [error,     setError]     = useState('')

  useEffect(() => {
    getMyAlterEgos().then(setAlterEgos).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      const ae = await createAlterEgo({
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        avatarUrl:   form.avatarUrl.trim()   || undefined,
      })
      setAlterEgos(prev => [...prev, ae])
      setForm({ name: '', description: '', avatarUrl: '' })
      setShowNew(false)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Errore durante la creazione.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo Alter Ego? I contenuti pubblicati come tale resteranno visibili.'))
      return
    await deleteAlterEgo(id)
    setAlterEgos(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            🎭 I miei Alter Ego
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Identità alternative con cui pubblicare contenuti, commentare, reagire e inviare
            messaggi. Disponibili solo per utenti verificati ✅.
          </p>
        </div>
        <button
          onClick={() => { setShowNew(s => !s); setError('') }}
          className="btn-primary text-sm shrink-0"
        >
          {showNew ? 'Annulla' : '+ Nuovo'}
        </button>
      </div>

      {showNew && (
        <div className="card border-2 border-dashed border-happy-300">
          <h2 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            Nuovo Alter Ego
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input className="input" placeholder="Nome *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required maxLength={80} />
            <input className="input" placeholder="Descrizione (opzionale)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={300} />
            <input className="input" placeholder="URL avatar (opzionale)" value={form.avatarUrl}
              onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={creating || !form.name.trim()}
              className="btn-primary w-full justify-center">
              {creating ? 'Creazione…' : '🎭 Crea Alter Ego'}
            </button>
          </form>
        </div>
      )}

      {alterEgos.length === 0 && !showNew && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🎭</p>
          <p style={{ color: 'var(--text-faint)' }}>Nessun Alter Ego ancora. Creane uno!</p>
        </div>
      )}

      <div className="space-y-3">
        {alterEgos.map(ae => (
          <div key={ae.id} className="card flex items-center gap-4">
            {ae.avatarUrl ? (
              <img src={ae.avatarUrl} alt={ae.name}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center
                             text-2xl font-bold flex-shrink-0"
                style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
                {ae.name[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link to={`/ae/${ae.id}`}
                className="font-display font-bold text-base hover:text-happy-600 transition-colors"
                style={{ color: 'var(--text-primary)' }}>
                {ae.name}
              </Link>
              {ae.description && (
                <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {ae.description}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                Puoi pubblicare, commentare, reagire e scrivere messaggi come questo Alter Ego
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 items-end">
              <Link to={`/ae/${ae.id}`} className="btn-secondary text-xs">
                Profilo pubblico
              </Link>
              <button onClick={() => handleDelete(ae.id)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors">
                🗑️ Elimina
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
