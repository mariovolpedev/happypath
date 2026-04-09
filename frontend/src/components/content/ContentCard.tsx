import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ContentResponse } from '../../types'
import Avatar from '../common/Avatar'
import VerifiedBadge from '../common/VerifiedBadge'
import ReportModal from './ReportModal'
import { react, removeReaction } from '../../api/content'
import { useAuthStore } from '../../store/authStore'

const REACTIONS = [
  { type: 'HEART', emoji: '❤️' },
  { type: 'LAUGH', emoji: '😄' },
  { type: 'WOW',   emoji: '🤩' },
  { type: 'CLAP',  emoji: '👏' },
  { type: 'SMILE', emoji: '😊' },
]

interface Props {
  content: ContentResponse
  onDelete?: (id: number) => void
}

export default function ContentCard({ content: initial, onDelete }: Props) {
  const [content, setContent]           = useState(initial)
  const [showReactions, setShowReactions] = useState(false)
  const [showReport, setShowReport]     = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  const isAuthor      = user?.id === content.author.id
  const isModOrAdmin  = user?.role === 'MODERATOR' || user?.role === 'ADMIN'
  const canDelete     = (isAuthor || isModOrAdmin) && !!onDelete
  const canReport     = isAuthenticated() && !isAuthor

  const displayAuthor = content.alterEgo
    ? { ...content.author, displayName: content.alterEgo.name, avatarUrl: content.alterEgo.avatarUrl }
    : content.author

  const handleReact = async (type: string) => {
    if (!isAuthenticated()) return
    if (content.myReaction === type) {
      await removeReaction(content.id)
      setContent(c => ({
        ...c,
        myReaction: undefined,
        reactionsCount: c.reactionsCount - 1,
        reactionsByType: { ...c.reactionsByType, [type]: (c.reactionsByType[type] ?? 1) - 1 },
      }))
    } else {
      await react(content.id, type)
      const prev = content.myReaction
      setContent(c => ({
        ...c,
        myReaction: type,
        reactionsCount: c.reactionsCount + (prev ? 0 : 1),
        reactionsByType: {
          ...c.reactionsByType,
          ...(prev ? { [prev]: (c.reactionsByType[prev] ?? 1) - 1 } : {}),
          [type]: (c.reactionsByType[type] ?? 0) + 1,
        },
      }))
    }
    setShowReactions(false)
  }

  return (
    <>
      <article className="card hover:shadow-md transition-shadow">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-3">
          <Link to={`/u/${content.author.username}`} className="flex items-center gap-2.5 group">
            <Avatar user={displayAuthor as any} size="md" />
            <div>
              <div className="flex items-center gap-1 font-semibold text-gray-800 group-hover:text-happy-600 leading-tight">
                {displayAuthor.displayName}
                {content.author.verified && <VerifiedBadge />}
              </div>
              {content.alterEgo && (
                <div className="text-xs text-gray-400">via {content.author.displayName}</div>
              )}
              <div className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true, locale: it })}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {content.theme && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-1 flex items-center gap-1">
                {content.theme.iconEmoji} {content.theme.name}
              </span>
            )}

            {/* ⋯ Menu contestuale */}
            {(canDelete || canReport) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(s => !s)}
                  className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
                  aria-label="Opzioni"
                >
                  ⋯
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    {canReport && (
                      <button
                        onClick={() => { setShowReport(true); setShowMenu(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        🚩 Segnala
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { onDelete!(content.id); setShowMenu(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        🗑️ Elimina
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Dediche ── */}
        {content.dedications?.length > 0 && (
          <p className="text-xs text-happy-600 mb-2 italic">
            💌 Dedicato a {content.dedications.map(d => d.to.displayName).join(', ')}
          </p>
        )}

        {/* ── Corpo ── */}
        <Link to={`/content/${content.id}`} className="block group">
          <h2 className="font-display font-bold text-lg text-gray-900 group-hover:text-happy-700 leading-snug mb-1">
            {content.title}
          </h2>
          {content.body && (
            <p className="text-gray-600 text-sm line-clamp-3">{content.body}</p>
          )}
          {content.mediaUrl && (
            <img
              src={content.mediaUrl}
              alt={content.title}
              className="mt-3 w-full rounded-xl object-cover max-h-72"
            />
          )}
        </Link>

        {/* ── Footer: reazioni + commenti ── */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          {/* Reazioni */}
          <div className="relative">
            <button
              onClick={() => isAuthenticated() && setShowReactions(s => !s)}
              className={`flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 transition-colors ${
                content.myReaction ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {content.myReaction
                ? REACTIONS.find(r => r.type === content.myReaction)?.emoji ?? '❤️'
                : '🤍'}{' '}
              {content.reactionsCount}
            </button>

            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-lg border border-gray-100 flex gap-1 p-2 z-10">
                {REACTIONS.map(r => (
                  <button
                    key={r.type}
                    onClick={() => handleReact(r.type)}
                    className={`text-xl p-1.5 rounded-xl hover:bg-gray-100 transition-colors ${
                      content.myReaction === r.type ? 'bg-pink-50' : ''
                    }`}
                    title={r.type}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Commenti */}
          <Link
            to={`/content/${content.id}#comments`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-happy-600"
          >
            💬 {content.commentsCount}
          </Link>
        </div>
      </article>

      {/* ── Modale segnalazione ── */}
      {showReport && (
        <ReportModal
          targetType="CONTENT"
          targetId={content.id}
          targetLabel={`"${content.title}"`}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
