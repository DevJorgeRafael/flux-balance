import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Account } from '@/core/models/account';
import { Category } from '@/core/models/category';
import { MonthlyTotals } from '@/core/repositories/ITransactionRepository';
import {
  SqliteAccountRepository,
  SqliteTransactionRepository,
  SqliteCategoryRepository,
} from '@/infrastructure/repositories';
import { resetDatabase } from '@/infrastructure/database/db';
import { seedDemoData } from '@/infrastructure/database/seedDemoData';

const accountRepo = new SqliteAccountRepository();
const transactionRepo = new SqliteTransactionRepository();
const categoryRepo = new SqliteCategoryRepository();

export function useDashboardStats() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals>({
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentYearMonth = new Date().toISOString().substring(0, 7);
      const [accs, cats, totals] = await Promise.all([
        accountRepo.getAll(),
        categoryRepo.getAll(),
        transactionRepo.getMonthlyTotals(currentYearMonth),
      ]);

      setAccounts(accs);
      setCategories(cats);
      setMonthlyTotals(totals);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const fetchInitial = async () => {
      try {
        const currentYearMonth = new Date().toISOString().substring(0, 7);
        const [accs, cats, totals] = await Promise.all([
          accountRepo.getAll(),
          categoryRepo.getAll(),
          transactionRepo.getMonthlyTotals(currentYearMonth),
        ]);
        if (!isCancelled) {
          setAccounts(accs);
          setCategories(cats);
          setMonthlyTotals(totals);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchInitial();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleSeedDemoData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await seedDemoData();
      await loadData();
      Alert.alert(
        'Datos cargados',
        `Se agregaron ${result.accounts} cuentas y ${result.transactions} movimientos con la fecha actual.`
      );
    } catch (err: unknown) {
      console.error('Error seeding demo data:', err);
      Alert.alert('Error', 'No se pudieron cargar los datos demo.');
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const handleResetAllData = useCallback(async () => {
    Alert.alert(
      '¿Restablecer todo?',
      'Esta acción eliminará todas las transacciones, cuentas y depósitos. Los datos volverán a su estado inicial en blanco.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await resetDatabase();
              await loadData();
              Alert.alert('Base de datos restablecida', 'Se han borrado todos los datos correctamente.');
            } catch (err) {
              console.error('Error resetting database:', err);
              Alert.alert('Error', 'No se pudo restablecer la base de datos.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [loadData]);

  return {
    accounts,
    categories,
    monthlyTotals,
    totalBalance,
    isLoading,
    isRefreshing,
    loadData,
    handleRefresh,
    handleSeedDemoData,
    handleResetAllData,
  };
}
