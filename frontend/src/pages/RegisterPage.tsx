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

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    username: '', email: '', password: '', displayName: '',
    firstName: '', lastName: '', birthDate: '', birthPlace: '', gender: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validazioni client-side
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
      setAuth(data.token, data.user)
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
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">🌱 Inizia il tuo Happy Path!</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Crea il tuo account gratuito</p>
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
          <p className="text-xs text-gray-400 -mt-1">
            🪪 Dati anagrafici — verranno usati per verificare la tua identità
          </p>

          {/* Dati anagrafici */}
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
              <label className="text-xs text-gray-500 mb-1 block">Data di nascita *</label>
              <input className={inputCls('birthDate')} type="date" value={form.birthDate}
                onChange={f('birthDate')} required />
              {fieldErrors.birthDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.birthDate}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Genere *</label>
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
          <p className="text-xs text-gray-400">
            Registrandoti accetti il nostro regolamento. La piattaforma promuove contenuti semplici e felici.
          </p>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Creazione account...' : 'Registrati gratis'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Hai già un account? <Link to="/login" className="text-happy-600 font-medium">Accedi</Link>
        </p>
      </div>
    </div>
  )
}
