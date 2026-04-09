import { useState } from 'react'
import { createReport } from '../../api/moderation'
import type { ReportTarget } from '../../types'

interface Props {
  targetType: ReportTarget
  targetId: number
  targetLabel?: string
  onClose: () => void
}

const REASONS_PRESET = [
  'Non rispetta le linee guida (contenuti negativi/violenti)',
  'Contenuto offensivo o irrispettoso',
  'Spam o contenuto ripetitivo',
  'Non pertinente alla piattaforma (non felice/positivo)',
  'Altro (descrivo nel campo qui sotto)',
]

export default function ReportModal({ targetType, targetId, targetLabel, onClose }: Props) {
  const [preset, setPreset]   = useState('')
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const finalReason = preset === REASONS_PRESET[4] ? reason : (preset || reason)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalReason.trim()) return
    setLoading(true)
    setError('')
    try {
      await createReport(targetType, targetId, finalReason)
      setSuccess(true)
      setTimeout(onClose, 2200)
    } catch {
      setError('Errore durante l\'invio della segnalazione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const targetLabel_ =
    targetLabel ??
    (targetType === 'CONTENT' ? 'questo contenuto' :
     targetType === 'USER'    ? 'questo utente' :
                                'questo commento')

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            🚩 Segnala {targetLabel_}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-gray-800">Segnalazione inviata!</p>
              <p className="text-sm text-gray-500 mt-1">
                Il nostro team esaminerà la segnalazione al più presto. Grazie per aiutarci a mantenere HappyPath positivo!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">
                Seleziona il motivo o descrivilo tu stesso. Le segnalazioni sono anonime.
              </p>

              {/* Motivi predefiniti */}
              <div className="space-y-2">
                {REASONS_PRESET.map(r => (
                  <label
                    key={r}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      preset === r
                        ? 'border-happy-400 bg-happy-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="preset"
                      value={r}
                      checked={preset === r}
                      onChange={() => { setPreset(r); if (r !== REASONS_PRESET[4]) setReason('') }}
                      className="mt-0.5 accent-green-500"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>

              {/* Campo libero (solo se "Altro" selezionato o nessun preset) */}
              {(preset === REASONS_PRESET[4] || preset === '') && (
                <textarea
                  className="input resize-none h-24"
                  placeholder={
                    preset === REASONS_PRESET[4]
                      ? 'Descrivi il problema...'
                      : 'Oppure scrivi direttamente il motivo...'
                  }
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  maxLength={500}
                />
              )}

              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  ⚠️ {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1 justify-center"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading || !finalReason.trim()}
                  className="btn-primary flex-1 justify-center"
                >
                  {loading ? 'Invio in corso...' : '🚩 Invia segnalazione'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
