import type { AccountType } from '@/core/models/account';
import type { TransactionType } from '@/core/models/transaction';

export const DEMO_ACCOUNT_IDS = {
  checking: 'demo-acc-1',
  savings: 'demo-acc-2',
} as const;

interface DemoAccountSeed {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  annualRate: number | null;
}

interface DemoMovementSeed {
  id: string;
  accountId: string;
  type: Extract<TransactionType, 'INCOME' | 'EXPENSE'>;
  categoryId: string;
  description: string;
  amount: number;
}

export interface DemoAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  annualRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTransaction {
  id: string;
  type: Extract<TransactionType, 'INCOME' | 'EXPENSE'>;
  totalAmount: number;
  description: string;
  date: string;
  createdAt: string;
  split: {
    id: string;
    accountId: string;
    categoryId: string;
    amount: number;
  };
}

export interface DemoDataSet {
  accounts: DemoAccount[];
  transactions: DemoTransaction[];
}

const DEMO_ACCOUNTS: DemoAccountSeed[] = [
  {
    id: DEMO_ACCOUNT_IDS.checking,
    name: 'Cuenta Sueldo (Galicia)',
    type: 'CHECKING',
    openingBalance: 600000,
    annualRate: null,
  },
  {
    id: DEMO_ACCOUNT_IDS.savings,
    name: 'Fondo MercadoPago',
    type: 'FLEXIBLE_SAVINGS',
    openingBalance: 300000,
    annualRate: 0.375,
  },
];

const DEMO_MOVEMENTS: DemoMovementSeed[] = [
  {
    id: 'demo-tx-1',
    accountId: DEMO_ACCOUNT_IDS.checking,
    type: 'INCOME',
    categoryId: 'cat_inc_salary',
    description: 'Acreditación de haberes',
    amount: 1250000,
  },
  {
    id: 'demo-tx-2',
    accountId: DEMO_ACCOUNT_IDS.checking,
    type: 'EXPENSE',
    categoryId: 'cat_exp_housing',
    description: 'Alquiler',
    amount: 380000,
  },
  {
    id: 'demo-tx-3',
    accountId: DEMO_ACCOUNT_IDS.checking,
    type: 'EXPENSE',
    categoryId: 'cat_exp_food',
    description: 'Supermercado',
    amount: 95500,
  },
  {
    id: 'demo-tx-4',
    accountId: DEMO_ACCOUNT_IDS.checking,
    type: 'EXPENSE',
    categoryId: 'cat_exp_transport',
    description: 'Transporte',
    amount: 42000,
  },
  {
    id: 'demo-tx-5',
    accountId: DEMO_ACCOUNT_IDS.checking,
    type: 'EXPENSE',
    categoryId: 'cat_exp_services',
    description: 'Servicios del hogar',
    amount: 58000,
  },
  {
    id: 'demo-tx-6',
    accountId: DEMO_ACCOUNT_IDS.savings,
    type: 'INCOME',
    categoryId: 'cat_inc_freelance',
    description: 'Proyecto freelance',
    amount: 280000,
  },
  {
    id: 'demo-tx-7',
    accountId: DEMO_ACCOUNT_IDS.savings,
    type: 'INCOME',
    categoryId: 'cat_inc_invest',
    description: 'Rendimientos del fondo',
    amount: 35000,
  },
  {
    id: 'demo-tx-8',
    accountId: DEMO_ACCOUNT_IDS.savings,
    type: 'EXPENSE',
    categoryId: 'cat_exp_health',
    description: 'Farmacia',
    amount: 28000,
  },
  {
    id: 'demo-tx-9',
    accountId: DEMO_ACCOUNT_IDS.savings,
    type: 'EXPENSE',
    categoryId: 'cat_exp_entertainment',
    description: 'Cine y streaming',
    amount: 45000,
  },
  {
    id: 'demo-tx-10',
    accountId: DEMO_ACCOUNT_IDS.savings,
    type: 'EXPENSE',
    categoryId: 'cat_exp_other',
    description: 'Gastos varios',
    amount: 18000,
  },
];

export function buildDemoDataSet(loadedAt: Date = new Date()): DemoDataSet {
  const timestamp = loadedAt.toISOString();
  const balances = new Map(
    DEMO_ACCOUNTS.map((account) => [account.id, account.openingBalance])
  );

  for (const movement of DEMO_MOVEMENTS) {
    const currentBalance = balances.get(movement.accountId);

    if (currentBalance === undefined) {
      throw new Error(`Unknown demo account: ${movement.accountId}`);
    }

    balances.set(
      movement.accountId,
      currentBalance + (movement.type === 'INCOME' ? movement.amount : -movement.amount)
    );
  }

  return {
    accounts: DEMO_ACCOUNTS.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: balances.get(account.id) ?? account.openingBalance,
      annualRate: account.annualRate,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    transactions: DEMO_MOVEMENTS.map((movement, index) => ({
      id: movement.id,
      type: movement.type,
      totalAmount: movement.amount,
      description: movement.description,
      date: timestamp,
      createdAt: timestamp,
      split: {
        id: `demo-split-${index + 1}`,
        accountId: movement.accountId,
        categoryId: movement.categoryId,
        amount: movement.amount,
      },
    })),
  };
}
