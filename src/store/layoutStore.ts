import { create } from 'zustand'

type Layout = 'grid' | 'list'

type State = {
  adsLayout: Layout
  setAdsLayout: (l: Layout) => void
  toggleAdsLayout: () => void
}

export const useLayoutStore = create<State>((set, get) => ({
  adsLayout: 'grid',
  setAdsLayout: (l) => set({ adsLayout: l }),
  toggleAdsLayout: () =>
    set({ adsLayout: get().adsLayout === 'grid' ? 'list' : 'grid' }),
}))
