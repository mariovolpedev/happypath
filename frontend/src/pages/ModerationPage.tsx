import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  getPendingReports, resolveReport, censorContent,
  deleteContentByMod, warnUser, banUser,
} from '../api/moderation'
import AlterEgoVerificationPanel from '../components/alterEgo/AlterEgoVerificationPanel'

// ── Tipi (allineati al repo) ──────────────────────────────────────────────────

interface UserSummary {
  id: number; username: string; displayName: string
  avatarUrl?: string; role: string; verified: boolean
}
interface ContentDetail {
  id: number; title: string; body?: string; mediaUrl?: string
  author: UserSummary; theme?: { name: string; iconEmoji?: string }; createdAt: string
}
interface Report {
  id: number; reporter: UserSummary
  targetType: 'USER' | 'CONTENT' | 'COMMENT'; targetId: number
  reason: string; status: string; createdAt: string
  targetUser?: UserSummary; targetContent?: ContentDetail; targetCommentText?: string
}

type Tab = 'reports' | 'ae-verifications'

// ── Componenti ausiliari (identici al repo) ───────────────────────────────────

function UserChip({ user, label }: { user: UserSummary; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide w-20 shrink-0"
            style={{ color: 'var(--text-faint)' }}>
        {label}
      </span>
      <Link to={`/u/${user.username}`}
        className="flex items-center gap-1.5 text-sm text-happy-700 font-medium hover:underline"
        target="_blank" rel="noopener noreferrer">
        {user.verified && <span title="Verificato">✅</span>}
        {user.displayName}
        <span style={{ color: 'var(--text-faint)' }} className="font-normal">@{user.username}</span>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>↗</span>
      </Link>
    </div>
  )
}

