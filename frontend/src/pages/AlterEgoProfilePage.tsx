import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAlterEgoProfile, getAlterEgoContents } from '../api/alterEgos'
import { deleteContent } from '../api/content'
import type { AlterEgoResponse, ContentResponse } from '../types'
import ContentCard from '../components/content/ContentCard'
import Spinner from '../components/common/Spinner'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export default function AlterEgoProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [ae,          setAe]          = useState<AlterEgoResponse | null>(null)
  const [contents,    setContents]    = useState<ContentResponse[]>([])
  const [loading,     setLoading]     = useState(true)
  const [hasMore,     setHasMore]     = useState(false)
  const [page,        setPage]        = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getAlterEgoProfile(Number(id)),
      getAlterEgoContents(Number(id)),
    ])
      .then(([profile, c]) => {
        setAe(profile)
        setContents(c.content)
        setHasMore(!c.last)
        setPage(0)
      })
      .finally(() => setLoading(false))
  }, [id])

  const loadMore = async () => {
    if (!id) return
    setLoadingMore(true)
    const data = await getAlterEgoContents(Number(id), page + 1)
    setContents(prev => [...prev, ...data.content])
    setHasMore(!data.last)
    setPage(p => p + 1)
    setLoadingMore(false)
  }

  const handleDelete = async (contentId: number) => {
    await deleteContent(contentId)
    setContents(prev => prev.filter(c => c.id !== contentId))
  }

  if (loading) return <Spinner />
  if (!ae) return (
    <p className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
      Alter Ego non trovato
    </p>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="card overflow-hidden p-0">
        <div className="h-20 w-full"
          style={{ background: 'linear-gradient(135deg, #AFA9EC 0%, #EEEDFE 100%)' }} />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            {ae.avatarUrl ? (
              <img src={ae.avatarUrl} alt={ae.name}
                className="w-20 h-20 rounded-full object-cover border-4 flex-shrink-0"
                style={{ borderColor: 'var(--bg-card)' }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center
                             text-3xl font-bold border-4 flex-shrink-0"
                style={{ borderColor: 'var(--bg-card)', backgroundColor: '#EEEDFE', color: '#534AB7' }}>
                {ae.name[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {ae.name}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
              🎭 Alter Ego
            </span>
          </div>

          <p className="text-sm mb-2" style={{ color: 'var(--text-faint)' }}>
            Gestito da{' '}
            <Link to={`/u/${ae.owner.username}`}
              className="text-happy-600 font-medium hover:underline">
              {ae.owner.displayName}
            </Link>
            {ae.owner.verified && <span className="ml-1 text-blue-500">✅</span>}
          </p>

          {ae.description && (
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
              {ae.description}
            </p>
          )}

          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Creato{' '}
            {formatDistanceToNow(new Date(ae.createdAt), { addSuffix: true, locale: it })}
          </p>
        </div>
      </div>

      <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
        📝 Contenuti pubblicati
      </h2>

      {contents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🌱</p>
          <p style={{ color: 'var(--text-faint)' }}>Nessun contenuto ancora.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map(c => <ContentCard key={c.id} content={c} onDelete={handleDelete} />)}
          {hasMore && (
            <button onClick={loadMore} disabled={loadingMore} className="btn-secondary w-full">
              {loadingMore ? 'Caricamento…' : 'Carica altri'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
