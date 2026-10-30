import React, { useCallback, useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { LogBox } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';

import { StatusBar } from 'expo-status-bar';
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary';
import { FatalErrorScreen } from '@/components/errors/FatalErrorScreen';
import {
  UIProvider,
  useColors,
  useThemeMode,
  type ThemeMode,
} from '@/components/ui/theme';
import { initDatabase } from '@/infrastructure/database/db';
import { cleanupExportCache } from '@/infrastructure/backup/exportCache';
import { DashboardProvider } from '@/context/DashboardContext';
import { TranslationProvider } from '@/core/i18n/useTranslation';
import { CurrencyProvider } from '@/core/currency/useCurrency';
import { runStartup } from '@/core/services/startup';
import {
  loadStoredPreferences,
  saveThemePreference,
  type StoredPreferences,
} from '@/core/preferences/preferencesStorage';
import type { ThemePreference } from '@/core/preferences/preferences';

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  '[Reanimated] Dependencies should only be used on the web',
]);

function RootNavigator({ initialPreferences }: { initialPreferences: StoredPreferences }) {
  const insets = useSafeAreaInsets();
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    initialPreferences.themePreference
  );

  const handleModeChange = useCallback((mode: ThemeMode) => {
    setThemePreference(mode);
    void saveThemePreference(mode).catch((error) => {
      console.error('Error saving theme preference:', error);
    });
  }, []);

  return (
    <TranslationProvider initialPreference={initialPreferences.languagePreference}>
      <CurrencyProvider>
        <UIProvider insets={insets} mode={themePreference} onModeChange={handleModeChange}>
          <RootWithTheme />
        </UIProvider>
      </CurrencyProvider>
    </TranslationProvider>
  );
}

function RootWithTheme() {
  const { isDark } = useThemeMode();
  const colors = useColors();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={navigationTheme}>
        <DashboardProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </DashboardProvider>
      </ThemeProvider>
    </>
  );
}

function RootLayoutContent() {
  const [preferences, setPreferences] = useState<StoredPreferences | null>(null);
  const [startupError, setStartupError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      const result = await runStartup({
        cleanup: cleanupExportCache,
        initialize: initDatabase,
        loadPreferences: loadStoredPreferences,
      });

      if (cancelled) return;

      if (result.ok) {
        setPreferences(result.preferences);
        setStartupError(null);
      } else {
        setStartupError(result.error);
      }
      setRetrying(false);
    }

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (preferences || startupError) {
      SplashScreen.hide();
    }
  }, [preferences, startupError]);

  const handleRetry = useCallback(() => {
    if (retrying) return;
    setRetrying(true);
    setAttempt((value) => value + 1);
  }, [retrying]);

  if (startupError) {
    return (
      <SafeAreaProvider>
        <FatalErrorScreen
          kind="startup"
          error={startupError}
          onRetry={handleRetry}
          retrying={retrying}
        />
      </SafeAreaProvider>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <RootNavigator initialPreferences={preferences} />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <RootLayoutContent />
    </AppErrorBoundary>
  );
}
