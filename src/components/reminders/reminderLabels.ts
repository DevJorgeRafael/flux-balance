import type { ReminderRecurrence } from '@/core/models/reminder';
import type { TranslationKey } from '@/core/i18n/translations';

export const REMINDER_RECURRENCE_LABELS: Record<
  ReminderRecurrence,
  TranslationKey
> = {
  ONCE: 'recurrenceOnce',
  DAILY: 'recurrenceDaily',
  WEEKLY: 'recurrenceWeekly',
  MONTHLY: 'recurrenceMonthly',
};
