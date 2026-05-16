import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'

type FormState = {
  username: string
  email: string
  password: string
  displayName: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  gender: 'M' | 'F' | ''
}

const APP_FEATURES = [
  {
    icon: '🌻',
    title: 'Solo buonumore',
    desc: 'Contenuti moderati: niente odio, solo storie positive.',
  },
  {
    icon: '🎭',
    title: 'Alter Ego',
    desc: 'Crea fino a 3 personalità digitali diverse.',
  },
  {
    icon: '🎨',
    title: 'Temi personalizzati',
    desc: 'Personalizza l\'aspetto con temi della community.',
  },
  {
    icon: '💌',
    title: 'Dediche speciali',
    desc: 'Dedica post e messaggi a chi vuoi bene.',
  },
  {
    icon: '✨',
    title: 'Feed su misura',
    desc: 'Scegli tu cosa vedere nel tuo feed.',
  },
  {
    icon: '🔒',
    title: 'Privacy totale',
    desc: 'Controllo completo sulla tua visibilità.',
  },
]

const TESTIMONIALS = [
  { name: 'Sofia R.', text: 'Finalmente un social che mi fa stare bene! 💛', emoji: '🌸' },
  { name: 'Davide M.', text: 'L\'Alter Ego è una feature geniale. Amo questa app!', emoji: '⭐' },
  { name: 'Chiara L.', text: 'La community più gentile che abbia mai trovato online.', emoji: '🌈' },
]

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    username: '', email: '', password: '', displayName: '',
    firstName: '', lastName: '', birthDate: '', birthPlace: '', gender: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { setAuth, markFirstLogin } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const fe: Record<string, string> = {}
    if (!form.displayName.trim()) fe.displayName = 'Il nome visualizzato è obbligatorio'
    else if (form.displayName.trim().length < 3) fe.displayName = 'Minimo 3 caratteri'
    if (!form.firstName.trim()) fe.firstName = 'Il nome è obbligatorio'
    if (!form.lastName.trim()) fe.lastName = 'Il cognome è obbligatorio'
    if (!form.birthPlace.trim()) fe.birthPlace = 'Il comune di nascita è obbligatorio'
    if (!form.gender) fe.gender = 'Il genere è obbligatorio'

    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return }

    setLoading(true)
    try {
      const data = await register({ ...form, gender: form.gender as 'M' | 'F' })

      // 1. Salva token + utente nello store
      setAuth(data.token, data.user)

      // 2. Attiva il tutorial se l'utente non lo ha ancora completato.
      //    markFirstLogin() legge get().user, ma per sicurezza controlliamo
      //    direttamente la risposta API così evitiamo race condition di store.
      if (!data.user.tutorialCompleted) {
        markFirstLogin()
      }

      // 3. Naviga alla home — il TutorialOverlay in App.tsx è già montato
      //    e showTutorial=true lo renderà subito visibile.
      navigate('/home')
    } catch (err: any) {
      const responseData = err.response?.data
      if (responseData && typeof responseData === 'object' && !responseData.message) {
        const mapped: Record<string, string> = {}
        for (const [field, msg] of Object.entries(responseData)) {
          mapped[field] = msg as string
        }
        setFieldErrors(mapped)
      } else {
        setError(responseData?.message ?? 'Errore durante la registrazione')
      }
    } finally {
      setLoading(false)
    }
  }

  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }))
    if (fieldErrors[k]) setFieldErrors(prev => ({ ...prev, [k]: '' }))
  }

  const inputCls = (key: string) =>
    `input${fieldErrors[key] ? ' border-red-400' : ''}`

  return (
    <div className="max-w-5xl mx-auto px-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── LEFT: App preview ── */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div>
            <div className="text-4xl mb-2">🌻</div>
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-base)' }}>
              Benvenuto su HappyPath
            </h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-base leading-relaxed">
              Il social network del benessere. Solo storie positive, solo buona energia.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3">
            {APP_FEATURES.map(feat => (
              <div key={feat.title} className="card p-3 flex gap-3 items-start" style={{ background: 'var(--surface-1)' }}>
                <span className="text-xl mt-0.5">{feat.icon}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-base)' }}>{feat.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Cosa dice la community</p>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card p-3 flex gap-3 items-start" style={{ background: 'var(--surface-1)' }}>
                <span className="text-xl">{t.emoji}</span>
                <div>
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>"{t.text}"</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-faint)' }}>— {t.name}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>✅ Gratuito &nbsp;·&nbsp; 🚫 Senza pubblicità &nbsp;·&nbsp; 🔒 Privacy first</p>
        </div>

        {/* ── RIGHT: Registration form ── */}
        <div className="card">
          <h2 className="font-display text-2xl font-bold mb-1 text-center">🌱 Inizia il tuo Happy Path!</h2>
          <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Crea il tuo account gratuito</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Account */}
            <div>
              <input className={inputCls('username')} placeholder="Username *" value={form.username}
                onChange={f('username')} required minLength={3} maxLength={50} />
              {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
            </div>
            <div>
              <input className={inputCls('email')} type="email" placeholder="Email *" value={form.email}
                onChange={f('email')} required />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <input className={inputCls('password')} type="password" placeholder="Password * (min. 8 caratteri)"
                value={form.password} onChange={f('password')} required minLength={8} />
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>
            <div>
              <input className={inputCls('displayName')} placeholder="Nome visualizzato * (es. Mario Rossi)"
                value={form.displayName} onChange={f('displayName')} required minLength={3} maxLength={80} />
              {fieldErrors.displayName && <p className="text-red-500 text-xs mt-1">{fieldErrors.displayName}</p>}
            </div>

            <hr className="border-gray-100" />
            <p className="text-xs -mt-1" style={{ color: 'var(--text-faint)' }}>
              🪪 Dati anagrafici — usati per la verifica identità
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input className={inputCls('firstName')} placeholder="Nome *" value={form.firstName}
                  onChange={f('firstName')} required minLength={2} maxLength={80} />
                {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <input className={inputCls('lastName')} placeholder="Cognome *" value={form.lastName}
                  onChange={f('lastName')} required minLength={2} maxLength={80} />
                {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-faint)' }}>Data di nascita *</label>
                <input className={inputCls('birthDate')} type="date" value={form.birthDate}
                  onChange={f('birthDate')} required />
                {fieldErrors.birthDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.birthDate}</p>}
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-faint)' }}>Genere *</label>
                <select className={inputCls('gender')} value={form.gender}
                  onChange={f('gender')} required>
                  <option value="">Seleziona…</option>
                  <option value="M">Maschio</option>
                  <option value="F">Femmina</option>
                </select>
                {fieldErrors.gender && <p className="text-red-500 text-xs mt-1">{fieldErrors.gender}</p>}
              </div>
            </div>

            <div>
              <input className={inputCls('birthPlace')} placeholder="Comune di nascita *" value={form.birthPlace}
                onChange={f('birthPlace')} required minLength={2} maxLength={100} />
              {fieldErrors.birthPlace && <p className="text-red-500 text-xs mt-1">{fieldErrors.birthPlace}</p>}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Registrandoti accetti i nostri <Link to="/terms" className="underline">Termini di servizio</Link>.
            </p>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Registrazione in corso…' : '🌱 Crea account'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            Hai già un account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>Accedi</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
