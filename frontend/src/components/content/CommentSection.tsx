import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getComments, addComment, deleteComment } from '../../api/content'
import { getMyAlterEgos } from '../../api/alterEgos'
import type { CommentResponse, AlterEgoResponse } from '../../types'
import Avatar from '../common/Avatar'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

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

  const handleDelete = async (commentId: number) => {
    await deleteComment(contentId, commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const selectedAe  = alterEgos.find(a => a.id === selectedAeId)
  const displayName = selectedAe ? selectedAe.name : (user?.displayName ?? '')
  const canDelete   = (c: CommentResponse) =>
    user?.id === c.author.id || user?.role === 'MODERATOR' || user?.role === 'ADMIN'

  return (
    <div id="comments" className="mt-6">
      <h3 className="font-display font-bold text-lg mb-4">💬 Commenti ({comments.length})</h3>

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

      <div className="space-y-4">
        {comments.map(c => {
          const displayAuthor = c.alterEgo
            ? { ...c.author, displayName: c.alterEgo.name, avatarUrl: c.alterEgo.avatarUrl }
            : c.author

          return (
            <div key={c.id} className="flex gap-3">
              <Avatar user={displayAuthor as any} size="sm" />
              <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: 'var(--bg-base)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.alterEgo ? (
                      <>
                        <Link to={`/ae/${c.alterEgo.id}`}
                          className="font-semibold text-sm hover:text-happy-600 transition-colors"
                          style={{ color: 'var(--text-primary)' }}>
                          {c.alterEgo.name}
                        </Link>
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
                          🎭
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          via{' '}
                          <Link to={`/u/${c.author.username}`}
                            className="hover:text-happy-600 transition-colors">
                            {c.author.displayName}
                          </Link>
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {c.author.displayName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: it })}
                    </span>
                    {canDelete(c) && (
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-400 hover:text-red-600">✕</button>
                    )}
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
