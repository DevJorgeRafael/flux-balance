import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { HomeCardKey } from '@/core/preferences/preferences';
import { saveHomeCardPreference } from '@/core/preferences/preferencesStorage';

type HomeCardVisibility = Record<HomeCardKey, boolean>;

interface HomeCardsContextValue {
  visibility: HomeCardVisibility;
  isVisible: (key: HomeCardKey) => boolean;
  setVisible: (key: HomeCardKey, visible: boolean) => void;
}

const HomeCardsContext = createContext<HomeCardsContextValue | null>(null);

export function HomeCardsProvider({
  initialVisibility,
  children,
}: {
  initialVisibility: HomeCardVisibility;
  children: React.ReactNode;
}) {
  const [visibility, setVisibility] = useState<HomeCardVisibility>(initialVisibility);
  const [syncedVisibility, setSyncedVisibility] = useState<HomeCardVisibility>(initialVisibility);

  if (initialVisibility !== syncedVisibility) {
    setSyncedVisibility(initialVisibility);
    setVisibility(initialVisibility);
  }

  const setVisible = useCallback((key: HomeCardKey, visible: boolean) => {
    setVisibility((current) => ({ ...current, [key]: visible }));
    void saveHomeCardPreference(key, visible).catch((error) => {
      console.error('Error saving home card preference:', error);
    });
  }, []);

  const value = useMemo<HomeCardsContextValue>(
    () => ({
      visibility,
      isVisible: (key) => visibility[key],
      setVisible,
    }),
    [visibility, setVisible]
  );

  return <HomeCardsContext.Provider value={value}>{children}</HomeCardsContext.Provider>;
}

export function useHomeCards(): HomeCardsContextValue {
  const context = useContext(HomeCardsContext);
  if (!context) {
    throw new Error('useHomeCards debe usarse dentro de HomeCardsProvider');
  }
  return context;
}
