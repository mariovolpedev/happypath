import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createContent } from '../api/content'
import { useThemes } from '../hooks/useThemes'
import { useAuthStore } from '../store/authStore'
import PublisherPicker from '../components/content/PublisherPicker'
import MediaUploader from '../components/content/MediaUploader'

export default function CreateContentPage() {
  const [form, setForm]             = useState({ title: '', body: '', themeId: '' })
  const [mediaUrl, setMediaUrl]     = useState('')
  const [alterEgoId, setAlterEgoId] = useState<number | undefined>(undefined)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  // Modalità inserimento media: 'upload' (default) | 'url'
  const [mediaMode, setMediaMode]   = useState<'upload' | 'url'>('upload')
  const navigate                    = useNavigate()
  const themes                      = useThemes()
  const { user }                    = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const c = await createContent({
        title:      form.title,
        body:       form.body || undefined,
        mediaUrl:   mediaUrl || undefined,
        themeId:    form.themeId ? Number(form.themeId) : undefined,
        alterEgoId,
      })
      navigate(`/content/${c.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Errore durante la pubblicazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="font-display text-2xl font-bold mb-2">✨ Nuovo contenuto</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ricorda: HappyPath è uno spazio per contenuti <strong>semplici e felici</strong>. 🌻
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titolo */}
          <input
            className="input"
            placeholder="Titolo *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            maxLength={200}
          />

          {/* Testo */}
          <textarea
            className="input min-h-[120px] resize-none"
            placeholder="Racconta qualcosa di positivo..."
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          />

          {/* ── Sezione Media ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Media (opzionale)</span>
              {/* Toggle upload / URL */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setMediaMode('upload'); setMediaUrl('') }}
                  className={`px-3 py-1.5 transition-colors ${
                    mediaMode === 'upload'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  📁 Carica file
                </button>
                <button
                  type="button"
                  onClick={() => { setMediaMode('url'); setMediaUrl('') }}
                  className={`px-3 py-1.5 transition-colors ${
                    mediaMode === 'url'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  🔗 Inserisci URL
                </button>
              </div>
            </div>

            {mediaMode === 'upload' ? (
              <MediaUploader
                value={mediaUrl}
                onChange={(url) => setMediaUrl(url)}
                disabled={loading}
              />
            ) : (
              <input
                className="input"
                placeholder="https://esempio.com/immagine.jpg"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                type="url"
              />
            )}
          </div>

          {/* Tema */}
          <select
            className="input"
            value={form.themeId}
            onChange={e => setForm(f => ({ ...f, themeId: e.target.value }))}
          >
            <option value="">Scegli un tema (opzionale)</option>
            {themes.map(t => (
              <option key={t.id} value={t.id}>
                {t.iconEmoji} {t.name}
              </option>
            ))}
          </select>

          {/* Publisher Picker — solo utenti verified */}
          {user?.verified && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
              <PublisherPicker
                user={user as any}
                selectedAlterEgoId={alterEgoId}
                onChange={setAlterEgoId}
                label="Pubblica come:"
              />
              {alterEgoId !== undefined && (
                <p className="text-xs text-purple-500">
                  🎭 Il contenuto sarà pubblicato con il tuo alter ego. La tua identità reale resterà privata.
                </p>
              )}
            </div>
          )}

          {/* Linee guida */}
          <div className="bg-sunny-50 border border-sunny-100 rounded-xl p-4 text-sm text-gray-600">
            <strong>📋 Linee guida:</strong> Evita violenza, contenuti offensivi, terrore, angoscia
            e tutto ciò che non mette di buon umore.
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1 justify-center"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !form.title}
              className="btn-primary flex-1 justify-center"
            >
              {loading
                ? 'Pubblicazione...'
                : alterEgoId !== undefined
                ? '🎭 Pubblica come Alter Ego'
                : '🚀 Pubblica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
