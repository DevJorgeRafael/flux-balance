import type { Account } from '@/core/models/account';
import type { Transaction } from '@/core/models/transaction';
import { parseLedgerDate } from '@/core/utils/ledger-date';
import { getMonthDayCount } from './stats-daily';

export interface BalanceStatPoint {
  day: number;
  balance: number;
}

export interface BalanceStats {
  points: BalanceStatPoint[];
  startBalance: number;
  endBalance: number;
  change: number;
  minBalance: number;
  maxBalance: number;
}

export interface BuildBalanceStatsOptions {
  accounts: Account[];
  transactions: Transaction[];
  year: number;
  monthIndex: number;
  endDay?: number;
  accountId?: string | null;
}

interface DatedAmount {
  date: Date;
  amount: number;
}

function clampEndDay(endDay: number | undefined, daysInMonth: number): number {
  const requestedEndDay = endDay ?? daysInMonth;

  if (!Number.isFinite(requestedEndDay)) return daysInMonth;

  return Math.max(0, Math.min(Math.trunc(requestedEndDay), daysInMonth));
}

function anchorDate(date: Date, createdAt: Date | null): Date {
  if (!createdAt || date.getTime() >= createdAt.getTime()) return date;
  return createdAt;
}

function emptyStats(): BalanceStats {
  return {
    points: [],
    startBalance: 0,
    endBalance: 0,
    change: 0,
    minBalance: 0,
    maxBalance: 0,
  };
}

export function buildBalanceStats({
  accounts,
  transactions,
  year,
  monthIndex,
  endDay,
  accountId,
}: BuildBalanceStatsOptions): BalanceStats {
  const daysInMonth = getMonthDayCount(year, monthIndex);
  const lastDay = clampEndDay(endDay, daysInMonth);
  const selectedAccounts = accountId
    ? accounts.filter((account) => account.id === accountId)
    : accounts;

  if (selectedAccounts.length === 0) return emptyStats();

  const monthStart = new Date(year, monthIndex, 1).getTime();
  const events: DatedAmount[] = [];
  let currentBalance = 0;

  for (const account of selectedAccounts) {
    const balance = Number.isFinite(account.balance) ? account.balance : 0;
    const createdAt = parseLedgerDate(account.createdAt);
    let recordedBalance = 0;

    currentBalance += balance;

    for (const transaction of transactions) {
      if (transaction.type === 'TRANSFER') continue;

      const transactionDate = parseLedgerDate(transaction.date);
      if (!transactionDate) continue;

      const eventDate = anchorDate(transactionDate, createdAt);

      for (const split of transaction.splits) {
        if (split.accountId !== account.id) continue;

        const amount = Math.abs(split.amount);
        if (!Number.isFinite(amount) || amount <= 0) continue;

        const delta = transaction.type === 'INCOME' ? amount : -amount;
        recordedBalance += delta;
        events.push({ date: eventDate, amount: delta });
      }
    }

    for (const deposit of account.fixedTermDeposits ?? []) {
      const principal = Math.abs(deposit.principalAmount);
      if (!Number.isFinite(principal) || principal <= 0) continue;

      const depositDate =
        parseLedgerDate(deposit.createdAt) ?? parseLedgerDate(deposit.startDate);
      if (!depositDate) continue;

      recordedBalance += principal;
      events.push({ date: anchorDate(depositDate, createdAt), amount: principal });
    }

    const initialCapital = balance - recordedBalance;

    if (Number.isFinite(initialCapital) && initialCapital !== 0 && createdAt) {
      events.push({ date: createdAt, amount: initialCapital });
    }
  }

  const effectsFromMonthStart = events.reduce(
    (total, event) =>
      event.date.getTime() >= monthStart ? total + event.amount : total,
    0
  );
  const dailyDeltas = Array.from({ length: lastDay }, () => 0);

  for (const event of events) {
    if (event.date.getFullYear() !== year || event.date.getMonth() !== monthIndex) {
      continue;
    }

    const day = event.date.getDate();
    if (day < 1 || day > lastDay) continue;

    dailyDeltas[day - 1] += event.amount;
  }

  let runningBalance = currentBalance - effectsFromMonthStart;
  const startBalance = runningBalance;
  const points = dailyDeltas.map((delta, index) => {
    runningBalance += delta;
    return { day: index + 1, balance: runningBalance };
  });
  const endBalance =
    points.length > 0 ? points[points.length - 1].balance : startBalance;
  const values = [startBalance, ...points.map((point) => point.balance)];

  return {
    points,
    startBalance,
    endBalance,
    change: endBalance - startBalance,
    minBalance: Math.min(...values),
    maxBalance: Math.max(...values),
  };
}
