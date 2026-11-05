import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Reminder } from '@/core/models/reminder';
import { REMINDER_RECURRENCE_LABELS } from './reminderLabels';

interface ReminderListRowProps {
  reminder: Reminder;
  onPress: () => void;
}

function formatNextRun(value: string | null | undefined, locale: string) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function ReminderListRow({ reminder, onPress }: ReminderListRowProps) {
  const colors = useColors();
  const { format, locale } = useCurrency();
  const { t } = useTranslation();
  const isIncome = reminder.type === 'INCOME';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const nextRun = reminder.isArchived
    ? null
    : formatNextRun(reminder.nextRunAt, locale);
  const meta = [
    t(REMINDER_RECURRENCE_LABELS[reminder.recurrence]),
    reminder.amount != null ? format(reminder.amount) : null,
    reminder.isArchived
      ? t('archived')
      : nextRun
        ? `${t('reminderNextRun')}: ${nextRun}`
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

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
        <Text style={[styles.meta, { color: colors.textLight }]} numberOfLines={2}>
          {meta}
        </Text>
      </View>

      <ChevronRight size={17} color={colors.textLight} strokeWidth={2.4} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
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
});
