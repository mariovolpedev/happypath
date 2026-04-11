import { useState, useEffect } from 'react'
import { getMyAlterEgos, createAlterEgo, deleteAlterEgo } from '../api/alterEgos'
import { getMyVerificationRequests } from '../api/alterEgoVerification'
import type { AlterEgoResponse, AlterEgoVerificationResponse } from '../types'
import AlterEgoVerificationForm from '../components/alterEgo/AlterEgoVerificationForm'
import AlterEgoVerifiedBadge from '../components/common/AlterEgoVerifiedBadge'
import Spinner from '../components/common/Spinner'

const STATUS_LABEL: Record<string, string> = {
  PENDING:  '⏳ In attesa',
  APPROVED: '✅ Approvata',
  REJECTED: '❌ Rifiutata',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100  text-green-700',
  REJECTED: 'bg-red-100    text-red-700',
}

export default function AlterEgoPage() {
  const [alterEgos, setAlterEgos]         = useState<AlterEgoResponse[]>([])
  const [verifications, setVerifications] = useState<AlterEgoVerificationResponse[]>([])
  const [loading, setLoading]             = useState(true)
  const [creating, setCreating]           = useState(false)
  const [newForm, setNewForm] = useState({ name: '', description: '', avatarUrl: '' })
  const [newError, setNewError] = useState('')
  const [showNew, setShowNew]  = useState(false)
  const [verifyTarget, setVerifyTarget] = useState<AlterEgoResponse | null>(null)
  const [feedback, setFeedback]         = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [aes, vers] = await Promise.all([
        getMyAlterEgos(),
        getMyVerificationRequests(),
      ])
      setAlterEgos(aes)
      setVerifications(vers.content)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewError('')
    setCreating(true)
    try {
      const ae = await createAlterEgo({
        name:        newForm.name.trim(),
        description: newForm.description.trim() || undefined,
        avatarUrl:   newForm.avatarUrl.trim()   || undefined,
      })
      setAlterEgos(prev => [...prev, ae])
      setNewForm({ name: '', description: '', avatarUrl: '' })
      setShowNew(false)
    } catch (err: any) {
      setNewError(err.response?.data?.message ?? 'Errore durante la creazione.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo Alter Ego?')) return
    await deleteAlterEgo(id)
    setAlterEgos(prev => prev.filter(a => a.id !== id))
  }

  const lastVer = (aeId: number) =>
    verifications.find(v => v.alterEgo.id === aeId)

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            🎭 I miei Alter Ego
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Crea e gestisci le tue identità alternative. La verifica richiede
            l'incrocio dei tuoi dati anagrafici con il codice fiscale.
          </p>
        </div>
        <button
          onClick={() => { setShowNew(s => !s); setNewError('') }}
          className="btn-primary text-sm shrink-0"
        >
          {showNew ? 'Annulla' : '+ Nuovo'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
          {feedback}
        </div>
      )}

      {/* Form nuovo Alter Ego */}
      {showNew && (
        <div className="card border-2 border-dashed border-happy-300">
          <h2 className="font-display font-semibold text-base mb-4">Nuovo Alter Ego</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              className="input" placeholder="Nome *"
              value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              required maxLength={80}
            />
            <input
              className="input" placeholder="Descrizione (opzionale)"
              value={newForm.description}
              onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
              maxLength={300}
            />
            <input
              className="input" placeholder="URL avatar (opzionale)"
              value={newForm.avatarUrl}
              onChange={e => setNewForm(f => ({ ...f, avatarUrl: e.target.value }))}
            />
            {newError && <p className="text-red-500 text-sm">{newError}</p>}
            <button
              type="submit" disabled={creating || !newForm.name.trim()}
              className="btn-primary w-full justify-center"
            >
              {creating ? 'Creazione…' : '🎭 Crea Alter Ego'}
            </button>
          </form>
        </div>
      )}

      {/* Lista Alter Ego */}
      {alterEgos.length === 0 && !showNew && (
        <p className="text-center py-12" style={{ color: 'var(--text-faint)' }}>
          Nessun Alter Ego ancora. Creane uno! 🎭
        </p>
      )}

      <div className="space-y-4">
        {alterEgos.map(ae => {
          const ver       = lastVer(ae.id)
          const canVerify = !ae.verified && ver?.status !== 'PENDING'

          return (
            <div key={ae.id} className="card">
              <div className="flex items-start gap-4">
                {ae.avatarUrl
                  ? <img src={ae.avatarUrl} alt={ae.name}
                      className="w-14 h-14 rounded-full object-cover shrink-0" />
                  : <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-bold shrink-0">
                      {ae.name[0]}
                    </div>
                }

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-base"
                          style={{ color: 'var(--text-primary)' }}>
                      {ae.name}
                    </span>
                    {ae.verified && <AlterEgoVerifiedBadge />}
                  </div>
                  {ae.description && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {ae.description}
                    </p>
                  )}

                  {ver && (
                    <div className="mt-2">
                      <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLOR[ver.status]}`}>
                        {STATUS_LABEL[ver.status]}
                      </span>
                      {ver.reviewNote && ver.status === 'REJECTED' && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Motivazione: {ver.reviewNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {canVerify && (
                    <button
                      onClick={() => { setVerifyTarget(ae); setFeedback('') }}
                      className="btn-secondary text-xs"
                    >
                      🪪 Richiedi verifica
                    </button>
                  )}
                  {ver?.status === 'PENDING' && (
                    <span className="text-xs text-yellow-600 font-medium">In revisione…</span>
                  )}
                  <button
                    onClick={() => handleDelete(ae.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>

              {!ae.verified && !ver && (
                <div className="mt-3 bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                  ℹ️ La verifica conferma che sei il titolare di questo Alter Ego tramite i tuoi
                  dati anagrafici e codice fiscale. Una volta verificato, apparirà il badge
                  <strong> ✅ Verificato</strong> accanto al nome.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal form verifica */}
      {verifyTarget && (
        <AlterEgoVerificationForm
          alterEgo={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onSuccess={() => {
            setVerifyTarget(null)
            setFeedback('Richiesta inviata! I moderatori la esamineranno a breve. ✉️')
            load()
          }}
        />
      )}
    </div>
  )
}
