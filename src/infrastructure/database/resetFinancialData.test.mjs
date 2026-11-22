import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { resetFinancialData } from './resetFinancialData.ts';
import { BASELINE_DDL } from './migrations/001_baseline.ts';
import { REMINDERS_DDL } from './migrations/003_reminders.ts';
import { DEFAULT_CATEGORIES } from './schema.sql.ts';

const DEFAULT_INCOME_COUNT = DEFAULT_CATEGORIES.filter(
  (category) => category.type === 'INCOME'
).length;
const DEFAULT_EXPENSE_COUNT = DEFAULT_CATEGORIES.filter(
  (category) => category.type === 'EXPENSE'
).length;

function createDatabase() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(BASELINE_DDL);
  raw.exec(REMINDERS_DDL);
  raw.exec(
    'CREATE TABLE app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
  );

  const db = {
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params = []) {
      return raw.prepare(sql).run(...params);
    },
    async getFirstAsync(sql, params = []) {
      return raw.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, params = []) {
      return raw.prepare(sql).all(...params);
    },
    async withExclusiveTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task(this);
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return { raw, db };
}

function seedFinancialData(raw) {
  const insertSetting = raw.prepare(
    'INSERT INTO app_settings (key, value) VALUES (?, ?)'
  );
  insertSetting.run('currency', 'EUR');
  insertSetting.run('themePreference', 'dark');
  insertSetting.run('languagePreference', 'es');

  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('acc-1', 'Cuenta principal', 'CHECKING', 1000, 'EUR');

  raw
    .prepare(
      `INSERT INTO fixed_term_deposits
         (id, account_id, principal_amount, annual_rate, term_months, start_date, maturity_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run('dep-1', 'acc-1', 500, 0.4, 3, '2026-01-01', '2026-04-01');

  raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, description, date)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('tx-1', 'EXPENSE', 25, 'Supermercado', '2026-01-02');

  raw
    .prepare(
      `INSERT INTO transaction_splits
         (id, transaction_id, account_id, category_id, amount)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('split-1', 'tx-1', 'acc-1', 'cat_custom_expense', 25);

  raw
    .prepare(
      `INSERT INTO income_categories (id, name, is_default, sort_order)
       VALUES (?, ?, ?, ?)`
    )
    .run('cat_custom_income', 'Ingreso personalizado', 0, 10);

  raw
    .prepare(
      `INSERT INTO expense_categories (id, name, is_default, sort_order)
       VALUES (?, ?, ?, ?)`
    )
    .run('cat_custom_expense', 'Gasto personalizado', 0, 10);

  raw
    .prepare(
      `INSERT INTO reminders
         (id, title, type, account_id, category_id, recurrence, time,
          start_date, next_run_at)
       VALUES (?, ?, 'EXPENSE', ?, ?, 'MONTHLY', '09:00', '2026-02-01',
               '2026-02-01T09:00:00.000Z')`
    )
    .run('rem-1', 'Pago de luz', 'acc-1', 'cat_custom_expense');
}

function count(raw, table) {
  return raw.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function readSettings(raw) {
  return Object.fromEntries(
    raw
      .prepare('SELECT key, value FROM app_settings ORDER BY key')
      .all()
      .map((row) => [row.key, row.value])
  );
}

test('borra datos financieros, conserva preferencias y restaura categorías por defecto', async () => {
  const { raw, db } = createDatabase();
  seedFinancialData(raw);

  await resetFinancialData(db);

  assert.equal(count(raw, 'transaction_splits'), 0);
  assert.equal(count(raw, 'transactions'), 0);
  assert.equal(count(raw, 'fixed_term_deposits'), 0);
  assert.equal(count(raw, 'accounts'), 0);
  assert.equal(count(raw, 'income_categories'), DEFAULT_INCOME_COUNT);
  assert.equal(count(raw, 'expense_categories'), DEFAULT_EXPENSE_COUNT);

  assert.equal(count(raw, 'reminders'), 1);
  assert.deepEqual(
    { ...raw.prepare('SELECT account_id, category_id FROM reminders').get() },
    { account_id: null, category_id: null }
  );

  const customCategories = raw
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM income_categories WHERE id = 'cat_custom_income') AS income,
         (SELECT COUNT(*) FROM expense_categories WHERE id = 'cat_custom_expense') AS expense`
    )
    .get();
  assert.deepEqual({ ...customCategories }, { income: 0, expense: 0 });

  assert.deepEqual(readSettings(raw), {
    currency: 'EUR',
    languagePreference: 'es',
    themePreference: 'dark',
  });
});

test('revierte toda la operación si falla la restauración de categorías', async () => {
  const { raw, db } = createDatabase();
  seedFinancialData(raw);

  const failingDb = {
    ...db,
    async runAsync(sql, params = []) {
      if (sql.includes('INSERT OR IGNORE INTO income_categories')) {
        throw new Error('seed failed');
      }
      return db.runAsync(sql, params);
    },
  };

  await assert.rejects(() => resetFinancialData(failingDb), /seed failed/);

  assert.equal(count(raw, 'accounts'), 1);
  assert.equal(count(raw, 'transactions'), 1);
  assert.equal(count(raw, 'transaction_splits'), 1);
  assert.equal(count(raw, 'fixed_term_deposits'), 1);
  assert.equal(count(raw, 'income_categories'), 1);
  assert.equal(count(raw, 'expense_categories'), 1);
  assert.deepEqual(
    { ...raw.prepare('SELECT account_id, category_id FROM reminders').get() },
    { account_id: 'acc-1', category_id: 'cat_custom_expense' }
  );
  assert.deepEqual(readSettings(raw), {
    currency: 'EUR',
    languagePreference: 'es',
    themePreference: 'dark',
  });
});
