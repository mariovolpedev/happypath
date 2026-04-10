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
        <div className="w-6 h-6 border-3 border-happy-200 border-t-happy-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <span className="text-4xl block mb-3">💌</span>
        <p className="text-gray-500 text-sm font-medium">Nessuna conversazione</p>
        <p className="text-gray-400 text-xs mt-1">
          Inizia a seguire utenti verificati per poter inviare messaggi.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-50">
      {conversations.map((conv) => {
        const isActive = conv.partner.id === selectedPartnerId
        const time = formatDistanceToNow(new Date(conv.lastMessageAt), {
          addSuffix: false,
          locale: it,
        })

        return (
          <li key={conv.partner.id}>
            <button
              onClick={() => onSelect(conv.partner)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-happy-50 transition-colors text-left ${
                isActive ? 'bg-happy-50 border-r-2 border-happy-500' : ''
              }`}
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
                      className={`font-semibold text-sm truncate ${
                        conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {conv.partner.displayName}
                    </span>
                    {conv.partner.verified && <VerifiedBadge />}
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{time}</span>
                </div>

                <p
                  className={`text-xs truncate ${
                    conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
                  }`}
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
