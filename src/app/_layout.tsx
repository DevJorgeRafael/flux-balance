import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { isRunningInExpoGo } from 'expo';
import { LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';

import { StatusBar } from 'expo-status-bar';
import { AlertHost } from '@/components/ui/alert/AlertHost';
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary';
import { FatalErrorScreen } from '@/components/errors/FatalErrorScreen';
import {
  UIProvider,
  useColors,
  useThemeMode,
  type EdgeInsets,
  type Labels,
  type ThemeMode,
} from '@/components/ui/theme';
import { initDatabase } from '@/infrastructure/database/db';
import { DashboardProvider } from '@/context/DashboardContext';
import { SplashTransition } from '@/components/splash/SplashTransition';
import { CategoryCreationNavigator } from '@/components/navigation/CategoryCreationNavigator';
import { useHomeCardsStore } from '@/store/homeCardsStore';
import { SPLASH_NATIVE_FADE_MS } from '@/components/splash/splashTiming';
import { useTranslation } from '@/core/i18n/useTranslation';
import { loadStoredCurrency } from '@/core/currency/useCurrency';
import { DEFAULT_CURRENCY_CODE } from '@/core/constants/currencies';
import { runStartup } from '@/core/services/startup';
import {
  DEFAULT_PREFERENCES,
  loadStoredPreferences,
  saveHomeCardPreference,
  saveThemePreference,
  type StoredPreferences,
} from '@/core/preferences/preferencesStorage';
import { HOME_CARD_KEYS } from '@/core/preferences/preferences';
import { useThemePreferenceStore } from '@/store/themePreferenceStore';
import { useLanguagePreferenceStore } from '@/store/languagePreferenceStore';
import { useCurrencyStore } from '@/store/currencyStore';

const STARTUP_TIMEOUT_MS = 8000;

const ReminderNotificationsProvider = lazy(() =>
  import('@/context/ReminderNotificationsProvider').then((module) => ({
    default: module.ReminderNotificationsProvider,
  }))
);

function cleanupExportCacheInBackground() {
  void import('@/infrastructure/backup/exportCache')
    .then((module) => module.cleanupExportCache())
    .catch(() => {});
}

if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: SPLASH_NATIVE_FADE_MS, fade: true });
}
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  '[Reanimated] Dependencies should only be used on the web',
]);

type StartupPreferences = StoredPreferences & { currency: string };

const DEFAULT_STARTUP_PREFERENCES: StartupPreferences = {
  ...DEFAULT_PREFERENCES,
  currency: DEFAULT_CURRENCY_CODE,
};

function LocalizedUIProvider({
  children,
  insets,
  mode,
  onModeChange,
}: {
  children: React.ReactNode;
  insets: EdgeInsets;
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}) {
  const { language, t } = useTranslation();

  const labels = useMemo<Partial<Labels>>(() => {
    const locale = language === 'es' ? 'es' : 'en';
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });

    return {
      close: t('close'),
      cancel: t('cancel'),
      confirm: t('done'),
      previousMonth: t('previousMonth'),
      nextMonth: t('nextMonth'),
      months: Array.from({ length: 12 }, (_, month) =>
        monthFormatter.format(new Date(2026, month, 1))
      ),
      weekdaysShort: Array.from({ length: 7 }, (_, day) =>
        weekdayFormatter.format(new Date(2026, 0, 4 + day))
      ),
      selectDate: t('selectDate'),
      timeHour: t('timeHour'),
      timeMinute: t('timeMinute'),
      am: t('am'),
      pm: t('pm'),
      timeUnselected: t('timeUnselected'),
    };
  }, [language, t]);

  return (
    <UIProvider
      insets={insets}
      mode={mode}
      onModeChange={onModeChange}
      labels={labels}
    >
      {children}
    </UIProvider>
  );
}

function RootNavigator({
  preferences,
  startupReady,
}: {
  preferences: StartupPreferences;
  startupReady: boolean;
}) {
  const insets = useSafeAreaInsets();
  const themePreference = useThemePreferenceStore((state) => state.preference);
  const setThemePreference = useThemePreferenceStore((state) => state.setPreference);
  const setLanguagePreference = useLanguagePreferenceStore(
    (state) => state.setPreference
  );
  const setCurrencyCode = useCurrencyStore((state) => state.setCode);

  useEffect(() => {
    setThemePreference(preferences.themePreference);
  }, [preferences.themePreference, setThemePreference]);

  useEffect(() => {
    setLanguagePreference(preferences.languagePreference);
  }, [preferences.languagePreference, setLanguagePreference]);

  useEffect(() => {
    setCurrencyCode(preferences.currency);
  }, [preferences.currency, setCurrencyCode]);

  useEffect(() => {
    useHomeCardsStore.getState().hydrate(preferences.homeCardVisibility);
  }, [preferences.homeCardVisibility]);

  useEffect(() => {
    let previous = useHomeCardsStore.getState().visibility;
    return useHomeCardsStore.subscribe((state) => {
      const next = state.visibility;
      for (const key of HOME_CARD_KEYS) {
        if (next[key] !== previous[key]) {
          void saveHomeCardPreference(key, next[key]).catch((error) => {
            console.error('Error saving home card preference:', error);
          });
        }
      }
      previous = next;
    });
  }, []);

  const handleModeChange = useCallback(
    (mode: ThemeMode) => {
      setThemePreference(mode);
      void saveThemePreference(mode).catch((error) => {
        console.error('Error saving theme preference:', error);
      });
    },
    [setThemePreference]
  );

  return (
    <LocalizedUIProvider
      insets={insets}
      mode={themePreference}
      onModeChange={handleModeChange}
    >
      <RootWithTheme startupReady={startupReady} />
    </LocalizedUIProvider>
  );
}

function RootWithTheme({ startupReady }: { startupReady: boolean }) {
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
      <AlertHost />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={navigationTheme}>
        <DashboardProvider>
          <SplashTransition startupReady={startupReady}>
            <Suspense fallback={null}>
              <ReminderNotificationsProvider>
                <SafeAreaView
                  edges={['left', 'right']}
                  style={{ flex: 1, backgroundColor: colors.background }}
                >
                  <CategoryCreationNavigator />
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
                </SafeAreaView>
              </ReminderNotificationsProvider>
            </Suspense>
          </SplashTransition>
        </DashboardProvider>
      </ThemeProvider>
    </>
  );
}

function RootLayoutContent() {
  const [preferences, setPreferences] = useState<StartupPreferences | null>(null);
  const [startupError, setStartupError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timedOut = false;

    const timeout = setTimeout(() => {
      if (cancelled) return;
      timedOut = true;
      setStartupError(new Error('Startup timed out'));
      setRetrying(false);
    }, STARTUP_TIMEOUT_MS);

    async function prepare() {
      const result = await runStartup({
        cleanup: cleanupExportCacheInBackground,
        initialize: initDatabase,
        loadPreferences: async () => {
          const [storedPreferences, currency] = await Promise.all([
            loadStoredPreferences(),
            loadStoredCurrency(),
          ]);
          return { ...storedPreferences, currency };
        },
      });

      if (cancelled || timedOut) return;

      clearTimeout(timeout);

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
      clearTimeout(timeout);
    };
  }, [attempt]);

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

  return (
    <SafeAreaProvider>
      <RootNavigator
        preferences={preferences ?? DEFAULT_STARTUP_PREFERENCES}
        startupReady={preferences !== null}
      />
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
