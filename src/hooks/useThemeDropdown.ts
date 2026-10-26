import { useState, useCallback, useRef } from 'react';
import type { ViewInstance } from 'react-native';
import { useThemeMode, useThemeTransition } from '@/components/ui/theme';

export function useThemeDropdown() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isDark, toggleTheme: toggleThemeImmediate } = useThemeMode();
  const { toggleThemeAnimated } = useThemeTransition();
  const themeButtonRef = useRef<ViewInstance>(null);

  const isDevMode = __DEV__;

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    const button = themeButtonRef.current;
    if (!button) {
      toggleThemeImmediate();
      return;
    }

    button.measureInWindow((x, y, width, height) => {
      if (width === 0 || height === 0) {
        toggleThemeImmediate();
        return;
      }
      toggleThemeAnimated(x + width / 2, y + height / 2);
    });
  }, [toggleThemeAnimated, toggleThemeImmediate]);

  return {
    isSettingsOpen,
    isDevMode,
    isDark,
    toggleTheme,
    themeButtonRef,
    toggleSettings,
    closeSettings,
  };
}
