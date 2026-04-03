import { create } from 'zustand'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

type State = {
  byAdId: Record<string, ChatMessage[]>
  push: (adId: string, msg: ChatMessage) => void
  clear: (adId: string) => void
}

export const useChatStore = create<State>((set) => ({
  byAdId: {},
  push: (adId, msg) =>
    set((s) => ({
      byAdId: {
        ...s.byAdId,
        [adId]: [...(s.byAdId[adId] || []), msg],
      },
    })),
  clear: (adId) =>
    set((s) => {
      const next = { ...s.byAdId }
      delete next[adId]
      return { byAdId: next }
    }),
}))
