import React, { createContext, useContext, useMemo } from 'react';

export interface SplashTransitionState {
  isRevealing: boolean;
  isSplashHidden: boolean;
}

const SplashTransitionContext = createContext<SplashTransitionState>({
  isRevealing: true,
  isSplashHidden: true,
});

interface SplashTransitionProviderProps extends SplashTransitionState {
  children: React.ReactNode;
}

export function SplashTransitionProvider({
  isRevealing,
  isSplashHidden,
  children,
}: SplashTransitionProviderProps) {
  const value = useMemo(
    () => ({ isRevealing, isSplashHidden }),
    [isRevealing, isSplashHidden]
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
