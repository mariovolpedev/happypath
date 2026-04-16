import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../../api/users'
import type { UserProfile } from '../../types'
import Avatar from './Avatar'

interface Props {
  username: string
  displayName: string
  children: React.ReactNode
  asSpan?: boolean
}

export default function UserHoverCard({ username, displayName, children, asSpan }: Props) {
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [visible, setVisible]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchedRef = useRef(false)

  const fetchProfile = useCallback(async () => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setLoading(true)
    try {
      const data = await getProfile(username)
      setProfile(data)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [username])

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      // Determine if card should appear above or below
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setPosition(spaceBelow < 200 ? 'top' : 'bottom')
      }
      fetchProfile()
      setVisible(true)
    }, 350)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {visible && (
        <span
          className="absolute z-50 w-64 rounded-xl shadow-lg border pointer-events-none"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow)',
            ...(position === 'bottom'
              ? { top: 'calc(100% + 6px)', left: 0 }
              : { bottom: 'calc(100% + 6px)', left: 0 }),
          }}
        >
          {loading || !profile ? (
            <span className="flex items-center justify-center py-6">
              <span
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin inline-block"
                style={{ borderColor: 'var(--text-faint)', borderTopColor: 'transparent' }}
              />
            </span>
          ) : (
            <Link
              to={`/u/${profile.username}`}
              className="flex flex-col gap-3 p-4 no-underline pointer-events-auto"
              style={{ color: 'inherit' }}
            >
              <span className="flex items-center gap-3">
                <Avatar user={profile} size="md" />
                <span className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {profile.displayName}
                    {profile.verified && <span className="ml-1 text-blue-500 text-xs">✅</span>}
                  </span>
                  <span className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                    @{profile.username} · #{profile.id}
                  </span>
                </span>
              </span>

              {profile.bio && (
                <span
                  className="text-xs line-clamp-2 leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {profile.bio}
                </span>
              )}

              <span className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {profile.followersCount}
                  </span>{' '}follower
                </span>
                <span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {profile.followingCount}
                  </span>{' '}seguiti
                </span>
              </span>
            </Link>
          )}
        </span>
      )}
    </span>
  )
}
