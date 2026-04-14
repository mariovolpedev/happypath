import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  getProfile, follow, unfollow, getUserContents, updateProfile,
  getUserReactions, getUserCommentsActivity,
  type UserReactionResponse, type UserCommentActivityResponse
} from '../api/users'
import { blockUser, unblockUser } from '../api/blocks'
import {
  getMyVerificationStatus,
  submitVerificationRequest,
  type VerificationRequestResponse,
  type SubmitVerificationRequest,
} from '../api/verification'
import type { UserProfile, ContentResponse } from '../types'
import Avatar from '../components/common/Avatar'
import VerifiedBadge from '../components/common/VerifiedBadge'
import ContentCard from '../components/content/ContentCard'
import ReportModal from '../components/content/ReportModal'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'

const REACTION_EMOJI: Record<string, string> = {
  HEART: '❤️', LAUGH: '😄', WOW: '🤩', CLAP: '👏', SMILE: '😊',
}

const PROFILE_COLORS = [
  { hex: '#22c55e', label: 'Verde'    },
  { hex: '#3b82f6', label: 'Blu'      },
  { hex: '#f59e0b', label: 'Ambra'    },
  { hex: '#ec4899', label: 'Rosa'     },
  { hex: '#8b5cf6', label: 'Viola'    },
  { hex: '#ef4444', label: 'Rosso'    },
  { hex: '#06b6d4', label: 'Ciano'    },
  { hex: '#f97316', label: 'Arancio'  },
  { hex: '#64748b', label: 'Ardesia'  },
  { hex: '#10b981', label: 'Smeraldo' },
]

function ColorSwatch({ hex, label, selected, onClick }: {
  hex: string; label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
      style={{
        backgroundColor: hex,
        boxShadow: selected ? `0 0 0 3px white, 0 0 0 5px ${hex}` : 'none',
        transform: selected ? 'scale(1.15)' : undefined,
      }}
      aria-label={label}
    />
  )
}

type Tab = 'contents' | 'reactions' | 'comments'

interface EditModalProps {
  profile: UserProfile
  onClose: () => void
  onSaved: (updated: UserProfile) => void
}

/* ════════════════════════════════════════════════════════════
   VerificationPanel  —  visibile solo se isMe && !verified
   ════════════════════════════════════════════════════════════ */
