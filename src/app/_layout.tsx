import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { isRunningInExpoGo } from 'expo';
import { LogBox } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { cleanupExportCache } from '@/infrastructure/backup/exportCache';
import { DashboardProvider } from '@/context/DashboardContext';
import { ReminderNotificationsProvider } from '@/context/ReminderNotificationsProvider';
import {
  TranslationProvider,
  useTranslation,
} from '@/core/i18n/useTranslation';
import { CurrencyProvider, loadStoredCurrency } from '@/core/currency/useCurrency';
import { runStartup } from '@/core/services/startup';
import {
  loadStoredPreferences,
  saveThemePreference,
  type StoredPreferences,
} from '@/core/preferences/preferencesStorage';
import type { ThemePreference } from '@/core/preferences/preferences';

const STARTUP_TIMEOUT_MS = 8000;
const SPLASH_FADE_DURATION_MS = 300;

if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: SPLASH_FADE_DURATION_MS, fade: true });
}
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  '[Reanimated] Dependencies should only be used on the web',
]);

type StartupPreferences = StoredPreferences & { currency: string };

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

function RootNavigator({ initialPreferences }: { initialPreferences: StartupPreferences }) {
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
      <CurrencyProvider initialCurrency={initialPreferences.currency}>
        <LocalizedUIProvider
          insets={insets}
          mode={themePreference}
          onModeChange={handleModeChange}
        >
          <RootWithTheme />
        </LocalizedUIProvider>
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
      <AlertHost />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={navigationTheme}>
        <DashboardProvider>
          <ReminderNotificationsProvider>
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
          </ReminderNotificationsProvider>
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
        cleanup: cleanupExportCache,
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

  const splashHidden = useRef(false);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (preferences || startupError) {
      hideSplash();
    }
  }, [preferences, startupError, hideSplash]);

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
