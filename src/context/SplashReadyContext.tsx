import React, { createContext, useContext } from 'react';

const SplashReadyContext = createContext(false);

interface SplashReadyProviderProps {
  ready: boolean;
  children: React.ReactNode;
}

export function SplashReadyProvider({ ready, children }: SplashReadyProviderProps) {
  return <SplashReadyContext.Provider value={ready}>{children}</SplashReadyContext.Provider>;
}

export function useSplashReady(): boolean {
  return useContext(SplashReadyContext);
}
