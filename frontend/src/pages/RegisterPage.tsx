import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '', birthDate: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await register(form)
      setAuth(data.token, data.user)
      navigate('/home')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Errore durante la registrazione')
    } finally { setLoading(false) }
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">🌱 Inizia il tuo Happy Path!</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Crea il tuo account gratuito</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" placeholder="Username *" value={form.username} onChange={f('username')} required minLength={3} maxLength={50} />
          <input className="input" placeholder="Nome visualizzato" value={form.displayName} onChange={f('displayName')} />
          <input className="input" type="email" placeholder="Email *" value={form.email} onChange={f('email')} required />
          <input className="input" type="password" placeholder="Password * (min. 8 caratteri)" value={form.password} onChange={f('password')} required minLength={8} />
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Data di nascita *</label>
            <input className="input" type="date" value={form.birthDate} onChange={f('birthDate')} required />
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
