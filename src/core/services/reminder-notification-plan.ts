import type { Reminder } from '../models/reminder';
import type {
  ReminderNotificationContent,
  ReminderNotificationRequest,
} from '../notifications/IReminderNotificationGateway';
import { nextReminderOccurrence } from './reminder-schedule';

export const REMINDER_NOTIFICATION_PREFIX = 'reminder:';
export const REMINDER_NOTIFICATION_WINDOW = 10;
export const IOS_REMINDER_NOTIFICATION_LIMIT = 60;

export interface ReminderNotificationPlan {
  toCancel: string[];
  toSchedule: ReminderNotificationRequest[];
}

export interface BuildReminderNotificationPlanOptions {
  reminders: readonly Reminder[];
  scheduledIdentifiers: readonly string[];
  now: Date;
  contentFor: (reminder: Reminder) => ReminderNotificationContent;
  windowSize?: number;
  maxScheduled?: number;
  forceReminderIds?: readonly string[];
}

export function reminderNotificationId(
  reminderId: string,
  scheduledFor: string
): string {
  return `${REMINDER_NOTIFICATION_PREFIX}${reminderId}:${scheduledFor}`;
}

export function isReminderNotificationId(identifier: string): boolean {
  return identifier.startsWith(REMINDER_NOTIFICATION_PREFIX);
}

function reminderOccurrences(
  reminder: Reminder,
  now: Date,
  windowSize: number
): string[] {
  if (reminder.isArchived) return [];

  const limit = reminder.recurrence === 'ONCE' ? 1 : windowSize;
  const occurrences: string[] = [];
  let cursor = now;

  for (let index = 0; index < limit; index += 1) {
    const occurrence = nextReminderOccurrence(reminder, cursor);
    if (!occurrence) break;
    occurrences.push(occurrence.toISOString());
    cursor = occurrence;
  }

  return occurrences;
}

function compareRequests(
  first: ReminderNotificationRequest,
  second: ReminderNotificationRequest
): number {
  const byDate = first.scheduledFor.localeCompare(second.scheduledFor);
  return byDate !== 0
    ? byDate
    : first.identifier.localeCompare(second.identifier);
}

export function buildReminderNotificationPlan({
  reminders,
  scheduledIdentifiers,
  now,
  contentFor,
  windowSize = REMINDER_NOTIFICATION_WINDOW,
  maxScheduled = Number.POSITIVE_INFINITY,
  forceReminderIds = [],
}: BuildReminderNotificationPlanOptions): ReminderNotificationPlan {
  const safeWindow = Number.isFinite(windowSize)
    ? Math.max(1, Math.floor(windowSize))
    : REMINDER_NOTIFICATION_WINDOW;
  const safeLimit = Number.isFinite(maxScheduled)
    ? Math.max(0, Math.floor(maxScheduled))
    : Number.POSITIVE_INFINITY;
  const forced = new Set(forceReminderIds);
  const forcedPrefixes = [...forced].map(
    (reminderId) => `${REMINDER_NOTIFICATION_PREFIX}${reminderId}:`
  );
  const requests = new Map<string, ReminderNotificationRequest>();

  for (const reminder of reminders) {
    for (const scheduledFor of reminderOccurrences(
      reminder,
      now,
      safeWindow
    )) {
      const identifier = reminderNotificationId(reminder.id, scheduledFor);
      requests.set(identifier, {
        identifier,
        reminderId: reminder.id,
        scheduledFor,
        ...contentFor(reminder),
      });
    }
  }

  const desired = [...requests.values()]
    .sort(compareRequests)
    .slice(0, safeLimit);
  const desiredIds = new Set(desired.map((request) => request.identifier));
  const existing = scheduledIdentifiers.filter(isReminderNotificationId);
  const existingIds = new Set(existing);

  return {
    toCancel: existing.filter(
      (identifier) =>
        !desiredIds.has(identifier) ||
        forcedPrefixes.some((prefix) => identifier.startsWith(prefix))
    ),
    toSchedule: desired.filter(
      (request) =>
        !existingIds.has(request.identifier) ||
        forced.has(request.reminderId)
    ),
  };
}
