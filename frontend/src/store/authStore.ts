import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSummary } from '../types'

interface AuthState {
  token: string | null
  user: UserSummary | null
  setAuth: (token: string, user: UserSummary) => void
  logout: () => void
  isAuthenticated: () => boolean
  isModeratorOrAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('hp_token', token)
        set({ token, user })
      },
      logout: () => {
        localStorage.removeItem('hp_token')
        set({ token: null, user: null })
      },
      isAuthenticated: () => !!get().token,
      isModeratorOrAdmin: () => {
        const role = get().user?.role
        return role === 'MODERATOR' || role === 'ADMIN'
      },
    }),
    { name: 'hp-auth' }
  )
)
