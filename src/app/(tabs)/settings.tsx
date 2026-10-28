import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ChevronRight,
  Coins,
  Languages,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { useColors, useInsets, useThemeMode } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { BottomFade } from '@/components/ui/BottomFade';
import { AboutSection } from '@/components/settings/AboutSection';
import { IS_DEVELOPMENT_MODE } from '@/core/constants/environment';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import { useDashboard } from '@/context/DashboardContext';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  destructive?: boolean;
  isLast?: boolean;
  showChevron?: boolean;
  onPress: () => void;
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  destructive = false,
  isLast = false,
  showChevron = false,
  onPress,
}: SettingsRowProps) {
  const colors = useColors();
  const labelColor = destructive ? colors.errorText : colors.text;
  const iconColor = destructive ? colors.errorText : colors.primaryText;
  const iconBackground = destructive ? colors.errorSoft : colors.primarySoft;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>

      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>

      {value ? (
        <View style={[styles.valuePill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.valueText, { color: colors.primaryText }]}>{value}</Text>
        </View>
      ) : null}

      {showChevron ? (
        <ChevronRight size={17} color={colors.textLight} strokeWidth={2.4} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { isDark, mode } = useThemeMode();
  const { language, languagePreference, t } = useTranslation();
  const { currency } = useCurrency();
  const { handleSeedDemoData, handleResetAllData, handleRefresh } = useDashboard();

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

        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
          {t('categories')}
        </Text>
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

        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
          {t('system')}
        </Text>
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

        {IS_DEVELOPMENT_MODE && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
              {t('developerMode')}
            </Text>
            <Card style={styles.card}>
              <SettingsRow
                icon={Sparkles}
                label={t('demoMode')}
                onPress={() => void handleSeedDemoData()}
              />
              <SettingsRow
                icon={RotateCcw}
                label={t('resetData')}
                destructive
                isLast
                onPress={() => void handleResetAllData()}
              />
            </Card>
          </>
        )}

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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  valuePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
