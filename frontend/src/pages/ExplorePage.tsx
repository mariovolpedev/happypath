import { useState, useEffect } from 'react'
import { getFeed } from '../api/content'
import { deleteContent } from '../api/content'
import type { ContentResponse } from '../types'
import ContentCard from '../components/content/ContentCard'
import Spinner from '../components/common/Spinner'
import { useThemes } from '../hooks/useThemes'

export default function ExplorePage() {
  const [contents, setContents] = useState<ContentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<number | undefined>()
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const themes = useThemes()

  const load = async (p = 0, themeId?: number) => {
    setLoading(true)
    try {
      const data = await getFeed(p, themeId)
      setContents(p === 0 ? data.content : prev => [...prev, ...data.content])
      setHasMore(!data.last)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(0, selectedTheme) }, [selectedTheme])

  const handleDelete = async (id: number) => {
    await deleteContent(id)
    setContents(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      {/* Sidebar temi */}
      <aside>
        <div className="card sticky top-24">
          <h3 className="font-display font-bold mb-3 text-gray-700">🎨 Temi</h3>
          <ul className="space-y-1">
            <li>
              <button onClick={() => setSelectedTheme(undefined)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!selectedTheme ? 'bg-happy-100 text-happy-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'}`}>
                ✨ Tutti
              </button>
            </li>
            {themes.map(t => (
              <li key={t.id}>
                <button onClick={() => setSelectedTheme(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedTheme === t.id ? 'bg-happy-100 text-happy-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {t.iconEmoji} {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Feed */}
      <div>
        <h1 className="font-display font-bold text-2xl mb-6 text-gray-800">
          {selectedTheme ? `${themes.find(t => t.id === selectedTheme)?.iconEmoji} ${themes.find(t => t.id === selectedTheme)?.name}` : '✨ Esplora'}
        </h1>
        {loading && contents.length === 0 ? <Spinner /> : (
          <div className="space-y-5">
            {contents.map(c => (
              <ContentCard key={c.id} content={c} onDelete={handleDelete} />
            ))}
            {contents.length === 0 && (
              <p className="text-center text-gray-400 py-16">Nessun contenuto ancora. Sii il primo! 🌱</p>
            )}
            {hasMore && !loading && (
              <button onClick={() => load(page + 1, selectedTheme)} className="btn-secondary w-full">
                Carica altri
              </button>
            )}
            {loading && contents.length > 0 && <Spinner />}
          </div>
        )}
      </div>
    </div>
  )
}
