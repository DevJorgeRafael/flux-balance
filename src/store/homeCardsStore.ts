import { create } from 'zustand';
import {
  DEFAULT_HOME_CARD_VISIBILITY,
  type HomeCardKey,
} from '@/core/preferences/preferences';

export type HomeCardVisibility = Record<HomeCardKey, boolean>;

interface HomeCardsState {
  visibility: HomeCardVisibility;
  hydrate: (visibility: HomeCardVisibility) => void;
  setVisible: (key: HomeCardKey, visible: boolean) => void;
}

export const useHomeCardsStore = create<HomeCardsState>((set) => ({
  visibility: { ...DEFAULT_HOME_CARD_VISIBILITY },

  hydrate: (visibility) => set({ visibility }),

  setVisible: (key, visible) =>
    set((state) => ({
      visibility: { ...state.visibility, [key]: visible },
    })),
}));

export function useHomeCards() {
  const visibility = useHomeCardsStore((state) => state.visibility);
  const setVisible = useHomeCardsStore((state) => state.setVisible);

  return {
    visibility,
    isVisible: (key: HomeCardKey) => visibility[key],
    setVisible,
  };
}
