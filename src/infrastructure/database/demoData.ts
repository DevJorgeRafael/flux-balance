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
  accountId: string;
  type: Extract<TransactionType, 'INCOME' | 'EXPENSE'>;
  categoryId: string;
  description: string;
  amount: number;
}

interface DatedDemoMovement extends DemoMovementSeed {
  id: string;
  date: string;
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
    openingBalance: 1200,
    annualRate: null,
  },
  {
    id: DEMO_ACCOUNT_IDS.savings,
    name: 'Fondo MercadoPago',
    type: 'FLEXIBLE_SAVINGS',
    openingBalance: 3200,
    annualRate: 0.375,
  },
];

const DEMO_DAY_COUNTS = [0, 2, 1, 3, 0, 2, 1, 0, 3, 2, 0, 1, 3, 2, 0, 1, 2, 0, 3, 1, 2];

function income(
  accountId: string,
  categoryId: string,
  description: string,
  amount: number
): DemoMovementSeed {
  return {
    accountId,
    type: 'INCOME',
    categoryId,
    description,
    amount,
  };
}

function expense(
  accountId: string,
  categoryId: string,
  description: string,
  amount: number
): DemoMovementSeed {
  return {
    accountId,
    type: 'EXPENSE',
    categoryId,
    description,
    amount,
  };
}

const DEMO_MOVEMENT_SEEDS: DemoMovementSeed[] = [
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_salary', 'Salario mensual', 482),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_housing', 'Alquiler', 180),
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_freelance', 'Diseño de landing page', 120),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_food', 'Supermercado', 64.3),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_invest', 'Rendimiento del fondo', 24.5),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_transport', 'Transporte público', 12),
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_other', 'Venta de artículos usados', 45),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_services', 'Luz y agua', 38.5),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_freelance', 'Mantenimiento web', 160),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_food', 'Almuerzo semanal', 23.75),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_invest', 'Intereses de cuenta', 31.2),
  expense(DEMO_ACCOUNT_IDS.savings, 'cat_exp_health', 'Farmacia', 15.2),
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_other', 'Reembolso de seguro', 28),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_transport', 'Taxi', 9.5),
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_freelance', 'Asesoría contable', 95),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_food', 'Supermercado', 42.9),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_invest', 'Rendimiento del fondo', 18.75),
  expense(DEMO_ACCOUNT_IDS.savings, 'cat_exp_entertainment', 'Streaming y cine', 18),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_other', 'Regalo familiar', 36),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_services', 'Internet', 32.4),
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_freelance', 'Proyecto de diseño', 135),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_food', 'Mercado', 27.1),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_invest', 'Intereses de cuenta', 27.4),
  expense(DEMO_ACCOUNT_IDS.checking, 'cat_exp_other', 'Gastos varios', 14),
  income(DEMO_ACCOUNT_IDS.checking, 'cat_inc_other', 'Venta de libros', 22),
  expense(DEMO_ACCOUNT_IDS.savings, 'cat_exp_entertainment', 'Café con amigos', 11.5),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_freelance', 'Clases particulares', 85),
  expense(DEMO_ACCOUNT_IDS.savings, 'cat_exp_health', 'Farmacia', 8.75),
  income(DEMO_ACCOUNT_IDS.savings, 'cat_inc_invest', 'Rendimiento del fondo', 19.6),
];

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function demoDate(loadedAt: Date, daysAgo: number): Date {
  const date = new Date(loadedAt);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function buildDatedMovements(loadedAt: Date): DatedDemoMovement[] {
  const movements: DatedDemoMovement[] = [];
  let seedIndex = 0;

  for (const [dayIndex, count] of DEMO_DAY_COUNTS.entries()) {
    const daysAgo = DEMO_DAY_COUNTS.length - 1 - dayIndex;

    for (let index = 0; index < count; index++) {
      const seed = DEMO_MOVEMENT_SEEDS[seedIndex];
      if (!seed) throw new Error('Not enough demo movements');

      movements.push({
        ...seed,
        id: `demo-tx-${seedIndex + 1}`,
        date: demoDate(loadedAt, daysAgo).toISOString(),
      });
      seedIndex += 1;
    }
  }

  if (seedIndex !== DEMO_MOVEMENT_SEEDS.length) {
    throw new Error('Demo day counts do not match the available movements');
  }

  return movements;
}

export function buildDemoDataSet(loadedAt: Date = new Date()): DemoDataSet {
  const timestamp = loadedAt.toISOString();
  const windowStart = demoDate(loadedAt, DEMO_DAY_COUNTS.length - 1);
  windowStart.setHours(0, 0, 0, 0);
  const windowStartIso = windowStart.toISOString();
  const movements = buildDatedMovements(loadedAt);
  const balances = new Map(
    DEMO_ACCOUNTS.map((account) => [account.id, account.openingBalance])
  );

  for (const movement of movements) {
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
      balance: roundCents(balances.get(account.id) ?? account.openingBalance),
      annualRate: account.annualRate,
      createdAt: windowStartIso,
      updatedAt: timestamp,
    })),
    transactions: movements.map((movement, index) => ({
      id: movement.id,
      type: movement.type,
      totalAmount: movement.amount,
      description: movement.description,
      date: movement.date,
      createdAt: movement.date,
      split: {
        id: `demo-split-${index + 1}`,
        accountId: movement.accountId,
        categoryId: movement.categoryId,
        amount: movement.amount,
      },
    })),
  };
}
