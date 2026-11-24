import { create } from 'zustand';
import type { Account } from '@/core/models/account';
import type { Category } from '@/core/models/category';
import type {
  Transaction,
  TransactionPrefill,
  TransactionType,
} from '@/core/models/transaction';
import type { MonthlyTotals } from '@/core/repositories/ITransactionRepository';
import {
  SqliteAccountRepository,
  SqliteTransactionRepository,
  SqliteCategoryRepository,
} from '@/infrastructure/repositories';
import { resetDatabase } from '@/infrastructure/database/db';
import { seedDemoData } from '@/infrastructure/database/seedDemoData';
import type { DemoSeedResult } from '@/infrastructure/database/seedDemoData';

const accountRepo = new SqliteAccountRepository();
const transactionRepo = new SqliteTransactionRepository();
const categoryRepo = new SqliteCategoryRepository();

const EMPTY_TOTALS: MonthlyTotals = {
  totalIncome: 0,
  totalExpense: 0,
  netSavings: 0,
};

const MODAL_RESTORE_DELAY_MS = 400;

interface DashboardState {
  accounts: Account[];
  categories: Category[];
  monthlyTotals: MonthlyTotals;
  transactions: Transaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  isBalanceVisible: boolean;
  selectedFilterAccountId: string | null;
  isAccountModalVisible: boolean;
  isAccountModalMounted: boolean;
  isTransactionModalVisible: boolean;
  isTransactionModalMounted: boolean;
  transactionType: TransactionType;
  transactionPrefill: TransactionPrefill | null;
  transactionHiddenForCategory: boolean;

  loadData: () => Promise<void>;
  reloadTransactions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshData: () => Promise<void>;
  seedDemo: () => Promise<DemoSeedResult>;
  resetAll: () => Promise<void>;
  onDataImported: () => Promise<void>;
  selectAccountFilter: (id: string | null) => void;
  toggleBalanceVisibility: () => void;
  openTransactionModal: (type?: TransactionType, prefill?: TransactionPrefill) => void;
  closeTransactionModal: () => void;
  hideTransactionModalForCategory: (type: TransactionType) => void;
  restoreTransactionModalAfterCategory: (type?: TransactionType) => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  accounts: [],
  categories: [],
  monthlyTotals: EMPTY_TOTALS,
  transactions: [],
  isLoading: true,
  isRefreshing: false,
  isBalanceVisible: true,
  selectedFilterAccountId: null,
  isAccountModalVisible: false,
  isAccountModalMounted: false,
  isTransactionModalVisible: false,
  isTransactionModalMounted: false,
  transactionType: 'EXPENSE',
  transactionPrefill: null,
  transactionHiddenForCategory: false,

  loadData: async () => {
    try {
      const currentYearMonth = new Date().toISOString().substring(0, 7);
      const [accounts, categories, monthlyTotals] = await Promise.all([
        accountRepo.getAll(),
        categoryRepo.getAll(),
        transactionRepo.getMonthlyTotals(currentYearMonth),
      ]);
      set({ accounts, categories, monthlyTotals });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  reloadTransactions: async () => {
    try {
      const accountId = get().selectedFilterAccountId;
      const transactions = await transactionRepo.getAll(
        accountId ? { accountId } : undefined
      );
      set({ transactions });
    } catch (error) {
      console.error('Error loading transactions in filter:', error);
    }
  },

  refreshAll: async () => {
    set({ isRefreshing: true });
    await Promise.all([get().loadData(), get().reloadTransactions()]);
  },

  refreshData: async () => {
    await Promise.all([get().loadData(), get().reloadTransactions()]);
  },

  seedDemo: async () => {
    set({ isLoading: true });
    try {
      const result = await seedDemoData();
      await get().loadData();
      await get().reloadTransactions();
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  resetAll: async () => {
    set({ isLoading: true });
    try {
      await resetDatabase();
      set({ selectedFilterAccountId: null });
      await Promise.all([get().loadData(), get().reloadTransactions()]);
    } finally {
      set({ isLoading: false });
    }
  },

  onDataImported: async () => {
    set({ selectedFilterAccountId: null });
    await Promise.all([get().loadData(), get().reloadTransactions()]);
  },

  selectAccountFilter: (id) => {
    const next = get().selectedFilterAccountId === id ? null : id;
    set({ selectedFilterAccountId: next });
    void get().reloadTransactions();
  },

  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  openTransactionModal: (type = 'EXPENSE', prefill) =>
    set({
      transactionType: type,
      transactionPrefill: prefill ?? null,
      isTransactionModalMounted: true,
      isTransactionModalVisible: true,
    }),

  closeTransactionModal: () =>
    set({ isTransactionModalVisible: false, transactionPrefill: null }),

  hideTransactionModalForCategory: (type) =>
    set({
      isTransactionModalVisible: false,
      transactionPrefill: null,
      transactionType: type,
      transactionHiddenForCategory: true,
    }),

  restoreTransactionModalAfterCategory: (type) => {
    const { transactionHiddenForCategory, transactionType } = get();
    if (!transactionHiddenForCategory) return;

    const restoredType = type ?? transactionType;
    set({ transactionHiddenForCategory: false });

    setTimeout(() => {
      set({
        isTransactionModalMounted: true,
        isTransactionModalVisible: true,
        transactionType: restoredType,
        transactionPrefill: null,
      });
    }, MODAL_RESTORE_DELAY_MS);
  },

  openAccountModal: () =>
    set({ isAccountModalMounted: true, isAccountModalVisible: true }),

  closeAccountModal: () => set({ isAccountModalVisible: false }),
}));
