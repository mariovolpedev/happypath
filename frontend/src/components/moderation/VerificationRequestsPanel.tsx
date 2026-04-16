import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  getPendingVerificationRequests,
  approveVerification,
  rejectVerification,
  VerificationRequestResponse,
} from '../../api/verification'

interface Props {
  onCountChange?: (n: number) => void
}

export default function VerificationRequestsPanel({ onCountChange }: Props) {
  const [requests,  setRequests]  = useState<VerificationRequestResponse[]>([])
  const [selected,  setSelected]  = useState<VerificationRequestResponse | null>(null)
  const [note,      setNote]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [fetching,  setFetching]  = useState(true)
  const [page,      setPage]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = (p = 0) => {
    setFetching(true)
    getPendingVerificationRequests(p)
      .then((data: any) => {
        setRequests(data.content ?? [])
        setTotalPages(data.totalPages ?? 0)
        setPage(p)
        onCountChange?.(data.totalElements ?? 0)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }

  useEffect(() => { load(0) }, [])

  const remove = (id: number) => {
    setRequests(r => r.filter(x => x.id !== id))
    if (selected?.id === id) { setSelected(null); setNote('') }
    onCountChange?.(Math.max(0, requests.length - 1))
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return
    setLoading(true)
    try {
      if (action === 'approve') await approveVerification(selected.id, note || undefined)
      else                      await rejectVerification(selected.id, note || undefined)
      remove(selected.id)
    } finally {
      setLoading(false)
    }
  }

  const fieldRow = (label: string, value: string) => (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* ── Lista ── */}
      <div className="space-y-2">
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          {fetching ? 'Caricamento…' : requests.length === 0
            ? 'Nessuna richiesta in attesa 🎉'
            : `${requests.length} richiest${requests.length === 1 ? 'a' : 'e'} in attesa`}
        </p>

        {fetching && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-happy-200 border-t-happy-500 rounded-full animate-spin" />
          </div>
        )}

        {!fetching && requests.length === 0 && (
          <div className="card text-center py-12" style={{ color: 'var(--text-faint)' }}>
            <p className="text-3xl mb-2">✅</p>
            <p className="font-medium">Tutto in ordine!</p>
            <p className="text-sm mt-1">Nessuna richiesta di verifica da processare.</p>
          </div>
        )}

        {requests.map(r => (
          <button key={r.id}
            onClick={() => { setSelected(r); setNote('') }}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${
              selected?.id === r.id
                ? 'border-happy-400 bg-happy-50 shadow-sm'
                : 'hover:shadow-sm'
            }`}
            style={selected?.id !== r.id ? {
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            } : undefined}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                VERIFICA
              </span>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-faint)' }}>
                {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: it })}
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {r.firstName} {r.lastName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              @{r.username}
            </p>
          </button>
        ))}

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              disabled={page === 0}
              onClick={() => load(page - 1)}
              className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
            >← Prec</button>
            <span className="text-xs self-center" style={{ color: 'var(--text-faint)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => load(page + 1)}
              className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
            >Succ →</button>
          </div>
        )}
      </div>

      {/* ── Dettaglio ── */}
      {selected ? (
        <div className="card space-y-5 sticky top-24">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">
              Richiesta #{selected.id}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              PENDING
            </span>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-faint)' }}>Dati utente</h3>
            {fieldRow('Username', `@${selected.username}`)}
            {fieldRow('Nome', `${selected.firstName} ${selected.lastName}`)}
            {fieldRow('Nascita', selected.birthDate)}
            {fieldRow('Luogo', selected.birthPlace)}
            {fieldRow('Genere', selected.gender)}
            {fieldRow('C.F.', selected.fiscalCode)}
            {fieldRow('Inviata', new Date(selected.createdAt).toLocaleString('it-IT'))}
          </section>

          <section className="space-y-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wide"
              style={{ color: 'var(--text-faint)' }}>Decisione</h3>

            <textarea
              className="input resize-none h-20 text-sm"
              placeholder="Nota opzionale per l'utente…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="rounded-full px-4 py-2.5 text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                ✅ Approva
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="rounded-full px-4 py-2.5 text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                ❌ Rifiuta
              </button>
            </div>

            {loading && (
              <p className="text-center text-sm animate-pulse" style={{ color: 'var(--text-faint)' }}>
                Azione in corso…
              </p>
            )}
          </section>
        </div>
      ) : (
        <div className="card text-center py-16 sticky top-24" style={{ color: 'var(--text-faint)' }}>
          <p className="text-3xl mb-3">👈</p>
          <p className="font-medium">Seleziona una richiesta per vedere i dettagli</p>
        </div>
      )}
    </div>
  )
}
