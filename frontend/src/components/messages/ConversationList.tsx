import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ConversationSummary } from '../../api/messages'
import type { UserSummary } from '../../types'
import Avatar from '../common/Avatar'
import VerifiedBadge from '../common/VerifiedBadge'

interface Props {
  conversations: ConversationSummary[]
  selectedPartnerId?: number
  onSelect: (partner: UserSummary) => void
  loading: boolean
}

export default function ConversationList({
  conversations,
  selectedPartnerId,
  onSelect,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-happy-200 border-t-happy-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <span className="text-4xl block mb-3">💌</span>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Nessuna conversazione
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
          Inizia a seguire utenti verificati per poter inviare messaggi.
        </p>
      </div>
    )
  }

  return (
    <ul>
      {conversations.map((conv) => {
        const isActive = conv.partner.id === selectedPartnerId
        const time = formatDistanceToNow(new Date(conv.lastMessageAt), {
          addSuffix: false,
          locale: it,
        })

        return (
          <li
            key={conv.partner.id}
            className="border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => onSelect(conv.partner)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${
                isActive ? 'border-r-2 border-happy-500' : ''
              }`}
              style={{
                backgroundColor: isActive ? 'var(--bg-base)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-base)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              }}
            >
              <div className="relative flex-shrink-0">
                <Avatar user={conv.partner} size="md" />
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-happy-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{
                        color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: conv.unreadCount > 0 ? 700 : 600,
                      }}
                    >
                      {conv.partner.displayName}
                    </span>
                    {conv.partner.verified && <VerifiedBadge />}
                  </div>
                  <span
                    className="text-[10px] flex-shrink-0 ml-1"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    {time}
                  </span>
                </div>

                <p
                  className="text-xs truncate"
                  style={{
                    color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-faint)',
                    fontWeight: conv.unreadCount > 0 ? 500 : 400,
                  }}
                >
                  {conv.lastMessageSender.id === conv.partner.id ? '' : 'Tu: '}
                  {conv.lastMessageText.length > 50
                    ? conv.lastMessageText.slice(0, 50) + '…'
                    : conv.lastMessageText}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
