import type { Transaction } from '@/core/models/transaction';
import type { StatsTransactionType } from './stats-breakdown';

export interface DailyStatPoint {
  day: number;
  amount: number;
}

export interface DailyStats {
  points: DailyStatPoint[];
  total: number;
  activeDays: number;
  average: number;
  maxPoint: DailyStatPoint | null;
}

export interface BuildDailyStatsOptions {
  transactions: Transaction[];
  type: StatsTransactionType;
  year: number;
  monthIndex: number;
  endDay?: number;
}

export function getMonthDayCount(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function buildDailyStats({
  transactions,
  type,
  year,
  monthIndex,
  endDay,
}: BuildDailyStatsOptions): DailyStats {
  const daysInMonth = getMonthDayCount(year, monthIndex);
  const requestedEndDay = endDay ?? daysInMonth;
  const lastDay = Number.isFinite(requestedEndDay)
    ? Math.max(0, Math.min(Math.trunc(requestedEndDay), daysInMonth))
    : daysInMonth;
  const amounts = Array.from({ length: lastDay }, () => 0);

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;

    const amount = Math.abs(transaction.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) continue;
    if (date.getFullYear() !== year || date.getMonth() !== monthIndex) continue;

    const day = date.getDate();
    if (day < 1 || day > lastDay) continue;

    amounts[day - 1] += amount;
  }

  const points = amounts.map((amount, index) => ({ day: index + 1, amount }));
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const activeDays = points.reduce(
    (count, point) => count + (point.amount > 0 ? 1 : 0),
    0
  );
  const maxPoint = points.reduce<DailyStatPoint | null>((current, point) => {
    if (point.amount <= 0) return current;
    if (!current || point.amount > current.amount) return point;
    return current;
  }, null);

  return {
    points,
    total,
    activeDays,
    average: points.length > 0 ? total / points.length : 0,
    maxPoint,
  };
}
