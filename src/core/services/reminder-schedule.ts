import type { ReminderRecurrence } from '../models/reminder';

export interface ReminderSchedule {
  recurrence: ReminderRecurrence;
  time: string;
  startDate: string;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hours: number;
  minutes: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_MONTH_ITERATIONS = 1200;

function parseDateParts(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function parseTimeParts(value: string): TimeParts | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

function buildLocalDate(
  year: number,
  monthIndex: number,
  day: number,
  hours: number,
  minutes: number
): Date {
  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    0,
    0
  );
}

function nextMonthlyOccurrence(
  start: DateParts,
  time: TimeParts,
  after: Date
): Date | null {
  const anchorIndex = start.year * 12 + (start.month - 1);
  const afterIndex = after.getFullYear() * 12 + after.getMonth();
  let offset = Math.max(0, afterIndex - anchorIndex);

  for (let iteration = 0; iteration < MAX_MONTH_ITERATIONS; iteration += 1) {
    const targetIndex = anchorIndex + offset;
    const year = Math.floor(targetIndex / 12);
    const monthIndex = targetIndex % 12;
    const day = Math.min(start.day, daysInMonth(year, monthIndex));
    const candidate = buildLocalDate(
      year,
      monthIndex,
      day,
      time.hours,
      time.minutes
    );

    if (candidate.getTime() > after.getTime()) {
      return candidate;
    }

    offset += 1;
  }

  return null;
}

export function isValidReminderDate(value: string): boolean {
  return parseDateParts(value) !== null;
}

export function isValidReminderTime(value: string): boolean {
  return parseTimeParts(value) !== null;
}

export function firstReminderOccurrence(
  schedule: ReminderSchedule
): Date | null {
  const date = parseDateParts(schedule.startDate);
  const time = parseTimeParts(schedule.time);
  if (!date || !time) return null;

  return buildLocalDate(
    date.year,
    date.month - 1,
    date.day,
    time.hours,
    time.minutes
  );
}

export function nextReminderOccurrence(
  schedule: ReminderSchedule,
  after: Date
): Date | null {
  const first = firstReminderOccurrence(schedule);
  if (!first) return null;

  switch (schedule.recurrence) {
    case 'ONCE':
      return first.getTime() > after.getTime() ? first : null;

    case 'DAILY':
    case 'WEEKLY': {
      if (first.getTime() > after.getTime()) return first;

      const step = schedule.recurrence === 'DAILY' ? 1 : 7;
      let candidate = first;
      while (candidate.getTime() <= after.getTime()) {
        candidate = addLocalDays(candidate, step);
      }
      return candidate;
    }

    case 'MONTHLY': {
      const date = parseDateParts(schedule.startDate);
      const time = parseTimeParts(schedule.time);
      if (!date || !time) return null;
      return nextMonthlyOccurrence(date, time, after);
    }

    default:
      return null;
  }
}

export function nextReminderRunAt(
  schedule: ReminderSchedule,
  after: Date
): string | null {
  return nextReminderOccurrence(schedule, after)?.toISOString() ?? null;
}
