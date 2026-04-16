import { useEffect, useState } from 'react'
import type { AlterEgoResponse, UserSummary } from '../../types'
import { getMyAlterEgos } from '../../api/alterEgos'
import Avatar from '../common/Avatar'

interface Props {
  user: UserSummary
  selectedAlterEgoId: number | undefined
  onChange: (alterEgoId: number | undefined) => void
  label?: string
}

export default function PublisherPicker({
  user,
  selectedAlterEgoId,
  onChange,
  label = 'Pubblica come:',
}: Props) {
  const [alterEgos, setAlterEgos] = useState<AlterEgoResponse[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getMyAlterEgos()
      .then(setAlterEgos)
      .catch(() => setAlterEgos([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (alterEgos.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {/* Profilo reale */}
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
            selectedAlterEgoId === undefined
              ? 'border-happy-500 bg-happy-50 text-happy-700 font-medium shadow-sm'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
          }`}
        >
          <Avatar user={user as any} size="xs" />
          <span>👤 {user.displayName}</span>
          {selectedAlterEgoId === undefined && (
            <span className="text-xs bg-happy-200 text-happy-800 rounded-full px-1.5 py-0.5">✓</span>
          )}
        </button>

        {/* Alter ego */}
        {alterEgos.map(ae => (
          <button
            key={ae.id}
            type="button"
            onClick={() => onChange(ae.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
              selectedAlterEgoId === ae.id
                ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium shadow-sm'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            {ae.avatarUrl ? (
              <img
                src={ae.avatarUrl}
                alt={ae.name}
                className="w-5 h-5 rounded-full object-cover"
                width={20}
                height={20}
                loading="lazy"
              />
            ) : (
              <span>🎭</span>
            )}
            <span>{ae.name}</span>
            {selectedAlterEgoId === ae.id && (
              <span className="text-xs bg-purple-200 text-purple-800 rounded-full px-1.5 py-0.5">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
