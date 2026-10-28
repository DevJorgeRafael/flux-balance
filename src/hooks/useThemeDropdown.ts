import { useState, useCallback } from 'react';
import { useThemeMode } from '@/components/ui/theme';
import { IS_DEVELOPMENT_MODE } from '@/core/constants/environment';

export function useThemeDropdown() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isDark, toggleTheme } = useThemeMode();

  const isDevMode = IS_DEVELOPMENT_MODE;

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return {
    isSettingsOpen,
    isDevMode,
    isDark,
    toggleTheme,
    toggleSettings,
    closeSettings,
  };
}

