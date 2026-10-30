import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Coins, Languages, Moon, Sun, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useColors, useInsets, useThemeMode } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { BottomFade } from '@/components/ui/BottomFade';
import { AboutSection } from '@/components/settings/AboutSection';
import { DataSection } from '@/components/settings/DataSection';
import { DeveloperSection } from '@/components/settings/DeveloperSection';
import { SectionLabel } from '@/components/settings/SectionLabel';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import { useDashboard } from '@/context/DashboardContext';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { isDark, mode } = useThemeMode();
  const { language, languagePreference, t } = useTranslation();
  const { currency } = useCurrency();
  const { handleRefresh } = useDashboard();

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_CONTENT_OFFSET + TAB_BAR_CONTENT_GAP },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>

        <SectionLabel>{t('categories')}</SectionLabel>
        <Card style={styles.card}>
          <SettingsRow
            icon={TrendingUp}
            label={t('incomeCategories')}
            showChevron
            onPress={() =>
              router.push({
                pathname: '/settings/categories/[type]',
                params: { type: 'INCOME' },
              })
            }
          />
          <SettingsRow
            icon={TrendingDown}
            label={t('expenseCategories')}
            showChevron
            isLast
            onPress={() =>
              router.push({
                pathname: '/settings/categories/[type]',
                params: { type: 'EXPENSE' },
              })
            }
          />
        </Card>

        <SectionLabel>{t('system')}</SectionLabel>
        <Card style={styles.card}>
          <SettingsRow
            icon={Coins}
            label={t('currency')}
            value={currency}
            showChevron
            onPress={() => router.push('/settings/currency')}
          />
          <SettingsRow
            icon={isDark ? Moon : Sun}
            label={t('theme')}
            value={mode === 'system' ? t('system') : t(mode)}
            showChevron
            onPress={() => router.push('/settings/theme')}
          />
          <SettingsRow
            icon={Languages}
            label={t('language')}
            value={languagePreference === 'system' ? t('system') : language.toUpperCase()}
            showChevron
            isLast
            onPress={() => router.push('/settings/language')}
          />
        </Card>

        <DeveloperSection />
        <DataSection />
        <AboutSection />
      </ScrollView>

      <BottomFade />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
});
