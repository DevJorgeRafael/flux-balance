import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { useReduceMotion } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function TabsLayout() {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        animation: reduceMotion ? 'none' : 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="accounts" options={{ title: t('accountsTab') }} />
      <Tabs.Screen name="stats" options={{ title: t('stats') }} />
      <Tabs.Screen name="settings" options={{ title: t('settings') }} />
    </Tabs>
  );
}
