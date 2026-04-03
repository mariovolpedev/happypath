import { useState, useEffect } from 'react'
import { getPendingReports, resolveReport, censorContent, deleteContentByMod, warnUser, banUser } from '../api/moderation'

interface Report { id: number; reporter: { displayName: string }; targetType: string; targetId: number; reason: string; status: string; createdAt: string }

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [note, setNote] = useState('')
  const [banDuration, setBanDuration] = useState('SHORT')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPendingReports().then((p: any) => setReports(p.content ?? []))
  }, [])

  const handleAction = async (action: string) => {
    if (!selected) return
    setLoading(true)
    try {
      switch (action) {
        case 'dismiss': await resolveReport(selected.id, note, true); break
        case 'resolve': await resolveReport(selected.id, note, false); break
        case 'censor': await censorContent(selected.targetId, note); break
        case 'delete': await deleteContentByMod(selected.targetId, note); break
        case 'warn': await warnUser(selected.targetId, note); break
        case 'ban': await banUser(selected.targetId, note, banDuration); break
      }
      setReports(r => r.filter(x => x.id !== selected.id))
      setSelected(null); setNote('')
    } finally { setLoading(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h1 className="font-display font-bold text-xl mb-4">🛡️ Pannello Moderazione</h1>
        {reports.length === 0
          ? <p className="text-gray-400 text-center py-8">Nessuna segnalazione in attesa 🎉</p>
          : <div className="space-y-3">
            {reports.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`card w-full text-left hover:shadow-md transition-shadow ${selected?.id === r.id ? 'ring-2 ring-happy-400' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase text-gray-400">{r.targetType} #{r.targetId}</span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('it')}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{r.reason}</p>
                <p className="text-xs text-gray-400 mt-1">Segnalato da: {r.reporter.displayName}</p>
              </button>
            ))}
          </div>
        }
      </div>

      {selected && (
        <div className="card sticky top-24 h-fit">
          <h2 className="font-display font-bold text-lg mb-4">Azione su segnalazione #{selected.id}</h2>
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
            <p><strong>Tipo:</strong> {selected.targetType} (ID: {selected.targetId})</p>
            <p className="mt-1"><strong>Motivo:</strong> {selected.reason}</p>
          </div>
          <textarea className="input resize-none h-24 mb-4" placeholder="Note (obbligatorio per ban/ammonizione)..."
            value={note} onChange={e => setNote(e.target.value)} />
          {selected.targetType === 'USER' && (
            <select className="input mb-4" value={banDuration} onChange={e => setBanDuration(e.target.value)}>
              <option value="SHORT">Ban breve (1 giorno)</option>
              <option value="MEDIUM">Ban medio (7 giorni)</option>
              <option value="LONG">Ban lungo (30 giorni)</option>
              <option value="PERMANENT">Ban permanente</option>
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAction('dismiss')} disabled={loading} className="btn-secondary text-sm">Ignora</button>
            <button onClick={() => handleAction('resolve')} disabled={loading} className="btn-secondary text-sm">✅ Risolvi</button>
            {selected.targetType === 'CONTENT' && <>
              <button onClick={() => handleAction('censor')} disabled={loading} className="bg-yellow-100 text-yellow-700 rounded-full px-3 py-2 text-sm font-medium hover:bg-yellow-200">Censura</button>
              <button onClick={() => handleAction('delete')} disabled={loading} className="bg-red-100 text-red-700 rounded-full px-3 py-2 text-sm font-medium hover:bg-red-200">Elimina</button>
            </>}
            {selected.targetType === 'USER' && <>
              <button onClick={() => handleAction('warn')} disabled={loading || !note} className="bg-yellow-100 text-yellow-700 rounded-full px-3 py-2 text-sm font-medium hover:bg-yellow-200">Ammonisci</button>
              <button onClick={() => handleAction('ban')} disabled={loading || !note} className="bg-red-100 text-red-700 rounded-full px-3 py-2 text-sm font-medium hover:bg-red-200">🔨 Ban</button>
            </>}
          </div>
        </div>
      )}
    </div>
  )
}
