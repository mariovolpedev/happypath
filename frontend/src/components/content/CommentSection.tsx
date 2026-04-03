import { useState, useEffect } from 'react'
import { getComments, addComment, deleteComment } from '../../api/content'
import type { CommentResponse } from '../../types'
import Avatar from '../common/Avatar'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export default function CommentSection({ contentId }: { contentId: number }) {
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    getComments(contentId).then(p => setComments(p.content))
  }, [contentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const c = await addComment(contentId, text)
      setComments(prev => [...prev, c])
      setText('')
    } finally { setLoading(false) }
  }

  const handleDelete = async (commentId: number) => {
    await deleteComment(contentId, commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div id="comments" className="mt-6">
      <h3 className="font-display font-bold text-lg mb-4">💬 Commenti ({comments.length})</h3>

      {isAuthenticated() && (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Scrivi un commento positivo..."
            className="input flex-1 resize-none h-16" maxLength={1000} />
          <button type="submit" disabled={loading || !text.trim()} className="btn-primary self-end">
            Invia
          </button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <Avatar user={c.author} size="sm" />
            <div className="flex-1 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{c.author.displayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: it })}
                  </span>
                  {(user?.id === c.author.id || user?.role === 'MODERATOR' || user?.role === 'ADMIN') && (
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
