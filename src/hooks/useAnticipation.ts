import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { AnticipationEvent } from '@/core/services/anticipation';
import {
  buildAnticipationEvents,
  currentYearMonth,
  sumSpendingByCategory,
} from '@/core/services/anticipation';
import type { Budget } from '@/core/models/budget';
import { useDashboard } from '@/context/DashboardContext';
import {
  SqliteAccountRepository,
  SqliteBudgetRepository,
} from '@/infrastructure/repositories';

const budgetRepo = new SqliteBudgetRepository();
const accountRepo = new SqliteAccountRepository();
const LOW_BALANCE_THRESHOLD = 50;
const MATURING_DAYS = 7;
const WARNING_RATIO = 0.8;

export interface AnticipationOverview {
  events: AnticipationEvent[];
  budgets: Budget[];
  yearMonth: string;
  isLoading: boolean;
  reload: () => void;
}

export function useAnticipation(): AnticipationOverview {
  const { accounts, transactions } = useDashboard();
  const [events, setEvents] = useState<AnticipationEvent[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const yearMonth = currentYearMonth(new Date());

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        void nonce;
        try {
          const [loadedBudgets, depositLists] = await Promise.all([
            budgetRepo.getAll(yearMonth),
            Promise.all(
              accounts.map((account) =>
                accountRepo.getFixedTermDeposits(account.id)
              )
            ),
          ]);
          if (cancelled) return;

          const deposits = depositLists.flat().map((deposit) => ({
            id: deposit.id,
            accountId: deposit.accountId,
            maturityDate: deposit.maturityDate,
            principalAmount: deposit.principalAmount,
          }));
          const now = new Date();
          const todaySpend = transactions
            .filter(
              (tx) =>
                tx.type === 'EXPENSE' &&
                tx.date.slice(0, 10) === now.toISOString().slice(0, 10)
            )
            .reduce((sum, tx) => sum + Math.abs(tx.totalAmount), 0);
          const activeDays = new Set(
            transactions
              .filter((tx) => tx.type === 'EXPENSE')
              .map((tx) => tx.date.slice(0, 10))
          ).size;
          const totalSpend = transactions
            .filter((tx) => tx.type === 'EXPENSE')
            .reduce((sum, tx) => sum + Math.abs(tx.totalAmount), 0);

          const computed = buildAnticipationEvents({
            budgets: loadedBudgets,
            spending: sumSpendingByCategory(transactions, yearMonth),
            deposits,
            accounts,
            today: now,
            averageDailySpend: activeDays > 0 ? totalSpend / activeDays : undefined,
            todaySpend: todaySpend > 0 ? todaySpend : undefined,
            lowBalanceThreshold: LOW_BALANCE_THRESHOLD,
            maturingDays: MATURING_DAYS,
            warningRatio: WARNING_RATIO,
          });

          setBudgets(loadedBudgets);
          setEvents(computed);
        } catch (error) {
          console.error('Error loading anticipation:', error);
          if (!cancelled) {
            setBudgets([]);
            setEvents([]);
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };

      void load();
      return () => {
        cancelled = true;
      };
    }, [accounts, transactions, yearMonth, nonce])
  );

  return { events, budgets, yearMonth, isLoading, reload };
}
