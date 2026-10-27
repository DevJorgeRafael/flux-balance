import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Account } from '@/core/models/account';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';

const transactionRepo = new SqliteTransactionRepository();

function isSameCalendarMonth(dateValue: string, year: number, monthIndex: number): boolean {
  const date = new Date(dateValue);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === monthIndex
  );
}

/**
 * Cuenta movimientos distintos del mes actual por cuenta. Se consulta aparte
 * porque la lista de transacciones del Dashboard puede estar filtrada por una
 * cuenta y no refleja el total de todas.
 */
export function useMonthlyAccountMovementCounts(
  accounts: Account[]
): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const requestId = useRef(0);

  const loadCounts = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    try {
      const transactions = await transactionRepo.getAll();
      if (requestId.current !== currentRequest) return;

      const now = new Date();
      const knownAccountIds = new Set(accounts.map((account) => account.id));
      const next: Record<string, number> = {};

      for (const account of accounts) {
        next[account.id] = 0;
      }

      for (const transaction of transactions) {
        if (!isSameCalendarMonth(transaction.date, now.getFullYear(), now.getMonth())) {
          continue;
        }

        const touchedAccountIds = new Set(
          (transaction.splits ?? []).map((split) => split.accountId)
        );

        for (const accountId of touchedAccountIds) {
          if (knownAccountIds.has(accountId)) {
            next[accountId] = (next[accountId] ?? 0) + 1;
          }
        }
      }

      setCounts(next);
    } catch (error) {
      console.error('Error loading monthly account movement counts:', error);
    }
  }, [accounts]);

  useFocusEffect(
    useCallback(() => {
      void loadCounts();
      return () => {
        requestId.current += 1;
      };
    }, [loadCounts])
  );

  return counts;
}
