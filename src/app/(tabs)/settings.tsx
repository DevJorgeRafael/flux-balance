import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Languages,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import { useColors, useInsets, useThemeMode } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  destructive?: boolean;
  isLast?: boolean;
  onPress: () => void;
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  destructive = false,
  isLast = false,
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
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { isDark, toggleTheme } = useThemeMode();
  const { language, toggleLanguage, t } = useTranslation();
  const { handleSeedDemoData, handleResetAllData } = useDashboard();
  const isDevMode = __DEV__;

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

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon={isDark ? Moon : Sun}
            label={t('theme')}
            value={isDark ? t('dark') : t('light')}
            onPress={toggleTheme}
          />
          <SettingsRow
            icon={Languages}
            label={t('language')}
            value={language.toUpperCase()}
            isLast
            onPress={toggleLanguage}
          />
        </View>

        {isDevMode && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
          </View>
        )}
      </ScrollView>
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
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
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
