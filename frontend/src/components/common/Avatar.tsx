import type { UserSummary } from '../../types'

interface Props { user: UserSummary; size?: 'sm' | 'md' | 'lg' }

const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-16 h-16 text-xl' }

export default function Avatar({ user, size = 'md' }: Props) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.displayName}
      className={`${sizes[size]} rounded-full object-cover`} />
  }
  const initials = user.displayName?.slice(0, 1).toUpperCase() ?? '?'
  const colors = ['bg-green-200 text-green-700', 'bg-blue-200 text-blue-700',
    'bg-yellow-200 text-yellow-700', 'bg-pink-200 text-pink-700', 'bg-purple-200 text-purple-700']
  const color = colors[user.id % colors.length]
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}
