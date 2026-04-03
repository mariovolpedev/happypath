import { useState, useEffect } from 'react'
import { getHomeFeed } from '../api/content'
import type { ContentResponse } from '../types'
import ContentCard from '../components/content/ContentCard'
import Spinner from '../components/common/Spinner'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const [contents, setContents] = useState<ContentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const data = await getHomeFeed(p)
      setContents(p === 0 ? data.content : prev => [...prev, ...data.content])
      setHasMore(!data.last)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-6 text-gray-800">🏠 Il tuo feed</h1>
      {loading && contents.length === 0 ? <Spinner /> : (
        <div className="space-y-5">
          {contents.map(c => <ContentCard key={c.id} content={c} />)}
          {contents.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">Non segui ancora nessuno.</p>
              <Link to="/" className="btn-primary">Esplora la piattaforma</Link>
            </div>
          )}
          {hasMore && !loading && (
            <button onClick={() => load(page + 1)} className="btn-secondary w-full">Carica altri</button>
          )}
        </div>
      )}
    </div>
  )
}
