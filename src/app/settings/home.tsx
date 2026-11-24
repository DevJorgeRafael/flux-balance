import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Bell from 'lucide-react-native/icons/bell';
import Target from 'lucide-react-native/icons/target';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import type { LucideIcon } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { spacing, useColors, useInsets, useThemeMode } from '@/components/ui/theme';
import { useHomeCards } from '@/store/homeCardsStore';
import type { TranslationKey } from '@/core/i18n/translations';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { HomeCardKey } from '@/core/preferences/preferences';

interface HomeCardOption {
  key: HomeCardKey;
  icon: LucideIcon;
  title: TranslationKey;
  description: TranslationKey;
}

const HOME_CARD_OPTIONS: readonly HomeCardOption[] = [
  {
    key: 'anticipations',
    icon: TriangleAlert,
    title: 'homeCardAnticipations',
    description: 'homeCardAnticipationsDescription',
  },
  {
    key: 'goals',
    icon: Target,
    title: 'homeCardGoals',
    description: 'homeCardGoalsDescription',
  },
  {
    key: 'upcomingReminders',
    icon: Bell,
    title: 'homeCardReminders',
    description: 'homeCardRemindersDescription',
  },
];

export default function HomeCustomizationScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { isDark } = useThemeMode();
  const { t } = useTranslation();
  const { visibility, setVisible } = useHomeCards();
  const offTrackColor = isDark ? colors.surfaceMuted : colors.controlTrack;
  const offThumbColor = isDark ? colors.text : colors.surface;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.roundButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('customizeHome')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textLight }]}>
          {t('customizeHomeIntro')}
        </Text>

        <Card style={styles.card}>
          {HOME_CARD_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const visible = visibility[option.key];
            const isLast = index === HOME_CARD_OPTIONS.length - 1;

            return (
              <Pressable
                key={option.key}
                onPress={() => setVisible(option.key, !visible)}
                accessibilityRole="switch"
                accessibilityState={{ checked: visible }}
                accessibilityLabel={`${t(option.title)}: ${t('visibleOnHome')}`}
                style={({ pressed }) => [
                  styles.row,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Icon size={18} color={colors.primaryText} strokeWidth={2.2} />
                </View>

                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    {t(option.title)}
                  </Text>
                  <Text style={[styles.rowDescription, { color: colors.textLight }]}>
                    {t(option.description)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.switchTrack,
                    {
                      backgroundColor: visible ? colors.primaryText : offTrackColor,
                      borderColor: visible ? colors.primaryText : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      {
                        backgroundColor: visible ? colors.onPrimary : offThumbColor,
                        borderColor: visible ? colors.primaryText : colors.border,
                        transform: [{ translateX: visible ? 16 : 0 }],
                      },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </Card>

        <Text style={[styles.note, { color: colors.textLight }]}>
          {t('homeCardsNote')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  pressed: { opacity: 0.7 },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: 13 },
  card: { paddingHorizontal: spacing.md },
  row: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  rowDescription: { fontSize: 12 },
  switchTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  note: { fontSize: 12, textAlign: 'center' },
});
