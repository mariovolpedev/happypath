import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import type { MessageResponse } from '../../types'
import Avatar from '../common/Avatar'

interface Props {
  message: MessageResponse
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = formatDistanceToNow(new Date(message.sentAt), { addSuffix: true, locale: it })

  const displaySender = message.senderAlterEgo
    ? { ...message.sender, displayName: message.senderAlterEgo.name, avatarUrl: message.senderAlterEgo.avatarUrl }
    : message.sender

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar user={displaySender as any} size="sm" />}

      <div className={`max-w-[72%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Nome mittente con AE (solo per messaggi altrui) */}
        {!isOwn && message.senderAlterEgo && (
          <div className="flex items-center gap-1.5 px-1">
            <Link to={`/ae/${message.senderAlterEgo.id}`}
              className="text-xs font-semibold hover:text-happy-600 transition-colors"
              style={{ color: 'var(--text-primary)' }}>
              🎭 {message.senderAlterEgo.name}
            </Link>
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
              via {message.sender.displayName}
            </span>
          </div>
        )}

        {/* Testo */}
        {message.text && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isOwn
              ? 'bg-happy-500 text-white rounded-tr-sm'
              : 'rounded-tl-sm border'
          }`}
            style={!isOwn ? {
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            } : undefined}>
            {message.text}
          </div>
        )}

        {/* Contenuto allegato */}
        {message.attachedContent && (
          <Link to={`/content/${message.attachedContent.id}`}
            className={`block w-full rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
              isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
            }`}
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
            {message.attachedContent.mediaUrl && (
              <img src={message.attachedContent.mediaUrl} alt={message.attachedContent.title}
                className="w-full h-28 object-cover" />
            )}
            <div className="p-3">
              {message.attachedContent.themeEmoji && (
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 mb-1 inline-block">
                  {message.attachedContent.themeEmoji} {message.attachedContent.themeName}
                </span>
              )}
              <p className="font-semibold text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {message.attachedContent.title}
              </p>
              {message.attachedContent.body && (
                <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {message.attachedContent.body}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                di {message.attachedContent.author.displayName}
              </p>
            </div>
          </Link>
        )}

        {/* Profilo allegato */}
        {message.attachedUser && (
          <Link to={`/u/${message.attachedUser.username}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border
                       hover:shadow-md transition-shadow ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
            <Avatar user={message.attachedUser} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {message.attachedUser.displayName}
                </span>
                {message.attachedUser.verified && (
                  <span title="Verificato" className="text-blue-500 text-xs">✅</span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                @{message.attachedUser.username}
              </p>
            </div>
            <span className="ml-auto text-sm" style={{ color: 'var(--text-faint)' }}>→</span>
          </Link>
        )}

        <span className="text-[10px] px-1" style={{ color: 'var(--text-faint)' }}>{time}</span>
      </div>
    </div>
  )
}
