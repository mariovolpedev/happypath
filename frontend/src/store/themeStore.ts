import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  getEffective: () => 'light' | 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system' as ThemeMode,
      setMode: (mode) => set({ mode }),
      getEffective: () => {
        const { mode } = get()
        if (mode === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return mode
      },
    }),
    { name: 'hp-theme' }
  )
)
