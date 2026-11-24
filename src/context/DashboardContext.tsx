import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { appAlert } from '@/components/ui/alert/appAlert';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Account } from '@/core/models/account';
import type { Category } from '@/core/models/category';
import type {
  Transaction,
  TransactionPrefill,
  TransactionType,
} from '@/core/models/transaction';
import type { MonthlyTotals } from '@/core/repositories/ITransactionRepository';
import { useDashboardStore } from '@/store/dashboardStore';

const CreateAccountModal = lazy(() =>
  import('@/components/dashboard/CreateAccountModal').then((module) => ({
    default: module.CreateAccountModal,
  }))
);

const CreateTransactionModal = lazy(() =>
  import('@/components/dashboard/CreateTransactionModal').then((module) => ({
    default: module.CreateTransactionModal,
  }))
);

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
  refreshData: () => void;
  handleSeedDemoData: () => Promise<void>;
  handleResetAllData: () => Promise<void>;
  handleDataImported: () => Promise<void>;
  openTransactionModal: (
    type?: TransactionType,
    prefill?: TransactionPrefill
  ) => void;
  openAccountModal: () => void;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);
  const { t } = useTranslation();

  const accounts = useDashboardStore((state) => state.accounts);
  const categories = useDashboardStore((state) => state.categories);
  const monthlyTotals = useDashboardStore((state) => state.monthlyTotals);
  const transactions = useDashboardStore((state) => state.transactions);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const isRefreshing = useDashboardStore((state) => state.isRefreshing);
  const isBalanceVisible = useDashboardStore((state) => state.isBalanceVisible);
  const selectedFilterAccountId = useDashboardStore(
    (state) => state.selectedFilterAccountId
  );
  const isAccountModalVisible = useDashboardStore(
    (state) => state.isAccountModalVisible
  );
  const isAccountModalMounted = useDashboardStore(
    (state) => state.isAccountModalMounted
  );
  const isTransactionModalVisible = useDashboardStore(
    (state) => state.isTransactionModalVisible
  );
  const isTransactionModalMounted = useDashboardStore(
    (state) => state.isTransactionModalMounted
  );
  const transactionType = useDashboardStore((state) => state.transactionType);
  const transactionPrefill = useDashboardStore((state) => state.transactionPrefill);

  const loadData = useDashboardStore((state) => state.loadData);
  const reloadTransactions = useDashboardStore((state) => state.reloadTransactions);
  const refreshAll = useDashboardStore((state) => state.refreshAll);
  const refreshDataAction = useDashboardStore((state) => state.refreshData);
  const seedDemo = useDashboardStore((state) => state.seedDemo);
  const resetAll = useDashboardStore((state) => state.resetAll);
  const onDataImported = useDashboardStore((state) => state.onDataImported);
  const selectAccountFilter = useDashboardStore(
    (state) => state.selectAccountFilter
  );
  const toggleBalanceVisibility = useDashboardStore(
    (state) => state.toggleBalanceVisibility
  );
  const openTransactionModal = useDashboardStore(
    (state) => state.openTransactionModal
  );
  const closeTransactionModal = useDashboardStore(
    (state) => state.closeTransactionModal
  );
  const openAccountModal = useDashboardStore((state) => state.openAccountModal);
  const closeAccountModal = useDashboardStore((state) => state.closeAccountModal);

  useEffect(() => {
    void loadData();
    void reloadTransactions();
  }, [loadData, reloadTransactions]);

  const handleRefresh = useCallback(() => {
    void refreshAll();
  }, [refreshAll]);

  const refreshData = useCallback(() => {
    void refreshDataAction();
  }, [refreshDataAction]);

  const handleSeedDemoData = useCallback(async () => {
    try {
      const result = await seedDemo();
      void appAlert({
        type: 'success',
        title: t('demoDataLoadedTitle'),
        message: t('demoDataLoadedMessage', {
          accounts: result.accounts,
          transactions: result.transactions,
        }),
        buttons: [{ text: t('accept') }],
      });
    } catch (error) {
      console.error('Error seeding demo data:', error);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('demoDataLoadError'),
        buttons: [{ text: t('accept') }],
      });
    }
  }, [seedDemo, t]);

  const handleResetAllData = useCallback(() => resetAll(), [resetAll]);
  const handleDataImported = useCallback(() => onDataImported(), [onDataImported]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const selectedAccountName = accounts.find(
    (account) => account.id === selectedFilterAccountId
  )?.name;

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
      handleSelectAccountFilter: selectAccountFilter,
      handleRefresh,
      refreshData,
      handleSeedDemoData,
      handleResetAllData,
      handleDataImported,
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
      selectAccountFilter,
      handleRefresh,
      refreshData,
      handleSeedDemoData,
      handleResetAllData,
      handleDataImported,
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

        {isTransactionModalMounted && (
          <Suspense fallback={null}>
            <CreateTransactionModal
              visible={isTransactionModalVisible}
              initialType={transactionType}
              initialPrefill={transactionPrefill}
              accounts={accounts}
              categories={categories}
              blurTarget={blurTarget}
              onClose={closeTransactionModal}
              onTransactionCreated={refreshData}
            />
          </Suspense>
        )}

        {isAccountModalMounted && (
          <Suspense fallback={null}>
            <CreateAccountModal
              visible={isAccountModalVisible}
              blurTarget={blurTarget}
              onClose={closeAccountModal}
              onAccountCreated={refreshData}
            />
          </Suspense>
        )}
      </View>
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = React.useContext(DashboardContext);
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
