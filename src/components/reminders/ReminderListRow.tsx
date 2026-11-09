import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  Trash,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { radius, spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Reminder } from '@/core/models/reminder';
import { REMINDER_RECURRENCE_LABELS } from './reminderLabels';

interface ReminderListRowProps {
  reminder: Reminder;
  onPress: () => void;
  onDelete?: () => void;
}

function formatNextRun(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  try {
    const datePart = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
    }).format(date);
    const timePart = new Intl.DateTimeFormat(locale, {
      timeStyle: 'short',
    }).format(date);
    return `${datePart}\u00A0·\u00A0${timePart}`;
  } catch {
    return null;
  }
}

export function ReminderListRow({
  reminder,
  onPress,
  onDelete,
}: ReminderListRowProps) {
  const colors = useColors();
  const { format, locale } = useCurrency();
  const { t } = useTranslation();
  const isIncome = reminder.type === 'INCOME';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const nextRun = reminder.isArchived
    ? null
    : formatNextRun(reminder.nextRunAt, locale);
  const primaryMeta = [
    t(REMINDER_RECURRENCE_LABELS[reminder.recurrence]),
    reminder.amount != null ? format(reminder.amount) : null,
    reminder.isArchived ? t('archived') : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const nextRunMeta = nextRun
    ? `${t('reminderNextRun')}: ${nextRun}`
    : null;

  return (
    <Card onPress={onPress} style={styles.row}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isIncome ? colors.successSoft : colors.errorSoft },
        ]}
      >
        <Icon
          size={18}
          color={isIncome ? colors.successText : colors.errorText}
          strokeWidth={2.4}
        />
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {reminder.title}
        </Text>
        {primaryMeta ? (
          <Text
            style={[styles.meta, { color: colors.textLight }]}
            numberOfLines={2}
          >
            {primaryMeta}
          </Text>
        ) : null}
        {nextRunMeta ? (
          <Text
            style={[styles.meta, { color: colors.textLight }]}
            numberOfLines={2}
          >
            {nextRunMeta}
          </Text>
        ) : null}
      </View>

      {reminder.isArchived && onDelete ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('deleteReminder')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: colors.errorSoft },
            pressed && styles.pressed,
          ]}
        >
          <Trash size={18} color={colors.errorText} strokeWidth={2.2} />
        </Pressable>
      ) : (
        <ChevronRight size={17} color={colors.textLight} strokeWidth={2.4} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
