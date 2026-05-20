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
        // FIX: token is now stored ONLY inside Zustand persist (key 'hp-auth').
        // The old manual localStorage.setItem('hp_token', token) created a
        // second, redundant key that was NOT cleared consistently on logout,
        // leaving a stale token in storage after the user logged out.
        set({ token, user })
      },

      setUser: (user) => {
        set({ user })
      },

      logout: () => {
        // FIX: no more manual localStorage.removeItem('hp_token') needed here
        // because the token no longer lives under that key.
        // Zustand persist clears the 'hp-auth' key when the store state is reset.
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
    {
      name: 'hp-auth',
      // Only persist the data fields; derived functions are re-created on hydration.
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        showTutorial: state.showTutorial,
      }),
    }
  )
)
