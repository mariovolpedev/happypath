import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContent, deleteContent } from '../api/content'
import type { ContentResponse } from '../types'
import ContentCard from '../components/content/ContentCard'
import CommentSection from '../components/content/CommentSection'
import Spinner from '../components/common/Spinner'

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [content, setContent] = useState<ContentResponse | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getContent(Number(id)).then(setContent).catch(() => navigate('/'))
  }, [id])

  if (!content) return <Spinner />

  const handleDelete = async (cid: number) => {
    await deleteContent(cid)
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ContentCard content={content} onDelete={handleDelete} />
      <CommentSection contentId={content.id} />
    </div>
  )
}
