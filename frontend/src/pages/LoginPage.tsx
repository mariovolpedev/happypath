import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await login(form)
      setAuth(data.token, data.user)
      navigate('/home')
    } catch { setError('Credenziali non valide') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">✨ Bentornato!</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Accedi a HappyPath</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" placeholder="Username" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          <input className="input" type="password" placeholder="Password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Non hai un account? <Link to="/register" className="text-happy-600 font-medium">Registrati</Link>
        </p>
      </div>
    </div>
  )
}
