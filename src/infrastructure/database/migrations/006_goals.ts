import type { Migration } from '../migrationRunner';

export const GOALS_DDL = `
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
    target_amount REAL NOT NULL CHECK (target_amount > 0),
    deadline TEXT NOT NULL CHECK (length(deadline) = 10),
    account_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
`;

export const migration: Migration = {
  version: 6,
  name: 'goals',
  up: async (db) => {
    await db.execAsync(GOALS_DDL);
  },
};
