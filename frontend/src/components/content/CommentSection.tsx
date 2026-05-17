import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getComments,
  addComment,
  deleteComment,
  getReplies,
  reactToComment,
  removeCommentReaction,
} from '../../api/content'
import { getMyAlterEgos } from '../../api/alterEgos'
import type {
  CommentResponse,
  AlterEgoResponse,
  ReactionType,
  CommentReactionSummary,
} from '../../types'
import Avatar from '../common/Avatar'
import UserHoverCard from '../common/UserHoverCard'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Emoji map per le reazioni
// ---------------------------------------------------------------------------
const REACTION_EMOJI: Record<ReactionType, string> = {
  HEART: '❤️',
  CLAP:  '👏',
  LAUGH: '😂',
  WOW:   '😮',
  SMILE: '😊',
}

// ---------------------------------------------------------------------------
// Sottomisura: barra emoji reazioni per un commento
// ---------------------------------------------------------------------------
function ReactionBar({
  contentId,
  commentId,
  reactions,
  alterEgoId,
  onUpdate,
}: {
  contentId: number
  commentId: number
  reactions: CommentReactionSummary | null
  alterEgoId?: number
  onUpdate: (updated: CommentReactionSummary) => void
}) {
  const [open, setOpen]     = useState(false)
  const [busy, setBusy]     = useState(false)
  const { isAuthenticated } = useAuthStore()

  const myReaction = reactions?.myReaction ?? null

  const handleReact = async (type: ReactionType) => {
    if (!isAuthenticated() || busy) return
    setBusy(true)
    try {
      let updated: CommentReactionSummary
      if (myReaction === type) {
        updated = await removeCommentReaction(contentId, commentId)
      } else {
        updated = await reactToComment(contentId, commentId, type, alterEgoId)
      }
      onUpdate(updated)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const total = reactions?.total ?? 0

  // Raggruppa le emoji attive per mostrarle in linea
  const activeEmojis = Object.entries(reactions?.counts ?? {})
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k]) => REACTION_EMOJI[k as ReactionType])

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Riepilogo reazioni esistenti */}
      {total > 0 && (
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
          <span>{activeEmojis.join('')}</span>
          <span>{total}</span>
        </span>
      )}

      {/* Pulsante per aprire il picker */}
      {isAuthenticated() && (
        <div className="relative">
          <button
            onClick={() => setOpen(p => !p)}
            className="text-xs px-1.5 py-0.5 rounded-full transition-colors"
            style={{
              backgroundColor: myReaction ? 'var(--happy-100, #fef3f2)' : 'var(--bg-offset)',
              color: myReaction ? 'var(--happy-600, #e11d48)' : 'var(--text-faint)',
              border: '1px solid var(--border)',
            }}
            title={myReaction ? `Hai reagito con ${REACTION_EMOJI[myReaction]}` : 'Reagisci'}
          >
            {myReaction ? REACTION_EMOJI[myReaction] : '😊'} +
          </button>

          {open && (
            <div
              className="absolute bottom-full mb-1 left-0 flex gap-1 p-1.5 rounded-xl shadow-lg z-20"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {(Object.keys(REACTION_EMOJI) as ReactionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  disabled={busy}
                  title={type}
                  className="text-lg hover:scale-125 transition-transform rounded-lg px-1 py-0.5"
                  style={{
                    backgroundColor: myReaction === type ? 'var(--bg-offset)' : 'transparent',
                  }}
                >
                  {REACTION_EMOJI[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente singolo commento (ricorsivo per le risposte)
// ---------------------------------------------------------------------------
function CommentItem({
  comment,
  contentId,
  depth,
  alterEgos,
  selectedAeId,
  currentUserId,
  currentUserRole,
  onDelete,
}: {
  comment: CommentResponse
  contentId: number
  depth: number
  alterEgos: AlterEgoResponse[]
  selectedAeId?: number
  currentUserId?: number
  currentUserRole?: string
  onDelete: (id: number) => void
}) {
  const [reactions,     setReactions]     = useState<CommentReactionSummary | null>(comment.reactions)
  const [replyOpen,     setReplyOpen]     = useState(false)
  const [replyText,     setReplyText]     = useState('')
  const [replyLoading,  setReplyLoading]  = useState(false)
  const [repliesOpen,   setRepliesOpen]   = useState(false)
  const [replies,       setReplies]       = useState<CommentResponse[]>([])
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [replyAeId,     setReplyAeId]     = useState<number | undefined>(selectedAeId)
  const { isAuthenticated }               = useAuthStore()

  const replyCount = comment.replyCount ?? 0

  const displayAuthor = comment.alterEgo
    ? { ...comment.author, displayName: comment.alterEgo.name, avatarUrl: comment.alterEgo.avatarUrl }
    : comment.author

  const canDelete =
    currentUserId === comment.author.id ||
    currentUserRole === 'MODERATOR' ||
    currentUserRole === 'ADMIN'

  // Carica le risposte al primo expand
  const handleToggleReplies = useCallback(async () => {
    if (!repliesLoaded) {
      const page = await getReplies(contentId, comment.id)
      setReplies(page.content)
      setRepliesLoaded(true)
    }
    setRepliesOpen(p => !p)
  }, [contentId, comment.id, repliesLoaded])

  // Invia una risposta
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setReplyLoading(true)
    try {
      const newReply = await addComment(contentId, replyText, comment.id, replyAeId)
      setReplies(prev => [...prev, newReply])
      setRepliesOpen(true)
      setRepliesLoaded(true)
      setReplyText('')
      setReplyOpen(false)
    } finally {
      setReplyLoading(false)
    }
  }

  const handleDeleteReply = (id: number) => {
    setReplies(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-3' : ''}`}>
      <Link to={`/u/${comment.author.username}`} className="shrink-0 hover:opacity-80 transition-opacity">
        <Avatar user={displayAuthor as any} size="sm" />
      </Link>

      <div className="flex-1">
        {/* Bubble commento */}
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Header: autore + tempo + elimina */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {comment.alterEgo ? (
                <>
                  <Link
                    to={`/ae/${comment.alterEgo.id}`}
                    className="font-semibold text-sm hover:text-happy-600 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {comment.alterEgo.name}
                  </Link>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}
                  >
                    🎭
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    via{' '}
                    <UserHoverCard username={comment.author.username} displayName={comment.author.displayName}>
                      <Link
                        to={`/u/${comment.author.username}`}
                        className="hover:text-happy-600 transition-colors"
                        style={{ color: 'var(--text-faint)' }}
                      >
                        {comment.author.displayName}
                      </Link>
                    </UserHoverCard>
                  </span>
                </>
              ) : (
                <UserHoverCard username={comment.author.username} displayName={comment.author.displayName}>
                  <Link
                    to={`/u/${comment.author.username}`}
                    className="font-semibold text-sm hover:text-happy-600 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {comment.author.displayName}
                  </Link>
                </UserHoverCard>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: it })}
              </span>
              {canDelete && (
                <button
                  onClick={async () => {
                    await deleteComment(contentId, comment.id)
                    onDelete(comment.id)
                  }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Testo commento */}
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{comment.text}</p>

          {/* Barra reazioni */}
          <ReactionBar
            contentId={contentId}
            commentId={comment.id}
            reactions={reactions}
            alterEgoId={selectedAeId}
            onUpdate={setReactions}
          />
        </div>

        {/* Azioni sotto la bubble: Rispondi + mostra risposte */}
        {depth === 0 && (
          <div className="flex items-center gap-3 mt-1 ml-1">
            {isAuthenticated() && (
              <button
                onClick={() => setReplyOpen(p => !p)}
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--text-faint)' }}
              >
                Rispondi
              </button>
            )}
            {replyCount > 0 && (
              <button
                onClick={handleToggleReplies}
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--text-faint)' }}
              >
                {repliesOpen
                  ? 'Nascondi risposte'
                  : `▾ ${replyCount} ${replyCount === 1 ? 'risposta' : 'risposte'}`}
              </button>
            )}
          </div>
        )}

        {/* Form risposta inline */}
        {replyOpen && depth === 0 && (
          <form onSubmit={handleReply} className="mt-2 ml-1 space-y-1.5">
            {alterEgos.length > 0 && (
              <select
                className="input text-sm py-1 w-auto"
                value={replyAeId ?? ''}
                onChange={e => setReplyAeId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">👤 (te stesso)</option>
                {alterEgos.map(ae => (
                  <option key={ae.id} value={ae.id}>🎭 {ae.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Scrivi una risposta positiva…"
                className="input flex-1 resize-none h-14 text-sm"
                maxLength={1000}
                autoFocus
              />
              <button
                type="submit"
                disabled={replyLoading || !replyText.trim()}
                className="btn-primary self-end text-sm"
              >
                Invia
              </button>
            </div>
          </form>
        )}

        {/* Lista risposte espansa */}
        {repliesOpen && replies.length > 0 && (
          <div className="mt-2 space-y-0">
            {replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                contentId={contentId}
                depth={depth + 1}
                alterEgos={alterEgos}
                selectedAeId={selectedAeId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onDelete={handleDeleteReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principale
// ---------------------------------------------------------------------------
export default function CommentSection({ contentId }: { contentId: number }) {
  const [comments,     setComments]     = useState<CommentResponse[]>([])
  const [alterEgos,    setAlterEgos]    = useState<AlterEgoResponse[]>([])
  const [selectedAeId, setSelectedAeId] = useState<number | undefined>()
  const [text,         setText]         = useState('')
  const [loading,      setLoading]      = useState(false)
  const { user, isAuthenticated }       = useAuthStore()

  useEffect(() => {
    getComments(contentId).then(p => setComments(p.content))
    if (isAuthenticated() && user?.verified) {
      getMyAlterEgos().then(setAlterEgos).catch(() => {})
    }
  }, [contentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const c = await addComment(contentId, text, undefined, selectedAeId)
      setComments(prev => [...prev, c])
      setText('')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (commentId: number) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const selectedAe  = alterEgos.find(a => a.id === selectedAeId)
  const displayName = selectedAe ? selectedAe.name : (user?.displayName ?? '')

  return (
    <div id="comments" className="mt-6">
      <h3 className="font-display font-bold text-lg mb-4">
        💬 Commenti ({comments.length})
      </h3>

      {/* Form nuovo commento */}
      {isAuthenticated() && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          {alterEgos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>
                Scrivi come:
              </span>
              <select
                className="input text-sm py-1.5 w-auto"
                value={selectedAeId ?? ''}
                onChange={e => setSelectedAeId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">👤 {user?.displayName}</option>
                {alterEgos.map(ae => (
                  <option key={ae.id} value={ae.id}>🎭 {ae.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Scrivi un commento positivo come ${displayName}…`}
              className="input flex-1 resize-none h-16"
              maxLength={1000}
            />
            <button type="submit" disabled={loading || !text.trim()} className="btn-primary self-end">
              Invia
            </button>
          </div>
        </form>
      )}

      {/* Lista commenti radice */}
      <div className="space-y-4">
        {comments.map(c => (
          <CommentItem
            key={c.id}
            comment={c}
            contentId={contentId}
            depth={0}
            alterEgos={alterEgos}
            selectedAeId={selectedAeId}
            currentUserId={user?.id}
            currentUserRole={user?.role}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
