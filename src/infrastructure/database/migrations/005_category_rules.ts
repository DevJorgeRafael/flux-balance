import type { Migration } from '../migrationRunner';

export const CATEGORY_RULES_DDL = `
CREATE TABLE IF NOT EXISTS category_rules (
    id TEXT PRIMARY KEY NOT NULL,
    keyword TEXT NOT NULL,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    hits INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_rules_type_keyword
    ON category_rules(type, keyword);
`;

export const migration: Migration = {
  version: 5,
  name: 'category_rules',
  up: async (db) => {
    await db.execAsync(CATEGORY_RULES_DDL);
  },
};
