import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ContentResponse, AlterEgoResponse } from '../../types'
import Avatar from '../common/Avatar'
import VerifiedBadge from '../common/VerifiedBadge'
import ReportModal from './ReportModal'
import ShareContentButton from '../messages/ShareContentButton'
import { react, removeReaction, changePublisher } from '../../api/content'
import { getMyAlterEgos } from '../../api/alterEgos'
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

// ─── Sotto-componente: cambio publisher inline nel menu ───────────────────────
function ChangePublisherInline({
  contentId,
  currentAlterEgoId,
  onChanged,
  onClose,
}: {
  contentId: number
  currentAlterEgoId?: number
  onChanged: (c: ContentResponse) => void
  onClose: () => void
}) {
  const [step, setStep]         = useState<'trigger' | 'pick'>('trigger')
  const [alterEgos, setAlterEgos] = useState<AlterEgoResponse[]>([])
  const [saving, setSaving]     = useState(false)
  const { user }                = useAuthStore()

  const openPicker = async () => {
    const aes = await getMyAlterEgos().catch(() => [] as AlterEgoResponse[])
    setAlterEgos(aes)
    setStep('pick')
  }

  const pick = async (alterEgoId: number | null) => {
    setSaving(true)
    try {
      const updated = await changePublisher(contentId, alterEgoId)
      onChanged(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (step === 'trigger') {
    return (
      <button
        onClick={openPicker}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-600
                   hover:bg-gray-50 flex items-center gap-2"
      >
        🎭 Cambia profilo
      </button>
    )
  }

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-gray-400 mb-2">Pubblica come:</p>
      <div className="space-y-1">
        {/* Profilo reale */}
        <button
          onClick={() => pick(null)}
          disabled={saving}
          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
            !currentAlterEgoId ? 'font-semibold text-happy-700' : 'text-gray-600'
          }`}
        >
          👤 {user?.displayName}
          {!currentAlterEgoId && (
            <span className="ml-auto text-xs bg-happy-100 text-happy-700 rounded-full px-1.5">attivo</span>
          )}
        </button>

        {/* Alter ego disponibili */}
        {alterEgos.map(ae => (
          <button
            key={ae.id}
            onClick={() => pick(ae.id)}
            disabled={saving}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
              currentAlterEgoId === ae.id ? 'font-semibold text-purple-700' : 'text-gray-600'
            }`}
          >
            {ae.avatarUrl ? (
              <img src={ae.avatarUrl} alt={ae.name} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span>🎭</span>
            )}
            {ae.name}
            {currentAlterEgoId === ae.id && (
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 rounded-full px-1.5">attivo</span>
            )}
          </button>
        ))}
      </div>
      {saving && <p className="text-xs text-gray-400 mt-2 text-center">Salvataggio...</p>}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ContentCard({ content: initial, onDelete }: Props) {
  const [content,        setContent]      = useState(initial)
  const [showReactions,  setShowReactions]  = useState(false)
  const [showReport,     setShowReport]     = useState(false)
  const [showMenu,       setShowMenu]       = useState(false)
  const [alterEgos,      setAlterEgos]      = useState<AlterEgoResponse[]>([])
  const [selectedAeId,   setSelectedAeId]   = useState<number | undefined>()
  const [showAePicker,   setShowAePicker]   = useState(false)
  const { user, isAuthenticated }           = useAuthStore()

  const isAuthor     = user?.id === content.author.id
  const isModOrAdmin = user?.role === 'MODERATOR' || user?.role === 'ADMIN'
  const canDelete    = (isAuthor || isModOrAdmin) && !!onDelete
  const canReport    = isAuthenticated() && !isAuthor
  const canChangePublisher = isAuthor && user?.verified

  const displayAuthor = content.alterEgo
    ? { ...content.author, displayName: content.alterEgo.name, avatarUrl: content.alterEgo.avatarUrl }
    : content.author

  const handleReactClick = async () => {
    if (!isAuthenticated()) return
    if (user?.verified) {
      const aes = await getMyAlterEgos().catch(() => [] as AlterEgoResponse[])
      setAlterEgos(aes)
      if (aes.length > 0) {
        setShowAePicker(true)
        return
      }
    }
    setShowReactions(s => !s)
  }

  const doReact = async (type: string) => {
    if (content.myReaction === type) {
      await removeReaction(content.id)
      setContent(c => ({
        ...c,
        myReaction: undefined,
        reactionsCount: c.reactionsCount - 1,
        reactionsByType: { ...c.reactionsByType, [type]: (c.reactionsByType[type] ?? 1) - 1 },
      }))
    } else {
      await react(content.id, type, selectedAeId)
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
    setShowAePicker(false)
  }

  return (
    <>
      <article className="card hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 group">
            {content.alterEgo ? (
              <Link to={`/ae/${content.alterEgo.id}`}>
                <Avatar user={displayAuthor as any} size="md" />
              </Link>
            ) : (
              <Link to={`/u/${content.author.username}`}>
                <Avatar user={displayAuthor as any} size="md" />
              </Link>
            )}
            <div>
              <div className="flex items-center gap-1 flex-wrap font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}>
                {content.alterEgo ? (
                  <>
                    <Link to={`/ae/${content.alterEgo.id}`}
                      className="hover:text-happy-600 transition-colors">
                      {content.alterEgo.name}
                    </Link>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
                      🎭
                    </span>
                  </>
                ) : (
                  <Link to={`/u/${content.author.username}`}
                    className="hover:text-happy-600 transition-colors">
                    {content.author.displayName}
                  </Link>
                )}
                {content.author.verified && <VerifiedBadge />}
              </div>
              {content.alterEgo && (
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  via{' '}
                  <Link to={`/u/${content.author.username}`}
                    className="hover:text-happy-600 transition-colors">
                    {content.author.displayName}
                  </Link>
                </div>
              )}
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true, locale: it })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {content.theme && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-1 flex items-center gap-1">
                {content.theme.iconEmoji} {content.theme.name}
              </span>
            )}
            {(canDelete || canReport || canChangePublisher) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(s => !s)}
                  className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center
                             justify-center rounded-full hover:bg-gray-100"
                  aria-label="Opzioni"
                >
                  ⋯
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-100
                               rounded-xl shadow-lg z-20 min-w-[190px] overflow-hidden"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    {canReport && (
                      <button
                        onClick={() => { setShowReport(true); setShowMenu(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-600
                                   hover:bg-gray-50 flex items-center gap-2"
                      >
                        🚩 Segnala
                      </button>
                    )}
                    {canChangePublisher && (
                      <>
                        {(canReport || canDelete) && (
                          <div className="border-t border-gray-100" />
                        )}
                        <ChangePublisherInline
                          contentId={content.id}
                          currentAlterEgoId={content.alterEgo?.id}
                          onChanged={updated => setContent(updated)}
                          onClose={() => setShowMenu(false)}
                        />
                      </>
                    )}
                    {canDelete && (
                      <>
                        <div className="border-t border-gray-100" />
                        <button
                          onClick={() => { onDelete!(content.id); setShowMenu(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500
                                     hover:bg-red-50 flex items-center gap-2"
                        >
                          🗑️ Elimina
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dediche */}
        {content.dedications?.length > 0 && (
          <p className="text-xs text-happy-600 mb-2 italic">
            💌 Dedicato a {content.dedications.map(d => d.to.displayName).join(', ')}
          </p>
        )}

        {/* Corpo */}
        <Link to={`/content/${content.id}`} className="block group">
          <h2
            className="font-display font-bold text-lg group-hover:text-happy-700 leading-snug mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {content.title}
          </h2>
          {content.body && (
            <p className="text-sm line-clamp-3" style={{ color: 'var(--text-muted)' }}>
              {content.body}
            </p>
          )}
          {content.mediaUrl && (
            <img
              src={content.mediaUrl}
              alt={content.title}
              className="mt-3 w-full rounded-xl object-cover max-h-72"
            />
          )}
        </Link>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 flex-wrap">
          <div className="relative">
            <button
              onClick={handleReactClick}
              className={`flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 transition-colors ${
                content.myReaction ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {content.myReaction
                ? (REACTIONS.find(r => r.type === content.myReaction)?.emoji ?? '❤️')
                : '🤍'}{' '}
              {content.reactionsCount}
            </button>

            {/* Picker identità per la reazione */}
            {showAePicker && (
              <div
                className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-lg
                           border border-gray-100 p-3 z-10 min-w-[180px]"
              >
                <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
                  Reagisci come:
                </p>
                <div className="space-y-1 mb-2">
                  <button
                    onClick={() => { setSelectedAeId(undefined); setShowAePicker(false); setShowReactions(true) }}
                    className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    👤 {user?.displayName}
                  </button>
                  {alterEgos.map(ae => (
                    <button
                      key={ae.id}
                      onClick={() => { setSelectedAeId(ae.id); setShowAePicker(false); setShowReactions(true) }}
                      className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      🎭 {ae.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-lg
                           border border-gray-100 flex gap-1 p-2 z-10"
              >
                {REACTIONS.map(r => (
                  <button
                    key={r.type}
                    onClick={() => doReact(r.type)}
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

          <Link
            to={`/content/${content.id}#comments`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-happy-600"
          >
            💬 {content.commentsCount}
          </Link>

          <ShareContentButton contentId={content.id} contentTitle={content.title} />
        </div>
      </article>

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
