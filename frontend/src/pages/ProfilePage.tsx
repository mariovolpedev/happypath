import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  getProfile, follow, unfollow, getUserContents,
  getUserReactions, getUserCommentsActivity,
  type UserReactionResponse, type UserCommentActivityResponse
} from '../api/users'
import type { UserProfile, ContentResponse } from '../types'
import Avatar from '../components/common/Avatar'
import VerifiedBadge from '../components/common/VerifiedBadge'
import ContentCard from '../components/content/ContentCard'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'

const REACTION_EMOJI: Record<string, string> = {
  HEART: '❤️', LAUGH: '😄', WOW: '🤩', CLAP: '👏', SMILE: '😊'
}

type Tab = 'contents' | 'reactions' | 'comments'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('contents')

  const [contents, setContents] = useState<ContentResponse[]>([])
  const [reactions, setReactions] = useState<UserReactionResponse[]>([])
  const [comments, setComments] = useState<UserCommentActivityResponse[]>([])

  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const { user: me, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!username) return
    setLoading(true)
    Promise.all([getProfile(username), getUserContents(username)])
      .then(([p, c]) => { setProfile(p); setContents(c.content) })
      .finally(() => setLoading(false))
  }, [username])

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab)
    if (!username) return
    if (tab === 'contents' && contents.length > 0) return
    if (tab === 'reactions' && reactions.length > 0) return
    if (tab === 'comments' && comments.length > 0) return

    setTabLoading(true)
    try {
      if (tab === 'contents') {
        const data = await getUserContents(username)
        setContents(data.content)
      } else if (tab === 'reactions') {
        const data = await getUserReactions(username)
        setReactions(data.content)
      } else if (tab === 'comments') {
        const data = await getUserCommentsActivity(username)
        setComments(data.content)
      }
    } finally { setTabLoading(false) }
  }

  const handleFollow = async () => {
    if (!profile) return
    if (profile.isFollowedByMe) {
      await unfollow(profile.id)
      setProfile(p => p ? { ...p, isFollowedByMe: false, followersCount: p.followersCount - 1 } : p)
    } else {
      await follow(profile.id)
      setProfile(p => p ? { ...p, isFollowedByMe: true, followersCount: p.followersCount + 1 } : p)
    }
  }

  if (loading) return <Spinner />
  if (!profile) return <p className="text-center text-gray-500">Utente non trovato</p>

  const isMe = me?.username === username

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'contents', label: 'Contenuti', emoji: '📝' },
    { key: 'reactions', label: 'Reazioni', emoji: '❤️' },
    { key: 'comments', label: 'Commenti', emoji: '💬' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header profilo */}
      <div className="card">
        <div className="flex items-start gap-4">
          <Avatar user={profile} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl">{profile.displayName}</h1>
              {profile.verified && <VerifiedBadge />}
              {profile.role !== 'USER' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  profile.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                  profile.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profile.role === 'ADMIN' ? '👑 Admin' : profile.role === 'MODERATOR' ? '🛡️ Mod' : '✅ Verificato'}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-gray-600 text-sm mt-2">{profile.bio}</p>}
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span><strong className="text-gray-800">{profile.followersCount}</strong> follower</span>
              <span><strong className="text-gray-800">{profile.followingCount}</strong> seguiti</span>
            </div>
          </div>
          {isAuthenticated() && !isMe && (
            <button onClick={handleFollow}
              className={profile.isFollowedByMe ? 'btn-secondary' : 'btn-primary'}>
              {profile.isFollowedByMe ? 'Smetti di seguire' : '+ Segui'}
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-happy-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span style={{ fontSize: '14px' }}>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabLoading ? <Spinner /> : (
        <>
          {activeTab === 'contents' && (
            <div className="space-y-4">
              {contents.length === 0
                ? <p className="text-center text-gray-400 py-8">Nessun contenuto ancora.</p>
                : contents.map(c => <ContentCard key={c.id} content={c} />)
              }
            </div>
          )}

          {activeTab === 'reactions' && (
            <div className="space-y-3">
              {reactions.length === 0
                ? <p className="text-center text-gray-400 py-8">Nessuna reazione ancora.</p>
                : reactions.map(r => (
                  <Link
                    key={r.id}
                    to={`/content/${r.content.id}`}
                    className="card flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl flex-shrink-0" style={{ fontSize: '24px' }}>
                      {REACTION_EMOJI[r.reactionType] ?? '❤️'}
                    </div>
                    {r.content.mediaUrl && (
                      <img
                        src={r.content.mediaUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 line-clamp-2">{r.content.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: it })}
                      </p>
                    </div>
                  </Link>
                ))
              }
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {comments.length === 0
                ? <p className="text-center text-gray-400 py-8">Nessun commento ancora.</p>
                : comments.map(c => (
                  <Link
                    key={c.id}
                    to={`/content/${c.content.id}#comments`}
                    className="card flex items-start gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="text-lg flex-shrink-0 mt-0.5" style={{ fontSize: '18px' }}>💬</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-happy-600 font-medium mb-1 line-clamp-1">
                        su "{c.content.title}"
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-3">{c.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: it })}
                      </p>
                    </div>
                  </Link>
                ))
              }
            </div>
          )}
        </>
      )}
    </div>
  )
}
