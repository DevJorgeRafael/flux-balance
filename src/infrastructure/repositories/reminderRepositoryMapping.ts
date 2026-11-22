import type {
  Reminder,
  ReminderRecurrence,
  ReminderType,
} from '@/core/models/reminder';

export interface ReminderRow {
  id: string;
  title: string;
  type: ReminderType;
  description: string | null;
  amount: number | null;
  account_id: string | null;
  category_id: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  start_date: string;
  next_run_at: string | null;
  is_archived: number;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderFields {
  title: string;
  type: ReminderType;
  description?: string | null;
  amount?: number | null;
  accountId?: string | null;
  categoryId?: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
  isArchived: boolean;
}

export interface NormalizedReminderFields {
  title: string;
  type: ReminderType;
  description: string | null;
  amount: number | null;
  accountId: string | null;
  categoryId: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
  isArchived: boolean;
}

export function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description,
    amount: row.amount,
    accountId: row.account_id,
    categoryId: row.category_id,
    recurrence: row.recurrence,
    time: row.time,
    startDate: row.start_date,
    nextRunAt: row.next_run_at,
    isArchived: row.is_archived === 1,
    lastNotifiedAt: row.last_notified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isIsoUtcTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function normalizeOptionalId(
  value: string | null | undefined
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
