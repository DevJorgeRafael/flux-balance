import { create } from 'zustand';

export interface SplashTransitionState {
  isRevealing: boolean;
  isSplashHidden: boolean;
  revealDelay: number;
}

interface SplashTransitionStore extends SplashTransitionState {
  setState: (state: SplashTransitionState) => void;
}

export const useSplashTransitionStore = create<SplashTransitionStore>((set) => ({
  isRevealing: true,
  isSplashHidden: true,
  revealDelay: 0,
  setState: (state) => set(state),
}));

export function useSplashTransition(): SplashTransitionState {
  const isRevealing = useSplashTransitionStore((state) => state.isRevealing);
  const isSplashHidden = useSplashTransitionStore((state) => state.isSplashHidden);
  const revealDelay = useSplashTransitionStore((state) => state.revealDelay);

  return { isRevealing, isSplashHidden, revealDelay };
}
