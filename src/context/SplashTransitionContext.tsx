import React, { createContext, useContext, useMemo } from 'react';

export interface SplashTransitionState {
  isRevealing: boolean;
  isSplashHidden: boolean;
  revealDelay: number;
}

const SplashTransitionContext = createContext<SplashTransitionState>({
  isRevealing: true,
  isSplashHidden: true,
  revealDelay: 0,
});

interface SplashTransitionProviderProps extends SplashTransitionState {
  children: React.ReactNode;
}

export function SplashTransitionProvider({
  isRevealing,
  isSplashHidden,
  revealDelay,
  children,
}: SplashTransitionProviderProps) {
  const value = useMemo(
    () => ({ isRevealing, isSplashHidden, revealDelay }),
    [isRevealing, isSplashHidden, revealDelay]
  );

  return (
    <SplashTransitionContext.Provider value={value}>
      {children}
    </SplashTransitionContext.Provider>
  );
}

export function useSplashTransition(): SplashTransitionState {
  return useContext(SplashTransitionContext);
}
