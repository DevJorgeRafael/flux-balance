import type { Migration, MigrationDatabase } from '../migrationRunner';
import { migrateCategories } from '../migrateCategories';
import {
  CATEGORY_INDEXES_DDL,
  CATEGORY_TABLES_DDL,
  SPLIT_INDEXES_DDL,
} from '../schema.sql';

export const BASELINE_DDL = `
-- 1. Cuentas (Accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('CHECKING', 'FLEXIBLE_SAVINGS', 'FIXED_TERM')) NOT NULL,
    balance REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    annual_rate REAL DEFAULT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Subcontratos / Tramos de Plazo Fijo (Fixed Term Tranches)
CREATE TABLE IF NOT EXISTS fixed_term_deposits (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    principal_amount REAL NOT NULL,
    annual_rate REAL NOT NULL,
    term_months INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    maturity_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('ACTIVE', 'MATURED', 'CANCELLED')) NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 3. Categorías separadas por tipo (Income / Expense Categories)
${CATEGORY_TABLES_DDL}

-- 4. Transacciones (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT CHECK(type IN ('INCOME', 'EXPENSE', 'TRANSFER')) NOT NULL,
    total_amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Divisiones de Transacción (Transaction Splits)
CREATE TABLE IF NOT EXISTS transaction_splits (
    id TEXT PRIMARY KEY NOT NULL,
    transaction_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- Índices de consulta rápida
${CATEGORY_INDEXES_DDL}
${SPLIT_INDEXES_DDL}
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_account ON fixed_term_deposits(account_id);
`;

// migrateCategories abre su propia transacción exclusiva. Como la migración ya
// corre dentro de una transacción, se reutiliza esa conexión para evitar anidar
// una segunda transacción sobre otra conexión nativa.
function withSharedTransaction(db: MigrationDatabase): MigrationDatabase {
  return {
    execAsync: db.execAsync.bind(db),
    runAsync: db.runAsync.bind(db),
    getFirstAsync: db.getFirstAsync.bind(db),
    getAllAsync: db.getAllAsync.bind(db),
    withExclusiveTransactionAsync: async (task) => {
      await task(db);
    },
  };
}

export const migration: Migration = {
  version: 1,
  name: 'baseline',
  requiresForeignKeysOff: true,
  up: async (db) => {
    await db.execAsync(BASELINE_DDL);
    // migrateCategories está tipado contra expo-sqlite; el adaptador comparte la
    // misma transacción y expone exactamente los métodos que la migración usa.
    await migrateCategories(
      withSharedTransaction(db) as unknown as Parameters<
        typeof migrateCategories
      >[0]
    );
  },
};