function VerificationPanel() {
  const [vrStatus, setVrStatus] = useState<VerificationRequestResponse | { status: 'NONE' } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getMyVerificationStatus()
      .then(setVrStatus)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="card p-4"><Spinner /></div>

  const status = (vrStatus as any)?.status ?? 'NONE'

  const statusBadge: Record<string, { label: string; color: string; icon: string }> = {
    NONE:     { label: 'Non inviata',  color: '#6b7280', icon: '○'  },
    PENDING:  { label: 'In revisione', color: '#f59e0b', icon: '⏳' },
    APPROVED: { label: 'Approvata',    color: '#22c55e', icon: '✅' },
    REJECTED: { label: 'Rifiutata',    color: '#ef4444', icon: '✗'  },
  }
  const badge = statusBadge[status] ?? statusBadge.NONE

  return (
    <div className="card p-5 space-y-3" style={{ borderLeft: '4px solid #f59e0b' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            🪪 Verifica identità
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ottieni la spunta blu inviando i tuoi dati anagrafici.
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ backgroundColor: badge.color + '20', color: badge.color }}
        >
          {badge.icon} {badge.label}
        </span>
      </div>

      {/* Motivo rifiuto, se presente */}
      {status === 'REJECTED' && (vrStatus as VerificationRequestResponse).reviewNote && (
        <div className="rounded-xl p-3 text-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>
          <strong>Motivo rifiuto:</strong> {(vrStatus as VerificationRequestResponse).reviewNote}
        </div>
      )}

      {/* CTA: mostra bottone solo se non c'è una richiesta in pending */}
      {(status === 'NONE' || status === 'REJECTED') && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-sm"
        >
          {status === 'REJECTED' ? '🔄 Invia nuova richiesta' : '+ Richiedi verifica'}
        </button>
      )}

      {showForm && (
        <VerificationForm
          onCancel={() => setShowForm(false)}
          onSuccess={res => { setVrStatus(res); setShowForm(false) }}
        />
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Form di richiesta verifica con validazione CF lato client
   ──────────────────────────────────────────────────────────── */
function VerificationForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess: (res: VerificationRequestResponse) => void
}) {
  const [form, setForm] = useState<SubmitVerificationRequest>({
    firstName: '', lastName: '', birthDate: '', birthPlace: '', gender: 'M', fiscalCode: '',
  })
  const [cfError, setCfError]   = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  const set = (k: keyof SubmitVerificationRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }))
      if (k === 'fiscalCode') setCfError('')
    }

  /* Validazione CF lato client: lunghezza + charset base */
  const validateCF = (cf: string): string => {
    if (cf.length !== 16) return 'Il codice fiscale deve avere esattamente 16 caratteri.'
    if (!/^[A-Za-z]{6}[0-9LMNPQRSTUVlmnpqrstuv]{2}[A-Za-zHhAbBcCdDeElLmMpPrRsStT][0-9LMNPQRSTUVlmnpqrstuv]{2}[A-Za-z][0-9LMNPQRSTUVlmnpqrstuv]{3}[A-Za-z]$/.test(cf))
      return 'Formato codice fiscale non corretto.'
    return ''
  }

  const handleCFBlur = () => setCfError(validateCF(form.fiscalCode))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cfErr = validateCF(form.fiscalCode)
    if (cfErr) { setCfError(cfErr); return }
    setApiError('')
    setLoading(true)
    try {
      const res = await submitVerificationRequest({
        ...form,
        fiscalCode: form.fiscalCode.toUpperCase(),
        gender: form.gender as 'M' | 'F',
      })
      onSuccess(res)
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message
          ?? err?.response?.data?.error
          ?? "Errore durante l'invio. Controlla i dati e riprova."
      )
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'input text-sm w-full'
  const labelCls = 'text-xs font-semibold uppercase tracking-wide mb-1 block'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Nome *</label>
          <input required className={inputCls} value={form.firstName} onChange={set('firstName')} placeholder="Mario" />
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Cognome *</label>
          <input required className={inputCls} value={form.lastName} onChange={set('lastName')} placeholder="Rossi" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Data di nascita *</label>
          <input required type="date" className={inputCls} value={form.birthDate} onChange={set('birthDate')} />
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Sesso *</label>
          <select required className={inputCls} value={form.gender} onChange={set('gender')}>
            <option value="M">Maschio</option>
            <option value="F">Femmina</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Comune di nascita *</label>
        <input required className={inputCls} value={form.birthPlace} onChange={set('birthPlace')} placeholder="Roma" />
      </div>

      <div>
        <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Codice fiscale *</label>
        <input
          required
          className={`${inputCls} uppercase ${cfError ? 'border-red-400' : ''}`}
          value={form.fiscalCode}
          onChange={set('fiscalCode')}
          onBlur={handleCFBlur}
          placeholder="RSSMRA80A01H501Z"
          maxLength={16}
        />
        {cfError && <p className="text-xs text-red-500 mt-1">{cfError}</p>}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        🔒 I tuoi dati vengono usati solo per la verifica e non sono pubblici.
      </p>

      {apiError && <p className="text-sm text-red-500">{apiError}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">Annulla</button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 justify-center disabled:opacity-50"
        >
          {loading ? 'Invio…' : '📨 Invia richiesta'}
        </button>
      </div>
    </form>
  )
}

