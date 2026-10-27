import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  CategoryNotFoundError,
  DefaultCategoryDeletionError,
  deleteCategoryAndUncategorize,
  getCategoryUsageCount,
} from './categoryManagement.ts';

function createDb() {
  const raw = new DatabaseSync(':memory:');
  raw.exec(`
    CREATE TABLE income_categories (
      id TEXT PRIMARY KEY NOT NULL,
      is_default INTEGER NOT NULL
    );
    CREATE TABLE expense_categories (
      id TEXT PRIMARY KEY NOT NULL,
      is_default INTEGER NOT NULL
    );
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL
    );
    CREATE TABLE transaction_splits (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      category_id TEXT NOT NULL
    );
  `);

  raw.exec(`
    INSERT INTO income_categories (id, is_default) VALUES ('cat_custom', 0);
    INSERT INTO expense_categories (id, is_default) VALUES ('cat_custom', 0);
    INSERT INTO expense_categories (id, is_default) VALUES ('cat_default', 1);

    INSERT INTO transactions (id, type) VALUES ('tx-expense-1', 'EXPENSE');
    INSERT INTO transactions (id, type) VALUES ('tx-expense-2', 'EXPENSE');
    INSERT INTO transactions (id, type) VALUES ('tx-income-1', 'INCOME');

    INSERT INTO transaction_splits (id, transaction_id, category_id)
      VALUES ('split-expense-1', 'tx-expense-1', 'cat_custom');
    INSERT INTO transaction_splits (id, transaction_id, category_id)
      VALUES ('split-expense-1b', 'tx-expense-1', 'cat_custom');
    INSERT INTO transaction_splits (id, transaction_id, category_id)
      VALUES ('split-expense-2', 'tx-expense-2', 'cat_custom');
    INSERT INTO transaction_splits (id, transaction_id, category_id)
      VALUES ('split-income-1', 'tx-income-1', 'cat_custom');
    INSERT INTO transaction_splits (id, transaction_id, category_id)
      VALUES ('split-default', 'tx-expense-1', 'cat_default');
  `);

  const db = {
    async getFirstAsync(sql, params = []) {
      return raw.prepare(sql).get(...params) ?? null;
    },
    async runAsync(sql, params = []) {
      return raw.prepare(sql).run(...params);
    },
    async withTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return { raw, db };
}

function splitCategories(raw) {
  return Object.fromEntries(
    raw
      .prepare('SELECT id, category_id FROM transaction_splits ORDER BY id')
      .all()
      .map((row) => [row.id, row.category_id])
  );
}

test('counts distinct movements only within the category type', async () => {
  const { db } = createDb();

  assert.equal(await getCategoryUsageCount(db, 'cat_custom', 'EXPENSE'), 2);
  assert.equal(await getCategoryUsageCount(db, 'cat_custom', 'INCOME'), 1);
  assert.equal(await getCategoryUsageCount(db, 'missing', 'EXPENSE'), 0);
});

test('deletes only the selected type and moves its movements to uncategorized', async () => {
  const { raw, db } = createDb();

  const usage = await deleteCategoryAndUncategorize(db, 'cat_custom', 'EXPENSE');

  assert.equal(usage, 2);
  assert.deepEqual(splitCategories(raw), {
    'split-default': 'cat_default',
    'split-expense-1': '',
    'split-expense-1b': '',
    'split-expense-2': '',
    'split-income-1': 'cat_custom',
  });

  const income = raw
    .prepare("SELECT COUNT(*) AS count FROM income_categories WHERE id = 'cat_custom'")
    .get();
  const expense = raw
    .prepare("SELECT COUNT(*) AS count FROM expense_categories WHERE id = 'cat_custom'")
    .get();
  assert.equal(income.count, 1);
  assert.equal(expense.count, 0);
});

test('does not allow deleting default or missing categories', async () => {
  const { raw, db } = createDb();
  const before = splitCategories(raw);

  await assert.rejects(
    () => deleteCategoryAndUncategorize(db, 'cat_default', 'EXPENSE'),
    DefaultCategoryDeletionError
  );
  await assert.rejects(
    () => deleteCategoryAndUncategorize(db, 'missing', 'EXPENSE'),
    CategoryNotFoundError
  );

  assert.deepEqual(splitCategories(raw), before);
  assert.equal(
    raw
      .prepare("SELECT COUNT(*) AS count FROM expense_categories WHERE id = 'cat_default'")
      .get().count,
    1
  );
});
