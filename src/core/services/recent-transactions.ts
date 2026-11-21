import type { Transaction } from '@/core/models/transaction';
import { parseLedgerDate } from '@/core/utils/ledger-date';

export const RECENT_TRANSACTIONS_FALLBACK_LIMIT = 5;

export interface RecentTransactionsSelection {
  transactions: Transaction[];
  isFallback: boolean;
}

export interface SelectRecentTransactionsOptions {
  now?: Date;
  fallbackLimit?: number;
}

interface DatedTransaction {
  transaction: Transaction;
  date: Date;
  createdAt: number;
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) return RECENT_TRANSACTIONS_FALLBACK_LIMIT;

  return Math.max(0, Math.trunc(value));
}

export function selectRecentTransactions(
  transactions: Transaction[],
  {
    now = new Date(),
    fallbackLimit = RECENT_TRANSACTIONS_FALLBACK_LIMIT,
  }: SelectRecentTransactionsOptions = {}
): RecentTransactionsSelection {
  const datedTransactions = transactions
    .map((transaction) => {
      const date = parseLedgerDate(transaction.date);
      if (!date) return null;

      return {
        transaction,
        date,
        createdAt: parseLedgerDate(transaction.createdAt)?.getTime() ?? 0,
      };
    })
    .filter((entry): entry is DatedTransaction => entry !== null)
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime() || b.createdAt - a.createdAt
    );

  const currentMonth = datedTransactions.filter(
    ({ date }) =>
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
  );

  if (currentMonth.length > 0) {
    return {
      transactions: currentMonth.map(({ transaction }) => transaction),
      isFallback: false,
    };
  }

  const fallback = datedTransactions.slice(0, normalizeLimit(fallbackLimit));

  return {
    transactions: fallback.map(({ transaction }) => transaction),
    isFallback: fallback.length > 0,
  };
}
