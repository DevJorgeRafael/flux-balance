import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Plus from 'lucide-react-native/icons/plus';
import { ReminderListRow } from '@/components/reminders/ReminderListRow';
import { radius, spacing, useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { selectUpcomingReminders } from '@/core/services/reminder-upcoming';
import { useReminderOverview } from '@/hooks/useReminderOverview';

const MAX_VISIBLE = 2;

export function UpcomingRemindersCard() {
  const colors = useColors();
  const { t } = useTranslation();
  const { reminders, isLoading } = useReminderOverview();

  if (isLoading) return null;

  const upcoming = selectUpcomingReminders(reminders, MAX_VISIBLE);
  if (upcoming.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text
          style={[styles.heading, { color: colors.text }]}
          numberOfLines={1}
        >
          {t('upcomingReminders')}
        </Text>
        <Pressable
          onPress={() => router.push('/reminders/form')}
          accessibilityRole="button"
          accessibilityLabel={t('newReminder')}
          hitSlop={6}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: colors.cardRaised,
              borderColor: colors.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <Plus size={16} color={colors.primaryText} strokeWidth={2.6} />
          <Text
            style={[styles.addButtonText, { color: colors.primaryText }]}
            numberOfLines={1}
          >
            {t('newReminder')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.rows}>
        {upcoming.map((reminder) => (
          <ReminderListRow key={reminder.id} reminder={reminder} />
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/reminders')}
        accessibilityRole="button"
        accessibilityLabel={t('seeAllReminders')}
        hitSlop={8}
        style={({ pressed }) => [styles.seeAllButton, pressed && styles.pressed]}
      >
        <Text style={[styles.seeAllText, { color: colors.primaryText }]}>
          {t('seeAllReminders')}
        </Text>
        <ChevronRight size={15} color={colors.primaryText} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  addButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rows: {
    gap: spacing.md,
  },
  seeAllButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
