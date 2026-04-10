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
  const time = formatDistanceToNow(new Date(message.sentAt), {
    addSuffix: true,
    locale: it,
  })

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar user={message.sender} size="sm" />}

      <div className={`max-w-[72%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Text bubble */}
        {message.text && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              isOwn
                ? 'bg-happy-500 text-white rounded-tr-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Attached content card */}
        {message.attachedContent && (
          <Link
            to={`/content/${message.attachedContent.id}`}
            className={`block w-full rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
              isOwn
                ? 'border-happy-300 bg-happy-50 rounded-tr-sm'
                : 'border-gray-200 bg-gray-50 rounded-tl-sm'
            }`}
          >
            {message.attachedContent.mediaUrl && (
              <img
                src={message.attachedContent.mediaUrl}
                alt={message.attachedContent.title}
                className="w-full h-28 object-cover"
              />
            )}
            <div className="p-3">
              {message.attachedContent.themeEmoji && (
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 mb-1 inline-block">
                  {message.attachedContent.themeEmoji} {message.attachedContent.themeName}
                </span>
              )}
              <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                {message.attachedContent.title}
              </p>
              {message.attachedContent.body && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                  {message.attachedContent.body}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                di {message.attachedContent.author.displayName}
              </p>
            </div>
          </Link>
        )}

        {/* Attached user profile card */}
        {message.attachedUser && (
          <Link
            to={`/u/${message.attachedUser.username}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border hover:shadow-md transition-shadow ${
              isOwn
                ? 'border-happy-300 bg-happy-50 rounded-tr-sm'
                : 'border-gray-200 bg-gray-50 rounded-tl-sm'
            }`}
          >
            <Avatar user={message.attachedUser} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-900">
                  {message.attachedUser.displayName}
                </span>
                {message.attachedUser.verified && (
                  <span title="Verificato" className="text-blue-500 text-xs">✅</span>
                )}
              </div>
              <p className="text-xs text-gray-400">@{message.attachedUser.username}</p>
            </div>
            <span className="ml-auto text-gray-300 text-sm">→</span>
          </Link>
        )}

        <span className="text-[10px] text-gray-400 px-1">{time}</span>
      </div>
    </div>
  )
}
