import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createContent } from '../api/content'
import { useThemes } from '../hooks/useThemes'

export default function CreateContentPage() {
  const [form, setForm] = useState({ title: '', body: '', mediaUrl: '', themeId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const themes = useThemes()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const c = await createContent({
        title: form.title, body: form.body || undefined,
        mediaUrl: form.mediaUrl || undefined,
        themeId: form.themeId ? Number(form.themeId) : undefined
      })
      navigate(`/content/${c.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Errore durante la pubblicazione')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="font-display text-2xl font-bold mb-2">✨ Nuovo contenuto</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ricorda: HappyPath è uno spazio per contenuti <strong>semplici e felici</strong>. 🌻
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" placeholder="Titolo *" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={200} />
          <textarea className="input min-h-[140px] resize-none" placeholder="Racconta qualcosa di positivo..."
            value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          <input className="input" placeholder="URL immagine/video (opzionale)"
            value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} />
          <select className="input" value={form.themeId}
            onChange={e => setForm(f => ({ ...f, themeId: e.target.value }))}>
            <option value="">Scegli un tema (opzionale)</option>
            {themes.map(t => <option key={t.id} value={t.id}>{t.iconEmoji} {t.name}</option>)}
          </select>

          {/* HappyPath reminder */}
          <div className="bg-sunny-50 border border-sunny-100 rounded-xl p-4 text-sm text-gray-600">
            <strong>📋 Linee guida:</strong> Evita violenza, contenuti offensivi, terrore, angoscia e tutto ciò che non mette di buon umore.
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 justify-center">Annulla</button>
            <button type="submit" disabled={loading || !form.title} className="btn-primary flex-1 justify-center">
              {loading ? 'Pubblicazione...' : '🚀 Pubblica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
