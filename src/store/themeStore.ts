import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

type State = {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<State>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: next })
        document.documentElement.dataset.theme = next
      },
      setTheme: (t) => {
        set({ theme: t })
        document.documentElement.dataset.theme = t
      },
    }),
    {
      name: 'avito-seller-theme',
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.dataset.theme = state.theme
        }
      },
    },
  ),
)
