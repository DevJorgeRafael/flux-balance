import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateCategories } from './migrateCategories.ts';
import { seedDefaultCategories } from './seedDefaultCategories.ts';
import { DEFAULT_CATEGORIES } from './schema.sql.ts';
import { isPaletteColor } from '../../core/constants/categoryPalettes.ts';
import {
  assignCategoryPaletteColors,
  buildCategoryMigrationPlan,
  classifyLegacyCategory,
} from './categoryMigrationPlan.ts';

const migratedAt = new Date('2026-10-26T18:30:00.000Z');

function legacyCategory(overrides = {}) {
  return {
    id: 'cat_custom',
    name: 'Categoría personalizada',
    type: 'EXPENSE',
    icon: 'star',
    color: '#123456',
    is_default: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createLegacyDb() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY NOT NULL
    );
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL
    );
    CREATE TABLE transaction_splits (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
    CREATE INDEX idx_splits_tx ON transaction_splits(transaction_id);
    CREATE INDEX idx_splits_account ON transaction_splits(account_id);
    CREATE INDEX idx_splits_category ON transaction_splits(category_id);
  `);

  const insertCategory = raw.prepare(`
    INSERT INTO categories (id, name, type, icon, color, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const category of DEFAULT_CATEGORIES) {
    insertCategory.run(
      category.id,
      category.name,
      category.type,
      category.icon,
      category.color,
      category.is_default,
      '2026-01-01T00:00:00.000Z'
    );
  }

  insertCategory.run(
    'cat_custom',
    'Categoría personalizada',
    'EXPENSE',
    'star',
    '#123456',
    0,
    '2026-02-02T00:00:00.000Z'
  );

  raw.prepare('INSERT INTO accounts (id) VALUES (?)').run('account-1');
  const insertTransaction = raw.prepare(
    'INSERT INTO transactions (id, type) VALUES (?, ?)'
  );
  insertTransaction.run('tx-income', 'INCOME');
  insertTransaction.run('tx-expense', 'EXPENSE');
  insertTransaction.run('tx-custom', 'EXPENSE');
  insertTransaction.run('tx-custom-income', 'INCOME');

  const insertSplit = raw.prepare(`
    INSERT INTO transaction_splits
      (id, transaction_id, account_id, category_id, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSplit.run('split-income', 'tx-income', 'account-1', 'cat_inc_salary', 100, null);
  insertSplit.run('split-food', 'tx-expense', 'account-1', 'cat_exp_food', 50, null);
  insertSplit.run('split-custom', 'tx-custom', 'account-1', 'cat_custom', 25, 'custom');
  insertSplit.run('split-custom-income', 'tx-custom-income', 'account-1', 'cat_custom', 15, 'custom income');

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

function count(raw, table) {
  return raw.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function categoryCounts(raw) {
  return {
    income: count(raw, 'income_categories'),
    expense: count(raw, 'expense_categories'),
    backup: count(raw, 'categories_backup_v1'),
    splits: count(raw, 'transaction_splits'),
  };
}

function readSplits(raw) {
  return raw
    .prepare(
      `SELECT id, transaction_id, account_id, category_id, amount, notes
       FROM transaction_splits
       ORDER BY id`
    )
    .all()
    .map((row) => ({ ...row }));
}

function readCategoryColors(raw, table) {
  return raw
    .prepare(`SELECT id, color FROM ${table} ORDER BY id`)
    .all()
    .map((row) => ({ ...row }));
}

function resolvedSplits(raw) {
  return raw
    .prepare(
      `SELECT
         s.id,
         s.category_id,
         CASE WHEN t.type = 'INCOME' THEN ic.id WHEN t.type = 'EXPENSE' THEN ec.id END AS resolved_category_id,
         CASE WHEN t.type = 'INCOME' THEN ic.name WHEN t.type = 'EXPENSE' THEN ec.name END AS category_name
       FROM transaction_splits s
       INNER JOIN transactions t ON t.id = s.transaction_id
       LEFT JOIN income_categories ic ON t.type = 'INCOME' AND ic.id = s.category_id
       LEFT JOIN expense_categories ec ON t.type = 'EXPENSE' AND ec.id = s.category_id
       ORDER BY s.id`
    )
    .all()
    .map((row) => ({ ...row }));
}

test('classifies defaults by meaning and copies custom or ambiguous categories to both tables', () => {
  assert.deepEqual(
    classifyLegacyCategory(legacyCategory({ id: 'cat_inc_salary', name: 'Salario / Nómina', type: 'INCOME', is_default: 1 })),
    ['INCOME']
  );
  assert.deepEqual(
    classifyLegacyCategory(legacyCategory({ id: 'cat_exp_housing', name: 'Vivienda y Alquiler', type: 'EXPENSE', is_default: 1 })),
    ['EXPENSE']
  );
  assert.deepEqual(classifyLegacyCategory(legacyCategory()), ['INCOME', 'EXPENSE']);
  assert.deepEqual(
    classifyLegacyCategory(legacyCategory({ id: 'custom-default', name: 'Categoría dudosa', is_default: 1 })),
    ['INCOME', 'EXPENSE']
  );
});

test('assigns new default colors without overwriting an explicitly chosen color', () => {
  const rows = assignCategoryPaletteColors('EXPENSE', [
    {
      id: 'cat_exp_housing',
      name: 'Vivienda y Alquiler',
      color: '#EF4444',
      is_default: 1,
    },
    {
      id: 'cat_exp_food',
      name: 'Alimentación y Supermercado',
      color: '#123456',
      is_default: 1,
    },
    {
      id: 'cat_custom',
      name: 'Personalizada elegida',
      color: '#654321',
      is_default: 0,
    },
    {
      id: 'cat_custom_empty',
      name: 'Personalizada sin color',
      color: null,
      is_default: 0,
    },
  ]);

  assert.equal(rows[0]?.color, '#B42222');
  assert.equal(rows[1]?.color, '#123456');
  assert.equal(rows[2]?.color, '#654321');
  assert.equal(rows[3]?.color, '#D9B526');
  assert.equal(new Set(rows.map((row) => row.color)).size, rows.length);
});

test('builds a migration plan that preserves ids and copies custom rows to both types', () => {
  const plan = buildCategoryMigrationPlan([
    legacyCategory(),
    legacyCategory({
      id: 'cat_exp_food',
      name: 'Alimentación y Supermercado',
      type: 'EXPENSE',
      is_default: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    }),
  ]);

  assert.equal(plan.income.length, 1);
  assert.equal(plan.expense.length, 2);
  assert.equal(plan.income[0].id, 'cat_custom');
  assert.equal(plan.expense.find((row) => row.id === 'cat_custom')?.id, 'cat_custom');
  assert.equal(plan.expense.find((row) => row.id === 'cat_exp_food')?.created_at, '2026-01-01T00:00:00.000Z');
});

test('rolls back the whole migration if a step fails', async () => {
  const { raw, db } = createLegacyDb();
  const categoriesBefore = count(raw, 'categories');
  const splitsBefore = readSplits(raw);
  raw.exec('CREATE TABLE categories_backup_v1 (id TEXT PRIMARY KEY)');

  await assert.rejects(() => migrateCategories(db, migratedAt));

  assert.equal(count(raw, 'categories'), categoriesBefore);
  assert.deepEqual(readSplits(raw), splitsBefore);
  const migratedTable = raw
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'income_categories'")
    .get();
  assert.equal(migratedTable, undefined);
});

test('repairs legacy colors on already separated tables and preserves chosen colors', async () => {
  const { raw, db } = createLegacyDb();
  await migrateCategories(db, migratedAt);

  raw.exec(`
    UPDATE income_categories SET color = '#10B981' WHERE id = 'cat_inc_salary';
    UPDATE income_categories SET color = NULL WHERE id = 'cat_inc_other';
    UPDATE income_categories SET color = '#123456' WHERE id = 'cat_custom';
    UPDATE expense_categories SET color = '#8B5CF6' WHERE id = 'cat_exp_entertainment';
    UPDATE expense_categories SET color = '#654321' WHERE id = 'cat_custom';
  `);

  await migrateCategories(db, migratedAt);

  const incomeColors = new Map(
    readCategoryColors(raw, 'income_categories').map((row) => [row.id, row.color])
  );
  const expenseColors = new Map(
    readCategoryColors(raw, 'expense_categories').map((row) => [row.id, row.color])
  );

  assert.equal(incomeColors.get('cat_inc_salary'), '#2767B0');
  assert.equal(incomeColors.get('cat_inc_other'), '#2799B0');
  assert.equal(incomeColors.get('cat_custom'), '#123456');
  assert.equal(expenseColors.get('cat_exp_entertainment'), '#B42266');
  assert.equal(expenseColors.get('cat_custom'), '#654321');
});

test('migrates a database with movements without losing categories and is idempotent', async () => {
  const { raw, db } = createLegacyDb();
  const splitsBefore = readSplits(raw);
  const categoriesBefore = count(raw, 'categories');

  await migrateCategories(db, migratedAt);

  const legacyTable = raw
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'categories'")
    .get();
  assert.equal(legacyTable, undefined);
  assert.equal(count(raw, 'categories_backup_v1'), categoriesBefore);
  assert.equal(count(raw, 'income_categories'), 5);
  assert.equal(count(raw, 'expense_categories'), 8);
  assert.equal(count(raw, 'transaction_splits'), splitsBefore.length);
  assert.deepEqual(readSplits(raw), splitsBefore);

  const customCounts = raw
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM income_categories WHERE id = 'cat_custom') AS income,
         (SELECT COUNT(*) FROM expense_categories WHERE id = 'cat_custom') AS expense`
    )
    .get();
  assert.deepEqual({ ...customCounts }, { income: 1, expense: 1 });

  const defaultsById = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));
  for (const [table, type] of [
    ['income_categories', 'INCOME'],
    ['expense_categories', 'EXPENSE'],
  ]) {
    const colors = readCategoryColors(raw, table);
    const colorByCategory = new Map(colors.map((row) => [row.id, row.color]));

    const defaultColors = [];
    for (const [id, category] of defaultsById) {
      if (category.type !== type) continue;
      const color = colorByCategory.get(id);
      assert.equal(color, category.color);
      assert.ok(isPaletteColor(type, color));
      defaultColors.push(color);
    }
    assert.equal(new Set(defaultColors).size, defaultColors.length);

    assert.equal(colorByCategory.get('cat_custom'), '#123456');
  }

  const resolved = resolvedSplits(raw);
  assert.equal(resolved.length, splitsBefore.length);
  for (const split of resolved) {
    assert.equal(split.resolved_category_id, split.category_id);
    assert.ok(split.category_name);
  }

  const foreignKeys = raw.prepare('PRAGMA foreign_key_list(transaction_splits)').all();
  assert.equal(foreignKeys.some((foreignKey) => foreignKey.table === 'categories'), false);
  assert.deepEqual(raw.prepare('PRAGMA foreign_key_check').all(), []);

  const splitIndexes = raw
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'transaction_splits' AND name LIKE 'idx_%'")
    .all()
    .map((row) => row.name)
    .sort();
  assert.deepEqual(splitIndexes, [
    'idx_splits_account',
    'idx_splits_category',
    'idx_splits_tx',
  ]);

  await seedDefaultCategories(db);
  const afterSeed = categoryCounts(raw);
  const colorsAfterSeed = {
    income: readCategoryColors(raw, 'income_categories'),
    expense: readCategoryColors(raw, 'expense_categories'),
  };
  assert.deepEqual(afterSeed, {
    income: 5,
    expense: 8,
    backup: categoriesBefore,
    splits: splitsBefore.length,
  });

  await migrateCategories(db, migratedAt);
  await seedDefaultCategories(db);

  assert.deepEqual(categoryCounts(raw), afterSeed);
  assert.deepEqual(readCategoryColors(raw, 'income_categories'), colorsAfterSeed.income);
  assert.deepEqual(readCategoryColors(raw, 'expense_categories'), colorsAfterSeed.expense);
  assert.deepEqual(readSplits(raw), splitsBefore);
  assert.deepEqual(resolvedSplits(raw), resolved);
});
