import type { Reminder } from '../models/reminder';

function nextRunTime(reminder: Reminder): number {
  if (!reminder.nextRunAt) return Number.POSITIVE_INFINITY;
  const time = Date.parse(reminder.nextRunAt);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function selectUpcomingReminders(
  reminders: readonly Reminder[],
  limit = 2
): Reminder[] {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 0;

  return reminders
    .filter((reminder) => !reminder.isArchived)
    .slice()
    .sort((a, b) => {
      const aTime = nextRunTime(a);
      const bTime = nextRunTime(b);
      if (aTime !== bTime) return aTime - bTime;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, safeLimit);
}
