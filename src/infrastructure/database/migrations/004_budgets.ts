import type { Migration } from '../migrationRunner';

export const BUDGETS_DDL = `
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    year_month TEXT NOT NULL CHECK (length(year_month) = 7),
    limit_amount REAL NOT NULL CHECK (limit_amount > 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budgets_month
    ON budgets(year_month, type);
`;

export const migration: Migration = {
  version: 4,
  name: 'budgets',
  up: async (db) => {
    await db.execAsync(BUDGETS_DDL);
  },
};
