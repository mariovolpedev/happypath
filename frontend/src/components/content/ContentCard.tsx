import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ContentResponse, AlterEgoResponse } from '../../types'
import Avatar from '../common/Avatar'
import VerifiedBadge from '../common/VerifiedBadge'
import ReportModal from './ReportModal'
import ShareContentButton from '../messages/ShareContentButton'
import UserHoverCard from '../common/UserHoverCard'
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

// ─── Cambio publisher inline nel menu ────────────────────────────────────────
function ChangePublisherInline({
  contentId, currentAlterEgoId, onChanged, onClose,
}: {
  contentId: number
  currentAlterEgoId?: number
  onChanged: (c: ContentResponse) => void
  onClose: () => void
}) {
  const [step, setStep]           = useState<'trigger' | 'pick'>('trigger')
  const [alterEgos, setAlterEgos] = useState<AlterEgoResponse[]>([])
  const [saving, setSaving]       = useState(false)
  const { user }                  = useAuthStore()

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
        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2
                   hover:bg-gray-100 dark:hover:bg-gray-700"
        style={{ color: 'var(--text-muted)' }}
      >
        🎭 Cambia profilo
      </button>
    )
  }

  return (
    <div className="px-3 py-2">
      <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>Pubblica come:</p>
      <div className="space-y-1">
        <button
          onClick={() => pick(null)}
          disabled={saving}
          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
            !currentAlterEgoId ? 'font-semibold text-happy-700' : ''
          }`}
          style={currentAlterEgoId ? { color: 'var(--text-muted)' } : {}}
        >
          👤 {user?.displayName}
          {!currentAlterEgoId && (
            <span className="ml-auto text-xs bg-happy-100 text-happy-700 rounded-full px-1.5">attivo</span>
          )}
        </button>
        {alterEgos.map(ae => (
          <button
            key={ae.id}
            onClick={() => pick(ae.id)}
            disabled={saving}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg
                        hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              currentAlterEgoId === ae.id ? 'font-semibold text-purple-700' : ''
            }`}
            style={currentAlterEgoId !== ae.id ? { color: 'var(--text-muted)' } : {}}
          >
            {ae.avatarUrl
              ? <img src={ae.avatarUrl} alt={ae.name} className="w-4 h-4 rounded-full object-cover" />
              : <span>🎭</span>}
            {ae.name}
            {currentAlterEgoId === ae.id && (
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 rounded-full px-1.5">attivo</span>
            )}
          </button>
        ))}
      </div>
      {saving && <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-faint)' }}>Salvataggio...</p>}
    </div>
  )
}

