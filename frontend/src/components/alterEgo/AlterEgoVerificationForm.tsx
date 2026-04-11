import { useState } from 'react'
import type { AlterEgoResponse } from '../../types'
import { submitVerificationRequest } from '../../api/alterEgoVerification'

interface Props {
  alterEgo: AlterEgoResponse
  onClose: () => void
  onSuccess: () => void
}

function isValidCF(cf: string): boolean {
  return /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1}$/.test(
    cf.toUpperCase()
  )
}

export default function AlterEgoVerificationForm({ alterEgo, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', birthDate: '', birthPlace: '', codiceFiscale: '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const cf = form.codiceFiscale.toUpperCase().trim()
    if (!isValidCF(cf)) { setError('Il codice fiscale inserito non è valido.'); return }
    setLoading(true)
    try {
      await submitVerificationRequest({
        alterEgoId: alterEgo.id,
        firstName:  form.firstName.trim(),
        lastName:   form.lastName.trim(),
        birthDate:  form.birthDate,
        birthPlace: form.birthPlace.trim(),
        codiceFiscale: cf,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Errore durante l\'invio della richiesta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="rounded-2xl shadow-xl w-full max-w-md p-6"
           style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-display font-bold text-xl mb-1">🪪 Richiesta di verifica</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Alter Ego: <strong>{alterEgo.name}</strong>
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 mb-5">
          I dati anagrafici e il codice fiscale verranno confrontati con quelli del tuo profilo
          verificato. Non saranno visibili pubblicamente.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome *</label>
              <input className="input" placeholder="Mario" value={form.firstName}
                onChange={set('firstName')} required maxLength={100} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Cognome *</label>
              <input className="input" placeholder="Rossi" value={form.lastName}
                onChange={set('lastName')} required maxLength={100} />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Data di nascita *</label>
            <input className="input" type="date" value={form.birthDate}
              onChange={set('birthDate')} required />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Comune di nascita *</label>
            <input className="input" placeholder="Roma" value={form.birthPlace}
              onChange={set('birthPlace')} required maxLength={100} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Codice Fiscale *</label>
            <input
              className="input uppercase tracking-widest font-mono"
              placeholder="RSSMRA80A01H501U"
              value={form.codiceFiscale}
              onChange={e => setForm(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }))}
              required minLength={16} maxLength={16}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Annulla
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Invio…' : '📨 Invia richiesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
