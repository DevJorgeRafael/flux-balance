import type { Transaction } from '@/core/models/transaction';
import { parseLedgerDate } from '@/core/utils/ledger-date';

export const RECENT_TRANSACTIONS_VISIBLE_LIMIT = 5;
export const RECENT_TRANSACTIONS_EXPANDED_LIMIT = 10;
export const RECENT_TRANSACTIONS_FALLBACK_LIMIT =
  RECENT_TRANSACTIONS_VISIBLE_LIMIT;

export interface RecentTransactionsSelection {
  transactions: Transaction[];
  isFallback: boolean;
}

export interface SelectRecentTransactionsOptions {
  now?: Date;
  fallbackLimit?: number;
}

export interface VisibleRecentTransactions {
  transactions: Transaction[];
  hiddenCount: number;
}

export interface SelectVisibleRecentTransactionsOptions {
  expanded?: boolean;
  limit?: number;
  expandedLimit?: number;
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

export function selectVisibleRecentTransactions(
  transactions: readonly Transaction[],
  {
    expanded = false,
    limit = RECENT_TRANSACTIONS_VISIBLE_LIMIT,
    expandedLimit = RECENT_TRANSACTIONS_EXPANDED_LIMIT,
  }: SelectVisibleRecentTransactionsOptions = {}
): VisibleRecentTransactions {
  const safeLimit =
    Number.isInteger(limit) && limit >= 0
      ? limit
      : RECENT_TRANSACTIONS_VISIBLE_LIMIT;
  const safeExpandedLimit =
    Number.isInteger(expandedLimit) && expandedLimit >= 0
      ? expandedLimit
      : RECENT_TRANSACTIONS_EXPANDED_LIMIT;
  const visible = transactions.slice(0, expanded ? safeExpandedLimit : safeLimit);

  return {
    transactions: visible,
    hiddenCount: Math.max(0, transactions.length - visible.length),
  };
}
