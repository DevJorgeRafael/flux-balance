export type ReminderType = 'INCOME' | 'EXPENSE';

export type ReminderRecurrence = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Reminder {
  id: string;
  title: string;
  type: ReminderType;
  description?: string | null;
  amount?: number | null;
  accountId?: string | null;
  categoryId?: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
  nextRunAt?: string | null;
  isArchived: boolean;
  lastNotifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDTO {
  title: string;
  type: ReminderType;
  description?: string | null;
  amount?: number | null;
  accountId?: string | null;
  categoryId?: string | null;
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
}

export interface UpdateReminderDTO {
  title?: string;
  type?: ReminderType;
  description?: string | null;
  amount?: number | null;
  accountId?: string | null;
  categoryId?: string | null;
  recurrence?: ReminderRecurrence;
  time?: string;
  startDate?: string;
  isArchived?: boolean;
}
