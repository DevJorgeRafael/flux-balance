import React, { useCallback, useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { LogBox } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';

import { StatusBar } from 'expo-status-bar';
import {
  UIProvider,
  useColors,
  useThemeMode,
  type ThemeMode,
} from '@/components/ui/theme';
import { initDatabase } from '@/infrastructure/database/db';
import { DashboardProvider } from '@/context/DashboardContext';
import { TranslationProvider } from '@/core/i18n/useTranslation';
import { CurrencyProvider } from '@/core/currency/useCurrency';
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

export default function RootLayout() {
  const [preferences, setPreferences] = useState<StoredPreferences | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Failed to initialize database', error);
      }

      const storedPreferences = await loadStoredPreferences();
      if (!cancelled) {
        setPreferences(storedPreferences);
      }
    }

    void prepare();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (preferences) {
      SplashScreen.hide();
    }
  }, [preferences]);

  if (!preferences) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <RootNavigator initialPreferences={preferences} />
    </SafeAreaProvider>
  );
}
