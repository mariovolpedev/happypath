import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { search } from '../../api/users'
import { sendMessage } from '../../api/messages'
import type { UserSummary } from '../../types'
import Avatar from '../common/Avatar'
import { useAuthStore } from '../../store/authStore'

interface Props {
  contentId: number
  contentTitle: string
}

/**
 * A small "share" button rendered inside ContentCard.
 * Opens an inline popover to pick a verified+connected recipient, then
 * sends a message with the content attached.
 */
export default function ShareContentButton({ contentId, contentTitle }: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated() || !user?.verified) return null

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    const users = await search(q)
    setResults(users.filter((u) => u.id !== user.id && u.verified).slice(0, 5))
  }

  const handleSend = async (recipient: UserSummary) => {
    setLoading(true)
    try {
      await sendMessage(
        recipient.id,
        `👋 Ho pensato che potesse interessarti: "${contentTitle}"`,
        contentId
      )
      setSent(true)
      setTimeout(() => { setOpen(false); setSent(false) }, 1500)
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Errore'
      if (msg.includes('collegato') || msg.includes('follow')) {
        alert('Puoi condividere solo con utenti con cui hai un follow reciproco.')
      } else {
        alert(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-happy-600 transition-colors"
        title="Condividi in un messaggio privato"
      >
        ↗ Condividi
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 z-30 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
            {sent ? (
              <p className="text-center text-happy-600 font-medium py-2">
                ✅ Messaggio inviato!
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Invia a un contatto
                </p>
                <input
                  className="input text-sm mb-2"
                  placeholder="Cerca utente…"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                {results.length === 0 && query ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Nessun utente verificato trovato
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {results.map((u) => (
                      <li key={u.id}>
                        <button
                          disabled={loading}
                          onClick={(e) => { e.stopPropagation(); handleSend(u) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-happy-50 transition-colors"
                        >
                          <Avatar user={u} size="sm" />
                          <div className="text-left">
                            <p className="text-xs font-semibold text-gray-800">
                              {u.displayName}
                            </p>
                            <p className="text-[10px] text-gray-400">@{u.username}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => { setOpen(false); navigate('/messages') }}
                  className="w-full mt-2 text-xs text-happy-600 hover:underline text-center"
                >
                  Vai ai messaggi →
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
