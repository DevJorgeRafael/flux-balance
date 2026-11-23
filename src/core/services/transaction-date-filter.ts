import { parseLedgerDate } from '@/core/utils/ledger-date';

export interface DateRangeFilter {
  start: Date;
  end?: Date;
}

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function endOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1).getTime() - 1;
}

export function isDateInRange(value: string, range: DateRangeFilter | null): boolean {
  if (!range) return true;

  const date = parseLedgerDate(value);
  if (!date) return false;

  const end = range.end && range.end.getTime() >= range.start.getTime() ? range.end : range.start;
  const time = date.getTime();
  return time >= startOfDay(range.start) && time <= endOfDay(end);
}

export function filterTransactionsByDateRange<T extends { date: string }>(
  transactions: readonly T[],
  range: DateRangeFilter | null
): T[] {
  if (!range) return transactions.slice();
  return transactions.filter((transaction) => isDateInRange(transaction.date, range));
}

export function formatDateRangeLabel(
  range: DateRangeFilter | null,
  locale: string
): string | null {
  if (!range) return null;

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const start = formatter.format(range.start);
  const end = range.end && range.end.getTime() >= range.start.getTime() ? range.end : null;

  return end ? `${start} – ${formatter.format(end)}` : start;
}
