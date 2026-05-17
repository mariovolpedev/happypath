import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSummary } from '../types'

export interface AuthState {
  token: string | null
  user: UserSummary | null
  showTutorial: boolean
  setAuth: (token: string, user: UserSummary) => void
  /** Aggiorna solo i dati utente (es. dopo upload avatar) */
  setUser: (user: UserSummary) => void
  logout: () => void
  isAuthenticated: () => boolean
  isModeratorOrAdmin: () => boolean
  /** Chiamato dal LoginPage/RegisterPage per segnalare il primo accesso */
  markFirstLogin: () => void
  /** Chiamato dal TutorialOverlay quando l'utente chiude/completa */
  dismissTutorial: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      showTutorial: false,
      setAuth: (token, user) => {
        localStorage.setItem('hp_token', token)
        set({ token, user })
      },
      setUser: (user) => {
        set({ user })
      },
      logout: () => {
        localStorage.removeItem('hp_token')
        set({ token: null, user: null, showTutorial: false })
      },
      isAuthenticated: () => !!get().token,
      isModeratorOrAdmin: () => {
        const role = get().user?.role
        return role === 'MODERATOR' || role === 'ADMIN'
      },
      markFirstLogin: () => {
        const user = get().user
        // Mostra il tutorial solo se l'utente non lo ha ancora completato
        if (user && !user.tutorialCompleted) {
          set({ showTutorial: true })
        }
      },
      dismissTutorial: () => {
        set({ showTutorial: false })
      },
    }),
    { name: 'hp-auth' }
  )
)
