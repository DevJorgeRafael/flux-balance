import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { StatusBar } from 'expo-status-bar';
import {
  ThemeTransitionProvider,
  UIProvider,
  useColors,
  useThemeMode,
} from '@/components/ui/theme';
import { initDatabase } from '@/infrastructure/database/db';
import { TranslationProvider } from '@/core/i18n/useTranslation';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  '[Reanimated] Dependencies should only be used on the web',
]);

function RootNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <TranslationProvider>
      <UIProvider insets={insets}>
        <RootWithTheme />
      </UIProvider>
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
        <ThemeTransitionProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </ThemeTransitionProvider>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
      } catch (e) {
        console.error('Failed to initialize database', e);
      } finally {
        setIsDbReady(true);
      }
    }
    prepare();
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
