import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getProfile, follow, unfollow, getUserContents } from '../api/users'
import type { UserProfile, ContentResponse } from '../types'
import Avatar from '../components/common/Avatar'
import VerifiedBadge from '../components/common/VerifiedBadge'
import ContentCard from '../components/content/ContentCard'
import ReportModal from '../components/content/ReportModal'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile]       = useState<UserProfile | null>(null)
  const [contents, setContents]     = useState<ContentResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [showReport, setShowReport] = useState(false)
  const { user: me, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!username) return
    Promise.all([getProfile(username), getUserContents(username)])
      .then(([p, c]) => { setProfile(p); setContents(c.content) })
      .finally(() => setLoading(false))
  }, [username])

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

  const isMe     = me?.username === username
  const canReport = isAuthenticated() && !isMe

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ── Header profilo ── */}
        <div className="card">
          <div className="flex items-start gap-4">
            <Avatar user={profile} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl">{profile.displayName}</h1>
                {profile.verified && <VerifiedBadge />}
                {profile.role !== 'USER' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    profile.role === 'ADMIN'      ? 'bg-red-100 text-red-700' :
                    profile.role === 'MODERATOR'  ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                  }`}>
                    {profile.role === 'ADMIN' ? '👑 Admin' :
                     profile.role === 'MODERATOR' ? '🛡️ Mod' : '✅ Verificato'}
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

            {/* Azioni */}
            <div className="flex flex-col items-end gap-2">
              {isAuthenticated() && !isMe && (
                <button
                  onClick={handleFollow}
                  className={profile.isFollowedByMe ? 'btn-secondary' : 'btn-primary'}
                >
                  {profile.isFollowedByMe ? 'Smetti di seguire' : '+ Segui'}
                </button>
              )}
              {canReport && (
                <button
                  onClick={() => setShowReport(true)}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  title="Segnala utente"
                >
                  🚩 Segnala
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Contenuti ── */}
        <h2 className="font-display font-bold text-lg">Contenuti</h2>
        {contents.length === 0
          ? <p className="text-center text-gray-400 py-8">Nessun contenuto ancora.</p>
          : contents.map(c => <ContentCard key={c.id} content={c} />)
        }
      </div>

      {/* ── Modale segnalazione utente ── */}
      {showReport && profile && (
        <ReportModal
          targetType="USER"
          targetId={profile.id}
          targetLabel={`@${profile.username}`}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
