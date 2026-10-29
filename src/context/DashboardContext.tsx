import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { Account } from '@/core/models/account';
import { Category } from '@/core/models/category';
import { Transaction, TransactionType } from '@/core/models/transaction';
import { MonthlyTotals } from '@/core/repositories/ITransactionRepository';
import { useAccountFilters } from '@/hooks/useAccountFilters';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { CreateAccountModal } from '@/components/dashboard/CreateAccountModal';
import { CreateTransactionModal } from '@/components/dashboard/CreateTransactionModal';

interface DashboardContextValue {
  accounts: Account[];
  categories: Category[];
  monthlyTotals: MonthlyTotals;
  totalBalance: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;
  selectedFilterAccountId: string | null;
  transactions: Transaction[];
  selectedAccountName?: string;
  handleSelectAccountFilter: (id: string | null) => void;
  handleRefresh: () => void;
  handleSeedDemoData: () => Promise<void>;
  handleResetAllData: () => Promise<void>;
  openTransactionModal: (type?: TransactionType) => void;
  openAccountModal: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const {
    accounts,
    categories,
    monthlyTotals,
    totalBalance,
    isLoading,
    isRefreshing,
    loadData,
    handleRefresh,
    handleSeedDemoData: seedDemoData,
    handleResetAllData: resetAllData,
  } = useDashboardStats();

  const {
    selectedFilterAccountId,
    transactions,
    selectedAccountName,
    handleSelectAccountFilter,
    reloadTransactions,
  } = useAccountFilters(accounts);

  const handleSeedDemoData = useCallback(async () => {
    await seedDemoData();
    await reloadTransactions();
  }, [reloadTransactions, seedDemoData]);

  const handleResetAllData = useCallback(async () => {
    await resetAllData();
    handleSelectAccountFilter(null);
    await reloadTransactions();
  }, [handleSelectAccountFilter, reloadTransactions, resetAllData]);

  const handleDataChanged = useCallback(() => {
    void loadData();
    void reloadTransactions();
  }, [loadData, reloadTransactions]);

  const handleRefreshAll = useCallback(() => {
    handleRefresh();
    void reloadTransactions();
  }, [handleRefresh, reloadTransactions]);

  const openTransactionModal = useCallback((type: TransactionType = 'EXPENSE') => {
    setTransactionType(type);
    setIsTransactionModalVisible(true);
  }, []);

  const openAccountModal = useCallback(() => {
    setIsAccountModalVisible(true);
  }, []);

  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceVisible((visible) => !visible);
  }, []);

  const value = useMemo<DashboardContextValue>(
    () => ({
      accounts,
      categories,
      monthlyTotals,
      totalBalance,
      isLoading,
      isRefreshing,
      isBalanceVisible,
      toggleBalanceVisibility,
      selectedFilterAccountId,
      transactions,
      selectedAccountName,
      handleSelectAccountFilter,
      handleRefresh: handleRefreshAll,
      handleSeedDemoData,
      handleResetAllData,
      openTransactionModal,
      openAccountModal,
    }),
    [
      accounts,
      categories,
      monthlyTotals,
      totalBalance,
      isLoading,
      isRefreshing,
      isBalanceVisible,
      toggleBalanceVisibility,
      selectedFilterAccountId,
      transactions,
      selectedAccountName,
      handleSelectAccountFilter,
      handleRefreshAll,
      handleSeedDemoData,
      handleResetAllData,
      openTransactionModal,
      openAccountModal,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      <View style={styles.container}>
        <BlurTargetView ref={blurTarget} style={styles.content}>
          {children}
        </BlurTargetView>

        <CreateTransactionModal
          visible={isTransactionModalVisible}
          initialType={transactionType}
          accounts={accounts}
          categories={categories}
          blurTarget={blurTarget}
          onClose={() => setIsTransactionModalVisible(false)}
          onTransactionCreated={handleDataChanged}
        />

        <CreateAccountModal
          visible={isAccountModalVisible}
          blurTarget={blurTarget}
          onClose={() => setIsAccountModalVisible(false)}
          onAccountCreated={handleDataChanged}
        />
      </View>
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider.');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
