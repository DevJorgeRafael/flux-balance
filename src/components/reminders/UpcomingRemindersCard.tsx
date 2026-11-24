import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Plus from 'lucide-react-native/icons/plus';
import { Card } from '@/components/ui/Card';
import { radius, spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { selectUpcomingReminders } from '@/core/services/reminder-upcoming';
import { useHomeCards } from '@/store/homeCardsStore';
import { useReminderOverview } from '@/hooks/useReminderOverview';
import { REMINDER_RECURRENCE_LABELS } from './reminderLabels';

const MAX_VISIBLE = 2;

function formatNextRun(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function UpcomingRemindersCard() {
  const colors = useColors();
  const { t } = useTranslation();
  const { format, locale } = useCurrency();
  const { reminders, isLoading } = useReminderOverview();
  const { isVisible } = useHomeCards();

  if (!isVisible('upcomingReminders') || isLoading) return null;

  const upcoming = selectUpcomingReminders(reminders, MAX_VISIBLE);
  if (upcoming.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text }]} numberOfLines={1}>
          {t('upcomingReminders')} · {upcoming.length}
        </Text>
        <Pressable
          onPress={() => router.push('/reminders/form')}
          accessibilityRole="button"
          accessibilityLabel={t('newReminder')}
          hitSlop={6}
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: colors.primarySoft },
            pressed && styles.pressed,
          ]}
        >
          <Plus size={16} color={colors.primaryText} strokeWidth={2.6} />
          <Text style={[styles.newButtonText, { color: colors.primaryText }]}>
            {t('newReminderShort')}
          </Text>
        </Pressable>
      </View>

      <Card
        variant="raised"
        shadowSize="sm"
        style={styles.card}
        onPress={() => router.push('/reminders')}
        accessibilityLabel={t('upcomingReminders')}
      >
        {upcoming.map((reminder, index) => {
          const nextRun = formatNextRun(reminder.nextRunAt, locale);
          const recurrence = t(REMINDER_RECURRENCE_LABELS[reminder.recurrence]);
          const amount = reminder.amount != null ? format(reminder.amount) : null;
          const meta = [recurrence, amount, nextRun ? `${t('reminderNextRun')}: ${nextRun}` : null]
            .filter(Boolean)
            .join(' · ');

          return (
            <View
              key={reminder.id}
              style={[
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <Bell size={18} color={colors.primaryText} strokeWidth={2.2} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {reminder.title}
                </Text>
                <Text style={[styles.meta, { color: colors.textLight }]} numberOfLines={1}>
                  {meta}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: { flexShrink: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  newButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  newButtonText: { fontSize: 12, fontWeight: '800' },
  card: { paddingHorizontal: spacing.md },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
