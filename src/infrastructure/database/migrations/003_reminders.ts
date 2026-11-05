import type { Migration } from '../migrationRunner';
import {
  MAX_AMOUNT,
  MAX_REMINDER_TITLE_LENGTH,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '../../../core/constants/inputLimits';

export const REMINDERS_DDL = `
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL CHECK (
        length(trim(title)) BETWEEN 1 AND ${MAX_REMINDER_TITLE_LENGTH}
    ),
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    description TEXT CHECK (
        description IS NULL
        OR length(description) <= ${MAX_TRANSACTION_DESCRIPTION_LENGTH}
    ),
    amount REAL CHECK (
        amount IS NULL
        OR (amount > 0 AND amount <= ${MAX_AMOUNT})
    ),
    account_id TEXT,
    category_id TEXT,
    recurrence TEXT NOT NULL CHECK (
        recurrence IN ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY')
    ),
    time TEXT NOT NULL CHECK (
        length(time) = 5
        AND time GLOB '[0-9][0-9]:[0-9][0-9]'
        AND substr(time, 1, 2) BETWEEN '00' AND '23'
        AND substr(time, 4, 2) BETWEEN '00' AND '59'
    ),
    start_date TEXT NOT NULL CHECK (
        length(start_date) = 10
        AND start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        AND substr(start_date, 6, 2) BETWEEN '01' AND '12'
        AND substr(start_date, 9, 2) BETWEEN '01' AND '31'
    ),
    next_run_at TEXT CHECK (
        next_run_at IS NULL OR (
            length(next_run_at) = 24
            AND next_run_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
        )
    ),
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    last_notified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
        is_archived = 1
        OR next_run_at IS NOT NULL
        OR recurrence = 'ONCE'
    ),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_due
    ON reminders(is_archived, next_run_at);

CREATE INDEX IF NOT EXISTS idx_reminders_account
    ON reminders(account_id);

CREATE INDEX IF NOT EXISTS idx_reminders_category
    ON reminders(category_id, type);
`;

export const migration: Migration = {
  version: 3,
  name: 'reminders',
  up: async (db) => {
    await db.execAsync(REMINDERS_DDL);
  },
};
