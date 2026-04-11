import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyFollowers, getMyFollowing } from '../api/users'
import { getBlockedUsers, unblockUser } from '../api/blocks'
import type { UserSummary, ReportStatus, ReportTarget } from '../types'
import Avatar from '../components/common/Avatar'
import VerifiedBadge from '../components/common/VerifiedBadge'
import Spinner from '../components/common/Spinner'
import api from '../api/client'

type Tab = 'connections' | 'blocked' | 'reports'

interface ReportItem {
  id: number
  targetType: ReportTarget
  targetId: number
  reason: string
  status: ReportStatus
  reviewNote?: string
  createdAt: string
}

const STATUS_META: Record<ReportStatus, { label: string; color: string; icon: string }> = {
  PENDING:      { label: 'In attesa',    color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  UNDER_REVIEW: { label: 'In revisione', color: 'bg-blue-100 text-blue-700',    icon: '🔍' },
  RESOLVED:     { label: 'Risolta',      color: 'bg-green-100 text-green-700',  icon: '✅' },
  DISMISSED:    { label: 'Archiviata',   color: 'bg-gray-100 text-gray-500',    icon: '📁' },
}

const TARGET_LABELS: Record<ReportTarget, string> = {
  USER: 'Utente', CONTENT: 'Contenuto', COMMENT: 'Commento',
}

function UserRow({ user, action }: { user: UserSummary; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Link to={`/u/${user.username}`}>
        <Avatar user={user} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/u/${user.username}`}
          className="font-semibold text-sm block truncate hover:text-happy-600 transition-colors"
          style={{ color: 'var(--text-primary)' }}>
          {user.displayName}
          {user.verified && <span className="ml-1 text-blue-500 text-xs">✅</span>}
        </Link>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>@{user.username}</span>
      </div>
      {action}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('connections')
  const [followers, setFollowers] = useState<UserSummary[]>([])
  const [following, setFollowing] = useState<UserSummary[]>([])
  const [blocked,   setBlocked]   = useState<UserSummary[]>([])
  const [reports,   setReports]   = useState<ReportItem[]>([])

  const [loadingConnections, setLoadingConnections] = useState(false)
  const [loadingBlocked,     setLoadingBlocked]     = useState(false)
  const [loadingReports,     setLoadingReports]     = useState(false)

  useEffect(() => {
    if (activeTab === 'connections' && followers.length === 0 && following.length === 0) {
      setLoadingConnections(true)
      Promise.all([getMyFollowers(), getMyFollowing()])
        .then(([f, g]) => { setFollowers(f); setFollowing(g) })
        .finally(() => setLoadingConnections(false))
    }
    if (activeTab === 'blocked' && blocked.length === 0) {
      setLoadingBlocked(true)
      getBlockedUsers()
        .then(setBlocked)
        .finally(() => setLoadingBlocked(false))
    }
    if (activeTab === 'reports' && reports.length === 0) {
      setLoadingReports(true)
      api.get('/reports/mine')
        .then(r => setReports((r.data.content ?? r.data) as ReportItem[]))
        .catch(() => {})
        .finally(() => setLoadingReports(false))
    }
  }, [activeTab])

  const handleUnblock = async (userId: number) => {
    await unblockUser(userId)
    setBlocked(prev => prev.filter(u => u.id !== userId))
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'connections', label: 'Connessioni', icon: '👥' },
    { key: 'blocked',     label: 'Bloccati',    icon: '🚫' },
    { key: 'reports',     label: 'Segnalazioni',icon: '🚩' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-6" style={{ color: 'var(--text-primary)' }}>
        ⚙️ Impostazioni profilo
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl p-1 mb-6"
           style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === t.key
                ? 'bg-happy-500 text-white shadow-sm'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={activeTab !== t.key ? { color: 'var(--text-muted)' } : undefined}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Connessioni ── */}
      {activeTab === 'connections' && (
        <div className="space-y-5">
          {loadingConnections ? <Spinner /> : (
            <>
              <div className="card">
                <h2 className="font-display font-bold text-base mb-3" style={{ color: 'var(--text-primary)' }}>
                  👤 Follower <span className="text-happy-600 ml-1">{followers.length}</span>
                </h2>
                {followers.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: 'var(--text-faint)' }}>
                    Nessun follower ancora.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {followers.map(u => <UserRow key={u.id} user={u} />)}
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="font-display font-bold text-base mb-3" style={{ color: 'var(--text-primary)' }}>
                  ➡️ Seguiti <span className="text-happy-600 ml-1">{following.length}</span>
                </h2>
                {following.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: 'var(--text-faint)' }}>
                    Non segui ancora nessuno.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {following.map(u => <UserRow key={u.id} user={u} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Utenti bloccati ── */}
      {activeTab === 'blocked' && (
        <div className="card">
          <h2 className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            🚫 Utenti bloccati
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            Gli utenti bloccati non possono seguirti e non vedi i loro contenuti nei feed.
          </p>

          {loadingBlocked ? <Spinner /> : blocked.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">😊</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nessun utente bloccato.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {blocked.map(u => (
                <UserRow
                  key={u.id}
                  user={u}
                  action={
                    <button
                      onClick={() => handleUnblock(u.id)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors flex-shrink-0"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      Sblocca
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Segnalazioni ── */}
      {activeTab === 'reports' && (
        <div className="card">
          <h2 className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            🚩 Le mie segnalazioni
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
            Segnalazioni che hai inviato e il loro stato di revisione.
          </p>

          {loadingReports ? <Spinner /> : reports.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nessuna segnalazione inviata.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(r => {
                const meta = STATUS_META[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-500', icon: '?' }
                return (
                  <div key={r.id} className="rounded-xl p-4"
                       style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                        <span className="px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                          {TARGET_LABELS[r.targetType]} #{r.targetId}
                        </span>
                        <span>{new Date(r.createdAt).toLocaleDateString('it-IT')}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0 ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>

                    <p className="text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {r.reason}
                    </p>

                    {r.reviewNote && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">Nota del moderatore</p>
                        <p className="text-xs text-blue-700">{r.reviewNote}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