/* ════════════════════════════════════════════════════════════
   ProfilePage
   ════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile]       = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab]   = useState<Tab>('contents')
  const [loading, setLoading]       = useState(true)
  const [showEdit, setShowEdit]     = useState(false)
  const [contents, setContents]     = useState<ContentResponse[]>([])
  const [reactions, setReactions]   = useState<UserReactionResponse[]>([])
  const [comments, setComments]     = useState<UserCommentActivityResponse[]>([])
  const [tabLoading, setTabLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const { user: me, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

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
    if (tab === 'contents'  && contents.length  > 0) return
    if (tab === 'reactions' && reactions.length  > 0) return
    if (tab === 'comments'  && comments.length   > 0) return
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
    } finally {
      setTabLoading(false)
    }
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

  const handleBlock = async () => {
    if (!profile) return
    if (profile.isBlockedByMe) {
      await unblockUser(profile.id)
      setProfile(p => p ? { ...p, isBlockedByMe: false } : p)
    } else {
      if (!window.confirm(
        `Vuoi bloccare ${profile.displayName}?\nNon potranno seguirti e non vedrai i loro contenuti nei feed.`
      )) return
      await blockUser(profile.id)
      setProfile(p => p ? { ...p, isBlockedByMe: true, isFollowedByMe: false } : p)
    }
  }

  if (loading) return <Spinner />

  /*
   * FIX: rimosso il blocco che impediva agli utenti non verificati
   * di vedere il proprio profilo. Ora si mostra "Utente non trovato"
   * solo se il profilo non esiste sul server, non in base allo stato
   * di verifica dell'utente loggato.
   */
  if (!profile) return <p className="text-center" style={{ color: 'var(--text-muted)' }}>Utente non trovato</p>

  const isMe       = me?.username === username
  const accent     = profile.profileColor ?? '#22c55e'
  const canReport  = isAuthenticated() && !isMe
  const canMessage = isAuthenticated() && !isMe && me?.verified && profile.verified

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'contents',  label: 'Contenuti', emoji: '📝' },
    { key: 'reactions', label: 'Reazioni',  emoji: '❤️' },
    { key: 'comments',  label: 'Commenti',  emoji: '💬' },
  ]

  return (
    <>
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={updated => setProfile(updated)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* ── Header card ── */}
        <div className="card overflow-hidden p-0">
          <div className="h-20 w-full" style={{
            background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}44 100%)`,
          }} />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-3">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center
                           text-2xl font-bold flex-shrink-0"
                style={{ border: `4px solid var(--bg-card)`, backgroundColor: accent + '33', color: accent }}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile.displayName?.slice(0, 1).toUpperCase() ?? '?'
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 items-end">
                {isMe && (
                  <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
                    ✏️ Modifica profilo
                  </button>
                )}

                {isAuthenticated() && !isMe && (
                  <>
                    {!profile.isBlockedByMe && (
                      <button
                        onClick={handleFollow}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                        style={
                          profile.isFollowedByMe
                            ? { border: `1.5px solid ${accent}`, color: accent, backgroundColor: 'transparent' }
                            : { backgroundColor: accent, color: '#fff', border: 'none' }
                        }
                      >
                        {profile.isFollowedByMe ? 'Smetti di seguire' : '+ Segui'}
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleBlock}
                        title={profile.isBlockedByMe ? 'Sblocca utente' : 'Blocca utente'}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          profile.isBlockedByMe
                            ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
                            : 'border-red-200 text-red-500 hover:bg-red-50'
                        }`}
                      >
                        {profile.isBlockedByMe ? '✓ Sblocca' : '🚫 Blocca'}
                      </button>
                      {canReport && (
                        <button
                          onClick={() => setShowReport(true)}
                          title="Segnala utente"
                          className="text-xs px-3 py-1.5 rounded-full border border-orange-200 text-orange-500 hover:bg-orange-50 transition-colors"
                        >
                          🚩 Segnala
                        </button>
                      )}
                    </div>
                    {canMessage && (
                      <button
                        onClick={() => navigate(`/messages?with=${profile.username}`)}
                        className="btn-secondary text-sm flex items-center gap-1.5 justify-center"
                      >
                        💬 Messaggio
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {profile.isBlockedByMe && (
              <div className="mb-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500 text-center">
                Hai bloccato questo utente. I suoi contenuti non appariranno nei tuoi feed.
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl">{profile.displayName}</h1>
              {profile.verified && <VerifiedBadge />}
              {profile.role !== 'USER' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  profile.role === 'ADMIN'     ? 'bg-red-100 text-red-700'   :
                  profile.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profile.role === 'ADMIN' ? '👑 Admin' : profile.role === 'MODERATOR' ? '🛡️ Mod' : '✅ Verificato'}
                </span>
              )}
              {profile.isBlockedByMe && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">🚫 Bloccato</span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{profile.bio}</p>
            )}
            <div className="flex gap-5 mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>{profile.followersCount}</strong> follower</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>{profile.followingCount}</strong> seguiti</span>
            </div>

            {isAuthenticated() && !isMe && !canMessage && !profile.isBlockedByMe && (
              <p className="mt-2 text-xs text-gray-400">
                {!me?.verified
                  ? '🔒 Verifica la tua identità per inviare messaggi privati.'
                  : !profile.verified
                  ? '🔒 Questo utente non ha ancora verificato la propria identità.'
                  : null}
              </p>
            )}
          </div>
        </div>

        {/*
          ── Pannello verifica identità ──
          Visibile solo al proprietario del profilo se non ancora verificato.
          L'utente non verificato può ora sempre vedere il proprio profilo
          e inviare la richiesta di verifica da qui.
        */}
        {isMe && !profile.verified && <VerificationPanel />}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t.key ? 'bg-happy-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span style={{ fontSize: '14px' }}>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {showReport && profile && (
          <ReportModal
            targetType="USER"
            targetId={profile.id}
            targetLabel={`@${profile.username}`}
            onClose={() => setShowReport(false)}
          />
        )}

        {tabLoading ? <Spinner /> : (
          <>
            {activeTab === 'contents' && !profile.isBlockedByMe && (
              <div className="space-y-4">
                {contents.length === 0
                  ? <p className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Nessun contenuto ancora.</p>
                  : contents.map(c => <ContentCard key={c.id} content={c} />)}
              </div>
            )}
            {activeTab === 'contents' && profile.isBlockedByMe && (
              <p className="text-center py-8 text-gray-400">Hai bloccato questo utente. Sblocca per vedere i suoi contenuti.</p>
            )}
            {activeTab === 'reactions' && (
              <div className="space-y-3">
                {reactions.length === 0
                  ? <p className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Nessuna reazione ancora.</p>
                  : reactions.map(r => (
                    <Link key={r.id} to={`/content/${r.content.id}`}
                      className="card flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="text-2xl flex-shrink-0">{REACTION_EMOJI[r.reactionType] ?? '❤️'}</div>
                      {r.content.mediaUrl && (
                        <img src={r.content.mediaUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 line-clamp-2">{r.content.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: it })}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                {comments.length === 0
                  ? <p className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Nessun commento ancora.</p>
                  : comments.map(c => (
                    <Link key={c.id} to={`/content/${c.content.id}#comments`}
                      className="card flex items-start gap-3 hover:shadow-md transition-shadow">
                      <div className="text-lg flex-shrink-0 mt-0.5">💬</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-happy-600 font-medium mb-1 line-clamp-1">su "{c.content.title}"</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{c.text}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: it })}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   EditProfileModal
   ════════════════════════════════════════════════════════════ */
function EditProfileModal({ profile, onClose, onSaved }: EditModalProps) {
  const [displayName,  setDisplayName]  = useState(profile.displayName ?? '')
  const [bio,          setBio]          = useState(profile.bio ?? '')
  const [avatarUrl,    setAvatarUrl]    = useState(profile.avatarUrl ?? '')
  const [profileColor, setProfileColor] = useState(profile.profileColor ?? PROFILE_COLORS[0].hex)
  const [customColor,  setCustomColor]  = useState(profile.profileColor ?? PROFILE_COLORS[0].hex)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleOverlay = (e: React.MouseEvent) => { if (e.target === overlayRef.current) onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const updated = await updateProfile({
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        profileColor: profileColor || undefined,
      })
      onSaved(updated)
      onClose()
    } catch {
      setError('Errore durante il salvataggio. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const isPreset = PROFILE_COLORS.some(c => c.hex === profileColor)

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="h-2 transition-colors duration-200" style={{ backgroundColor: profileColor }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>✏️ Modifica profilo</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: 'var(--text-faint)' }}>✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-bold"
                style={{ border: `3px solid ${profileColor}`, backgroundColor: profileColor + '22' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <span style={{ color: profileColor }}>{displayName?.slice(0, 1).toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>URL immagine profilo</label>
                <input className="input text-sm" placeholder="https://esempio.com/mia-foto.jpg" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome visualizzato</label>
              <input className="input" placeholder="Il tuo nome" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>Bio <span style={{ color: 'var(--text-faint)' }}>({bio.length}/300)</span></label>
              <textarea className="input resize-none h-20" placeholder="Raccontaci qualcosa di te... 🌱" value={bio} onChange={e => setBio(e.target.value)} maxLength={300} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text-muted)' }}>Colore profilo</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PROFILE_COLORS.map(c => (
                  <ColorSwatch key={c.hex} hex={c.hex} label={c.label} selected={profileColor === c.hex} onClick={() => { setProfileColor(c.hex); setCustomColor(c.hex) }} />
                ))}
                <label
                  title="Colore personalizzato"
                  className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-110"
                  style={{ border: '2px dashed var(--border)', boxShadow: !isPreset ? `0 0 0 3px white, 0 0 0 5px ${profileColor}` : 'none' }}
                >
                  <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setProfileColor(e.target.value) }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs pointer-events-none select-none">🎨</span>
                </label>
              </div>
              <div className="h-1.5 rounded-full transition-colors duration-200" style={{ backgroundColor: profileColor }} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Annulla</button>
              <button
                type="submit" disabled={loading}
                className="flex-1 justify-center inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-full transition-all shadow-sm disabled:opacity-50"
                style={{ backgroundColor: profileColor }}
              >
                {loading ? 'Salvataggio…' : '💾 Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