function ContentPreview({ content }: { content: ContentDetail }) {
  return (
    <div className="rounded-xl p-3 space-y-2 text-sm"
         style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {content.title}
        </p>
        <Link to={`/content/${content.id}`}
          className="text-xs text-happy-600 hover:underline shrink-0"
          target="_blank" rel="noopener noreferrer">Apri ↗</Link>
      </div>
      {content.body && (
        <p className="line-clamp-3" style={{ color: 'var(--text-muted)' }}>{content.body}</p>
      )}
      {content.mediaUrl && (
        <img src={content.mediaUrl} alt={content.title}
          className="w-full max-h-40 object-cover rounded-lg" />
      )}
      <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-faint)' }}>Autore:</span>
        <Link to={`/u/${content.author.username}`}
          className="text-happy-700 font-medium hover:underline flex items-center gap-1"
          target="_blank" rel="noopener noreferrer">
          {content.author.verified && <span>✅</span>}
          {content.author.displayName}
          <span style={{ color: 'var(--text-faint)' }} className="font-normal">@{content.author.username}</span>
          <span className="text-xs">↗</span>
        </Link>
        {content.theme && (
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
            {content.theme.iconEmoji} {content.theme.name}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function ModerationPage() {
  const [tab, setTab]           = useState<Tab>('reports')
  const [reports, setReports]   = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [note, setNote]         = useState('')
  const [banDuration, setBanDuration] = useState('SHORT')
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getPendingReports()
      .then((p: any) => setReports(p.content ?? []))
      .finally(() => setFetching(false))
  }, [])

  const removeReport = (id: number) => {
    setReports(r => r.filter(x => x.id !== id))
    if (selected?.id === id) { setSelected(null); setNote('') }
  }

  const handleAction = async (action: string) => {
    if (!selected) return
    setLoading(true)
    try {
      switch (action) {
        case 'dismiss': await resolveReport(selected.id, note, true);  break
        case 'resolve': await resolveReport(selected.id, note, false); break
        case 'censor':  await censorContent(selected.targetId, note);  break
        case 'delete':  await deleteContentByMod(selected.targetId, note); break
        case 'warn':    await warnUser(selected.targetId, note);       break
        case 'ban':     await banUser(selected.targetId, note, banDuration); break
      }
      removeReport(selected.id)
    } finally { setLoading(false) }
  }

  const reportSummary = (r: Report) => {
    if (r.targetType === 'USER'    && r.targetUser)    return `@${r.targetUser.username}`
    if (r.targetType === 'CONTENT' && r.targetContent) return `"${r.targetContent.title}"`
    if (r.targetType === 'COMMENT' && r.targetCommentText)
      return `"${r.targetCommentText.slice(0, 40)}…"`
    return `ID ${r.targetId}`
  }

  const typeColor = (t: string) =>
    t === 'USER'    ? 'bg-purple-100 text-purple-700' :
    t === 'CONTENT' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-6"
          style={{ color: 'var(--text-primary)' }}>
        🛡️ Pannello Moderazione
      </h1>

      {/* ── Tab bar ── */}
      <div className="flex gap-2 mb-6"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors ${
            tab === 'reports'
              ? 'bg-white dark:bg-[#1a1d27] border border-b-white dark:border-b-[#1a1d27] text-happy-700 -mb-px'
              : 'hover:text-happy-600'
          }`}
          style={tab !== 'reports' ? { color: 'var(--text-muted)' } : undefined}
        >
          🚩 Segnalazioni
          {reports.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-1.5">
              {reports.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('ae-verifications')}
          className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors ${
            tab === 'ae-verifications'
              ? 'bg-white dark:bg-[#1a1d27] border border-b-white dark:border-b-[#1a1d27] text-happy-700 -mb-px'
              : 'hover:text-happy-600'
          }`}
          style={tab !== 'ae-verifications' ? { color: 'var(--text-muted)' } : undefined}
        >
          🪪 Verifiche Alter Ego
        </button>
      </div>

      {/* ── Tab: Segnalazioni ── */}
      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Lista */}
          <div className="space-y-2">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              {reports.length === 0
                ? 'Nessuna segnalazione in attesa 🎉'
                : `${reports.length} segnalazion${reports.length === 1 ? 'e' : 'i'} in attesa`}
            </p>

            {fetching && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-happy-200 border-t-happy-500 rounded-full animate-spin" />
              </div>
            )}

            {reports.map(r => (
              <button key={r.id} onClick={() => { setSelected(r); setNote('') }}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  selected?.id === r.id
                    ? 'border-happy-400 bg-happy-50 shadow-sm'
                    : 'hover:shadow-sm'
                }`}
                style={selected?.id !== r.id ? {
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                } : undefined}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor(r.targetType)}`}>
                    {r.targetType}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-faint)' }}>
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: it })}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                  {reportSummary(r)}
                </p>
                <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {r.reason}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  Segnalato da{' '}
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                    @{r.reporter.username}
                  </span>
                </p>
              </button>
            ))}
          </div>

          {/* Dettaglio */}
          {selected ? (
            <div className="card space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg">Segnalazione #{selected.id}</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor(selected.targetType)}`}>
                  {selected.targetType}
                </span>
              </div>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--text-faint)' }}>Chi ha segnalato</h3>
                <UserChip user={selected.reporter} label="Segnalatore" />
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--text-faint)' }}>Oggetto segnalato</h3>

                {selected.targetType === 'USER' && selected.targetUser && (
                  <div className="rounded-xl p-3 space-y-2"
                       style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <UserChip user={selected.targetUser} label="Utente" />
                  </div>
                )}
                {selected.targetType === 'USER' && !selected.targetUser && (
                  <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>
                    Utente non più disponibile (ID {selected.targetId})
                  </p>
                )}
                {selected.targetType === 'CONTENT' && selected.targetContent && (
                  <ContentPreview content={selected.targetContent} />
                )}
                {selected.targetType === 'CONTENT' && !selected.targetContent && (
                  <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>
                    Contenuto non più disponibile (ID {selected.targetId})
                  </p>
                )}
                {selected.targetType === 'COMMENT' && (
                  <div className="rounded-xl p-3"
                       style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Testo del commento</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {selected.targetCommentText ?? <em style={{ color: 'var(--text-faint)' }}>Non più disponibile</em>}
                    </p>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--text-faint)' }}>Motivo</h3>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-gray-700">
                  {selected.reason}
                </div>
              </section>

              <section className="space-y-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--text-faint)' }}>Azione moderatore</h3>

                <textarea
                  className="input resize-none h-20 text-sm"
                  placeholder="Note interne (obbligatorie per ban e ammonizioni)..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />

                {selected.targetType === 'USER' && (
                  <select className="input text-sm" value={banDuration}
                    onChange={e => setBanDuration(e.target.value)}>
                    <option value="SHORT">Ban breve – 1 giorno</option>
                    <option value="MEDIUM">Ban medio – 7 giorni</option>
                    <option value="LONG">Ban lungo – 30 giorni</option>
                    <option value="PERMANENT">Ban permanente</option>
                  </select>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAction('dismiss')} disabled={loading}
                    className="btn-secondary text-sm justify-center">🙈 Ignora</button>
                  <button onClick={() => handleAction('resolve')} disabled={loading}
                    className="btn-secondary text-sm justify-center">✅ Risolvi</button>

                  {selected.targetType === 'CONTENT' && <>
                    <button onClick={() => handleAction('censor')} disabled={loading}
                      className="rounded-full px-3 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors justify-center flex">
                      🙊 Censura
                    </button>
                    <button onClick={() => handleAction('delete')} disabled={loading}
                      className="rounded-full px-3 py-2 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors justify-center flex">
                      🗑️ Elimina
                    </button>
                  </>}

                  {selected.targetType === 'USER' && <>
                    <button onClick={() => handleAction('warn')} disabled={loading || !note.trim()}
                      className="rounded-full px-3 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-40 transition-colors justify-center flex">
                      ⚠️ Ammonisci
                    </button>
                    <button onClick={() => handleAction('ban')} disabled={loading || !note.trim()}
                      className="rounded-full px-3 py-2 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 transition-colors justify-center flex">
                      🔨 Ban
                    </button>
                  </>}
                </div>

                {loading && (
                  <p className="text-center text-sm animate-pulse" style={{ color: 'var(--text-faint)' }}>
                    Azione in corso…
                  </p>
                )}
              </section>
            </div>
          ) : (
            <div className="card text-center py-16 sticky top-24"
                 style={{ color: 'var(--text-faint)' }}>
              <p className="text-3xl mb-3">👈</p>
              <p className="font-medium">Seleziona una segnalazione per vedere i dettagli</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Verifiche Alter Ego ── */}
      {tab === 'ae-verifications' && <AlterEgoVerificationPanel />}
    </div>
  )
}