// ─── Modal lista reactor — stile Instagram ───────────────────────────────────
function ReactorsModal({
  content,
  onClose,
}: {
  content: ContentResponse
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:w-[400px] max-h-[70vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reazioni · {content.reactionsCount}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
            style={{ color: 'var(--text-faint)' }}
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {content.reactions && content.reactions.length > 0 ? (
            content.reactions.map(r => (
              <Link
                key={`${r.userId}-${r.type}`}
                to={r.alterEgo ? `/ae/${r.alterEgo.id}` : `/u/${r.user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                           hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {r.alterEgo ? (
                    r.alterEgo.avatarUrl
                      ? <img src={r.alterEgo.avatarUrl} alt={r.alterEgo.name}
                             className="w-9 h-9 rounded-full object-cover" />
                      : <span className="w-9 h-9 flex items-center justify-center text-xl">🎭</span>
                  ) : (
                    <Avatar user={r.user} size="sm" />
                  )}
                  {/* Emoji badge */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 text-xs leading-none
                               w-4 h-4 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--surface)' }}
                  >
                    {REACTIONS.find(rx => rx.type === r.type)?.emoji ?? '❤️'}
                  </span>
                </div>

                {/* Nome */}
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {r.alterEgo ? r.alterEgo.name : r.user.displayName}
                  </span>
                  {r.alterEgo && (
                    <span className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                      via {r.user.displayName}
                    </span>
                  )}
                </div>
              </Link>
            ))
          ) : (
            /* reactions null = feed paginato, suggerisci di aprire il post */
            <div className="flex flex-col items-center py-8 gap-2">
              <span className="text-3xl">❤️</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Apri il post per vedere chi ha reagito.
              </p>
              <Link
                to={`/content/${content.id}`}
                onClick={onClose}
                className="text-sm text-happy-600 hover:underline mt-1"
              >
                Vedi post →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ContentCard({ content: initial, onDelete }: Props) {
  const [content,       setContent]     = useState(initial)
  const [showReactions, setShowReactions] = useState(false)
  const [showReport,    setShowReport]    = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [alterEgos,     setAlterEgos]     = useState<AlterEgoResponse[]>([])
  const [selectedAeId,  setSelectedAeId]  = useState<number | undefined>()
  const [showAePicker,  setShowAePicker]  = useState(false)
  const [showReactors,  setShowReactors]  = useState(false)
  const { user, isAuthenticated }         = useAuthStore()

  const isAuthor           = user?.id === content.author.id
  const isModOrAdmin       = user?.role === 'MODERATOR' || user?.role === 'ADMIN'
  const canDelete          = (isAuthor || isModOrAdmin) && !!onDelete
  const canReport          = isAuthenticated() && !isAuthor
  const canChangePublisher = isAuthor && user?.verified

  const displayAuthor = content.alterEgo
    ? { ...content.author, displayName: content.alterEgo.name, avatarUrl: content.alterEgo.avatarUrl }
    : content.author

  const handleReactClick = async () => {
    if (!isAuthenticated()) return
    if (user?.verified) {
      const aes = await getMyAlterEgos().catch(() => [] as AlterEgoResponse[])
      setAlterEgos(aes)
      if (aes.length > 0) { setShowAePicker(true); return }
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

  // Testo in stile Facebook: "Mario e altre 3 persone"
  const reactionsLabel = (() => {
    const n = content.reactionsCount
    if (n === 0) return null
    if (content.reactions && content.reactions.length > 0) {
      const first = content.reactions[0]
      const firstName = first.alterEgo ? first.alterEgo.name : first.user.displayName
      if (n === 1) return firstName
      if (n === 2) return `${firstName} e un'altra persona`
      return `${firstName} e altre ${n - 1} persone`
    }
    if (n === 1) return '1 persona ha reagito'
    return `${n} persone hanno reagito`
  })()

  // Emoji preview (prime 3 reazioni distinte per tipo)
  const topEmojis = Object.entries(content.reactionsByType ?? {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find(r => r.type === type)?.emoji ?? '❤️')

  return (
    <>
      <article className="card hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
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
                  <UserHoverCard username={content.author.username} displayName={content.author.displayName}>
                    <Link to={`/u/${content.author.username}`}
                      className="hover:text-happy-600 transition-colors"
                      style={{ color: 'var(--text-primary)' }}>
                      {content.author.displayName}
                    </Link>
                  </UserHoverCard>
                )}
                {content.author.verified && <VerifiedBadge />}
              </div>
              {content.alterEgo && (
                <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  via{' '}
                  <UserHoverCard username={content.author.username} displayName={content.author.displayName}>
                    <Link to={`/u/${content.author.username}`}
                      className="hover:text-happy-600 transition-colors"
                      style={{ color: 'var(--text-faint)' }}>
                      {content.author.displayName}
                    </Link>
                  </UserHoverCard>
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
                  className="w-7 h-7 flex items-center justify-center rounded-full
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                  aria-label="Opzioni"
                >
                  ⋯
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-20
                               min-w-[190px] overflow-hidden border"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    {canReport && (
                      <button
                        onClick={() => { setShowReport(true); setShowMenu(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2
                                   hover:bg-gray-100 dark:hover:bg-gray-700"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        🚩 Segnala
                      </button>
                    )}
                    {canChangePublisher && (
                      <>
                        {(canReport || canDelete) && (
                          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
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
                        <div className="border-t" style={{ borderColor: 'var(--border)' }} />
                        <button
                          onClick={() => { onDelete!(content.id); setShowMenu(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500
                                     hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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

        {/* Riga reactions label stile Facebook */}
        {reactionsLabel && (
          <div className="flex items-center gap-1.5 mt-3">
            {/* Emoji pill */}
            {topEmojis.length > 0 && (
              <span className="flex -space-x-0.5">
                {topEmojis.map((emoji, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 flex items-center justify-center text-xs rounded-full"
                    style={{ backgroundColor: 'var(--surface-raised, var(--bg))', border: '1.5px solid var(--border)' }}
                  >
                    {emoji}
                  </span>
                ))}
              </span>
            )}
            <button
              onClick={() => setShowReactors(true)}
              className="text-xs hover:underline transition-colors"
              style={{ color: 'var(--text-faint)' }}
            >
              {reactionsLabel}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t flex-wrap"
          style={{ borderColor: 'var(--border)' }}>
          {/* Bottone reagisci */}
          <div className="relative">
            <button
              onClick={handleReactClick}
              className={`flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 transition-colors ${
                content.myReaction
                  ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={!content.myReaction ? { color: 'var(--text-faint)' } : {}}
            >
              {content.myReaction
                ? (REACTIONS.find(r => r.type === content.myReaction)?.emoji ?? '❤️')
                : '🤍'}{' '}
              {content.reactionsCount}
            </button>

            {/* Popup: scegli alter ego */}
            {showAePicker && (
              <div
                className="absolute bottom-full left-0 mb-2 rounded-2xl shadow-lg border p-3 z-10 min-w-[180px]"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>Reagisci come:</p>
                <div className="space-y-1 mb-2">
                  <button
                    onClick={() => { setSelectedAeId(undefined); setShowAePicker(false); setShowReactions(true) }}
                    className="w-full text-left text-sm px-2 py-1.5 rounded-lg
                               hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    👤 {user?.displayName}
                  </button>
                  {alterEgos.map(ae => (
                    <button
                      key={ae.id}
                      onClick={() => { setSelectedAeId(ae.id); setShowAePicker(false); setShowReactions(true) }}
                      className="w-full text-left text-sm px-2 py-1.5 rounded-lg
                                 hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      🎭 {ae.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popup: scelta reazione */}
            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-2 rounded-2xl shadow-lg border flex gap-1 p-2 z-10"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                {REACTIONS.map(r => (
                  <button
                    key={r.type}
                    onClick={() => doReact(r.type)}
                    className={`text-xl p-1.5 rounded-xl transition-colors
                                hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      content.myReaction === r.type ? 'bg-pink-50 dark:bg-pink-900/30' : ''
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
            className="flex items-center gap-1.5 text-sm hover:text-happy-600"
            style={{ color: 'var(--text-faint)' }}
          >
            💬 {content.commentsCount}
          </Link>

          <ShareContentButton contentId={content.id} contentTitle={content.title} />
        </div>
      </article>

      {/* Modal reactor */}
      {showReactors && (
        <ReactorsModal
          content={content}
          onClose={() => setShowReactors(false)}
        />
      )}

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
