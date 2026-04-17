import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { UserSummary } from '../types'
import { getConversations, type ConversationSummary } from '../api/messages'
import { getProfile } from '../api/users'
import ConversationList from '../components/messages/ConversationList'
import ChatWindow from '../components/messages/ChatWindow'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/common/Spinner'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<UserSummary | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations()
      setConversations(data)
    } finally {
      setConvsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const withUsername = searchParams.get('with')
    if (withUsername) {
      getProfile(withUsername)
        .then((profile) => {
          const partner: UserSummary = {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            role: profile.role,
            verified: profile.verified,
          }
          setSelectedPartner(partner)
          setMobileShowChat(true)
        })
        .catch(() => {})
    }
  }, [searchParams])

  const handleSelectPartner = (partner: UserSummary) => {
    setSelectedPartner(partner)
    setMobileShowChat(true)
  }

  const handleMessageSent = () => loadConversations()

  if (!user) return <Spinner />

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className="rounded-2xl shadow-sm overflow-hidden border"
        style={{
          height: 'calc(100vh - 10rem)',
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex h-full">
          {/* Sidebar conversazioni */}
          <div
            className={`w-full sm:w-80 flex-shrink-0 flex flex-col border-r ${
              mobileShowChat ? 'hidden sm:flex' : 'flex'
            }`}
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="px-4 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <h1
                className="font-display font-bold text-xl"
                style={{ color: 'var(--text-primary)' }}
              >
                💬 Messaggi
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                Solo utenti verificati e collegati
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedPartnerId={selectedPartner?.id}
                onSelect={handleSelectPartner}
                loading={convsLoading}
              />
            </div>
          </div>

          {/* Chat window */}
          <div
            className={`flex-1 flex flex-col ${
              mobileShowChat ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {selectedPartner ? (
              <>
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="sm:hidden flex items-center gap-2 text-sm text-happy-600 px-4 py-2 border-b font-medium"
                  style={{ borderColor: 'var(--border)' }}
                >
                  ← Indietro
                </button>
                <ChatWindow
                  partner={selectedPartner}
                  currentUserId={user.id}
                  onMessageSent={handleMessageSent}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <span className="text-6xl mb-4">✉️</span>
                <h2
                  className="font-display font-bold text-xl mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  I tuoi messaggi
                </h2>
                <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                  Seleziona una conversazione o vai sul profilo di un utente per
                  iniziare a scrivere.
                </p>
                <div
                  className="mt-6 rounded-xl p-4 text-left text-sm max-w-xs border"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    ℹ️ Come funziona?
                  </p>
                  <ul className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <li>• Entrambi devono essere utenti <strong>verificati</strong></li>
                    <li>• Devono seguirsi <strong>a vicenda</strong></li>
                    <li>• Puoi condividere contenuti e profili</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
