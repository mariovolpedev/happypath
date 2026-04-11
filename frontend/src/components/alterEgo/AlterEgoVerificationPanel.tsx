import { useState, useEffect } from 'react'
import {
  getPendingVerifications,
  reviewVerificationRequest,
} from '../../api/alterEgoVerification'
import type { AlterEgoVerificationResponse } from '../../types'
import Spinner from '../common/Spinner'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export default function AlterEgoVerificationPanel() {
  const [requests, setRequests]     = useState<AlterEgoVerificationResponse[]>([])
  const [selected, setSelected]     = useState<AlterEgoVerificationResponse | null>(null)
  const [note, setNote]             = useState('')
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getPendingVerifications()
      setRequests(data.content)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDecision = async (approved: boolean) => {
    if (!selected) return
    setSubmitting(true)
    try {
      await reviewVerificationRequest(selected.id, approved, note || undefined)
      setRequests(prev => prev.filter(r => r.id !== selected.id))
      setFeedback(approved ? '✅ Richiesta approvata.' : '❌ Richiesta rifiutata.')
      setSelected(null)
      setNote('')
    } catch (err: any) {
      setFeedback(err.response?.data?.message ?? 'Errore durante la revisione.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lista richieste */}
      <div>
        <h2 className="font-display font-bold text-lg mb-3">
          🪪 Verifiche Alter Ego in attesa
        </h2>

        {feedback && (
          <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm">
            {feedback}
          </div>
        )}

        {requests.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-faint)' }}>
            Nessuna richiesta in attesa 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <button
                key={r.id}
                onClick={() => { setSelected(r); setNote(''); setFeedback('') }}
                className={`card w-full text-left hover:shadow-md transition-shadow ${
                  selected?.id === r.id ? 'ring-2 ring-happy-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">🎭 {r.alterEgo.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: it })}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Richiedente: @{r.requester.username}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dettaglio + azioni */}
      {selected && (
        <div className="card sticky top-24 h-fit space-y-4">
          <h3 className="font-display font-bold text-base">
            Dettaglio richiesta #{selected.id}
          </h3>

          {/* Alter Ego */}
          <div className="rounded-xl p-3 text-sm space-y-1"
               style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <p className="font-semibold">🎭 Alter Ego</p>
            <p><span style={{ color: 'var(--text-muted)' }}>Nome:</span> {selected.alterEgo.name}</p>
            {selected.alterEgo.description && (
              <p><span style={{ color: 'var(--text-muted)' }}>Descrizione:</span> {selected.alterEgo.description}</p>
            )}
            <p>
              <span style={{ color: 'var(--text-muted)' }}>Proprietario:</span>{' '}
              @{selected.requester.username} — {selected.requester.displayName}
            </p>
          </div>

          {/* Dati anagrafici */}
          <div className="bg-amber-50 rounded-xl p-3 text-sm space-y-1">
            <p className="font-semibold text-amber-900">🪪 Dati anagrafici dichiarati</p>
            <p>
              <span className="text-amber-700">Nominativo:</span>{' '}
              <strong className="text-amber-900">{selected.firstName} {selected.lastName}</strong>
            </p>
            {selected.birthDate && (
              <p>
                <span className="text-amber-700">Data di nascita:</span>{' '}
                <span className="text-amber-900">
                  {new Date(selected.birthDate).toLocaleDateString('it-IT')}
                </span>
              </p>
            )}
            <p>
              <span className="text-amber-700">Comune di nascita:</span>{' '}
              <span className="text-amber-900">{selected.birthPlace}</span>
            </p>
            <p className="pt-1">
              <span className="text-amber-700 text-xs">CF: </span>
              <span className="font-mono tracking-widest text-base text-amber-900">
                {selected.codiceFiscale}
              </span>
            </p>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            ℹ️ Verifica che il codice fiscale corrisponda ai dati anagrafici e al profilo
            già verificato dell'utente prima di approvare.
          </p>

          {/* Note */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Note (facoltative per l'approvazione, consigliate per il rifiuto)
            </label>
            <textarea
              className="input resize-none h-20"
              placeholder="Es: dati non corrispondenti al profilo…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDecision(false)}
              disabled={submitting}
              className="bg-red-100 text-red-700 rounded-full px-4 py-2 text-sm font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              ❌ Rifiuta
            </button>
            <button
              onClick={() => handleDecision(true)}
              disabled={submitting}
              className="bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-semibold hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              ✅ Approva
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
