import type { Category } from '@/core/models/category';
import type { Transaction, TransactionType } from '@/core/models/transaction';
import { resolveCategoryForType } from './category-resolution';

export type StatsTransactionType = Extract<TransactionType, 'INCOME' | 'EXPENSE'>;

export const OTHER_SLICE_ID = '__other__';
export const UNCATEGORIZED_SLICE_ID = '__uncategorized__';

export interface CategorySlice {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  kind: 'category' | 'uncategorized' | 'other';
  color?: string | null;
}

export interface CategoryBreakdown {
  total: number;
  slices: CategorySlice[];
}

export interface MonthlyStats {
  income: CategoryBreakdown;
  expense: CategoryBreakdown;
}

export interface BuildMonthlyStatsOptions {
  transactions: Transaction[];
  categories: Category[];
  year: number;
  monthIndex: number;
  labels: {
    uncategorized: string;
    other: string;
  };
  maxCategorySlices?: number;
}

interface CategoryBucket {
  id: string;
  name: string;
  amount: number;
  kind: CategorySlice['kind'];
  color?: string | null;
}

const EMPTY_BREAKDOWN: CategoryBreakdown = { total: 0, slices: [] };

function isSameCalendarMonth(dateValue: string, year: number, monthIndex: number) {
  const date = new Date(dateValue);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === monthIndex
  );
}

function addAmount(
  buckets: Map<string, CategoryBucket>,
  key: string,
  name: string,
  amount: number,
  kind: CategorySlice['kind'],
  color?: string | null
) {
  if (amount <= 0) return;

  const existing = buckets.get(key);
  if (existing) {
    existing.amount += amount;
    return;
  }

  buckets.set(key, { id: key, name, amount, kind, color });
}

function sortBuckets(a: CategoryBucket, b: CategoryBucket) {
  return b.amount - a.amount || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

function calculatePercentages(amounts: number[], total: number): number[] {
  if (total <= 0 || amounts.length === 0) return [];

  const raw = amounts.map((amount) => (amount / total) * 100);
  const percentages = raw.map(Math.floor);
  const remainder = Math.max(0, 100 - percentages.reduce((sum, value) => sum + value, 0));

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let index = 0; index < remainder; index += 1) {
    const target = order[index % order.length];
    if (target) percentages[target.index] += 1;
  }

  return percentages;
}

function buildBreakdown(
  buckets: Map<string, CategoryBucket>,
  labels: BuildMonthlyStatsOptions['labels'],
  maxCategorySlices: number
): CategoryBreakdown {
  const sorted = [...buckets.values()].filter((bucket) => bucket.amount > 0).sort(sortBuckets);
  if (sorted.length === 0) return EMPTY_BREAKDOWN;

  let slices = sorted;
  if (sorted.length > maxCategorySlices) {
    const visible = sorted.slice(0, maxCategorySlices);
    const otherAmount = sorted
      .slice(maxCategorySlices)
      .reduce((sum, bucket) => sum + bucket.amount, 0);

    if (otherAmount > 0) {
      visible.push({
        id: OTHER_SLICE_ID,
        name: labels.other,
        amount: otherAmount,
        kind: 'other',
      });
    }

    slices = visible;
  }

  slices.sort(sortBuckets);

  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const percentages = calculatePercentages(
    slices.map((slice) => slice.amount),
    total
  );

  return {
    total,
    slices: slices.map((slice, index) => ({
      ...slice,
      percentage: percentages[index] ?? 0,
    })),
  };
}

export function buildMonthlyStats({
  transactions,
  categories,
  year,
  monthIndex,
  labels,
  maxCategorySlices = 6,
}: BuildMonthlyStatsOptions): MonthlyStats {
  const incomeBuckets = new Map<string, CategoryBucket>();
  const expenseBuckets = new Map<string, CategoryBucket>();

  for (const transaction of transactions) {
    if (
      transaction.type === 'TRANSFER' ||
      !isSameCalendarMonth(transaction.date, year, monthIndex)
    ) {
      continue;
    }

    const buckets = transaction.type === 'INCOME' ? incomeBuckets : expenseBuckets;
    const splits = transaction.splits ?? [];

    if (splits.length === 0) {
      addAmount(buckets, UNCATEGORIZED_SLICE_ID, labels.uncategorized, Math.abs(transaction.totalAmount), 'uncategorized');
      continue;
    }

    for (const split of splits) {
      const amount = Math.abs(split.amount);
      const category = resolveCategoryForType(
        split.categoryId,
        transaction.type,
        categories
      );

      if (!category || !category.name.trim()) {
        addAmount(buckets, UNCATEGORIZED_SLICE_ID, labels.uncategorized, amount, 'uncategorized');
        continue;
      }

      addAmount(buckets, category.id, category.name, amount, 'category', category.color);
    }
  }

  return {
    income: buildBreakdown(incomeBuckets, labels, maxCategorySlices),
    expense: buildBreakdown(expenseBuckets, labels, maxCategorySlices),
  };
}
