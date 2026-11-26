import type { Budget } from '../models/budget';

export type AnticipationKind =
  | 'BUDGET_WARNING'
  | 'BUDGET_EXCEEDED'
  | 'DEPOSIT_MATURING'
  | 'LOW_BALANCE'
  | 'SPENDING_SPIKE';

export type AnticipationSeverity = 'info' | 'warning' | 'critical';

export interface AnticipationEvent {
  id: string;
  kind: AnticipationKind;
  severity: AnticipationSeverity;
  categoryId?: string;
  accountId?: string;
  ratio?: number;
  days?: number;
  amount?: number;
  limit?: number;
}

export interface BudgetSpending {
  [categoryId: string]: number;
}

export interface AnticipationDeposit {
  id: string;
  accountId: string;
  maturityDate: string;
  principalAmount: number;
}

export interface AnticipationAccount {
  id: string;
  balance: number;
}

export interface AnticipationInput {
  budgets: readonly Budget[];
  spending: BudgetSpending;
  deposits: readonly AnticipationDeposit[];
  accounts: readonly AnticipationAccount[];
  today: Date;
  averageDailySpend?: number;
  todaySpend?: number;
  lowBalanceThreshold?: number;
  maturingDays?: number;
  warningRatio?: number;
}

const DAY_MS = 86_400_000;

export interface SpendingTransaction {
  type: string;
  date: string;
  totalAmount: number;
  splits?: readonly { categoryId: string; amount: number }[];
}

export function sumSpendingByCategory(
  transactions: readonly SpendingTransaction[],
  yearMonth: string
): BudgetSpending {
  const spending: BudgetSpending = {};
  for (const transaction of transactions) {
    if (transaction.type !== 'EXPENSE') continue;
    if (!transaction.date.startsWith(yearMonth)) continue;
    const splits = transaction.splits ?? [];
    if (splits.length === 0) continue;
    for (const split of splits) {
      const amount = Math.abs(split.amount);
      if (!Number.isFinite(amount)) continue;
      spending[split.categoryId] = (spending[split.categoryId] ?? 0) + amount;
    }
  }
  return spending;
}

export function isValidYearMonth(value: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return true;
}

export function currentYearMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getBudgetProgress(
  limit: number,
  spent: number,
  warningRatio = 0.8
): { ratio: number; severity: AnticipationSeverity } {
  if (!Number.isFinite(limit) || limit <= 0) {
    return { ratio: 0, severity: 'info' };
  }
  const ratio = Number.isFinite(spent) ? Math.max(0, spent) / limit : 0;
  if (ratio > 1) return { ratio, severity: 'critical' };
  if (ratio >= warningRatio) return { ratio, severity: 'warning' };
  return { ratio, severity: 'info' };
}

function daysUntil(date: string, today: Date): number | null {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return null;
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  return Math.ceil((timestamp - todayUtc) / DAY_MS);
}

export function buildAnticipationEvents(input: AnticipationInput): AnticipationEvent[] {
  const events: AnticipationEvent[] = [];
  const yearMonth = currentYearMonth(input.today);
  const warningRatio = input.warningRatio ?? 0.8;
  const maturingDays = input.maturingDays ?? 7;

  for (const budget of input.budgets) {
    if (budget.yearMonth !== yearMonth) continue;
    const spent = input.spending[budget.categoryId] ?? 0;
    const progress = getBudgetProgress(budget.limitAmount, spent, warningRatio);
    if (progress.severity === 'info') continue;

    events.push({
      id: `budget:${budget.id}:${yearMonth}`,
      kind: progress.severity === 'critical' ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING',
      severity: progress.severity,
      categoryId: budget.categoryId,
      ratio: progress.ratio,
      amount: spent,
      limit: budget.limitAmount,
    });
  }

  for (const deposit of input.deposits) {
    const days = daysUntil(deposit.maturityDate, input.today);
    if (days === null || days < 0 || days > maturingDays) continue;

    events.push({
      id: `deposit:${deposit.id}:${deposit.maturityDate}`,
      kind: 'DEPOSIT_MATURING',
      severity: days <= 1 ? 'warning' : 'info',
      accountId: deposit.accountId,
      days,
      amount: deposit.principalAmount,
    });
  }

  const threshold = input.lowBalanceThreshold;
  if (threshold !== undefined && Number.isFinite(threshold)) {
    for (const account of input.accounts) {
      if (account.balance >= threshold) continue;
      events.push({
        id: `balance:${account.id}:${yearMonth}`,
        kind: 'LOW_BALANCE',
        severity: 'warning',
        accountId: account.id,
        amount: account.balance,
        limit: threshold,
      });
    }
  }

  const average = input.averageDailySpend;
  const todaySpend = input.todaySpend;
  if (
    average !== undefined &&
    todaySpend !== undefined &&
    Number.isFinite(average) &&
    average > 0 &&
    Number.isFinite(todaySpend) &&
    todaySpend >= average * 2
  ) {
    events.push({
      id: `spike:${yearMonth}:${input.today.getUTCDate()}`,
      kind: 'SPENDING_SPIKE',
      severity: 'warning',
      amount: todaySpend,
      limit: average,
    });
  }

  return events;
}
