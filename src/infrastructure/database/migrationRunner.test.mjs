import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { runMigrations } from './migrationRunner.ts';
import { BASELINE_DDL } from './migrations/001_baseline.ts';

function createDatabase() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');

  const db = {
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params = []) {
      const statement = raw.prepare(sql);
      const result = Array.isArray(params)
        ? statement.run(...params)
        : statement.run(params);
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: Number(result.changes),
      };
    },
    async getFirstAsync(sql, params = []) {
      const statement = raw.prepare(sql);
      const row = Array.isArray(params)
        ? statement.get(...params)
        : statement.get(params);
      return row ?? null;
    },
    async getAllAsync(sql, params = []) {
      const statement = raw.prepare(sql);
      return Array.isArray(params)
        ? statement.all(...params)
        : statement.all(params);
    },
    async withExclusiveTransactionAsync(task) {
      raw.exec('BEGIN EXCLUSIVE');
      try {
        await task(db);
        raw.exec('COMMIT');
      } catch (error) {
        try {
          raw.exec('ROLLBACK');
        } catch {
          // SQLite pudo haber revertido ya la transacción.
        }
        throw error;
      }
    },
  };

  return { raw, db };
}

function userVersion(raw) {
  return raw.prepare('PRAGMA user_version').get().user_version;
}

function foreignKeys(raw) {
  return raw.prepare('PRAGMA foreign_keys').get().foreign_keys;
}

function tableExists(raw, table) {
  const row = raw
    .prepare(
      "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?"
    )
    .get(table);
  return Boolean(row);
}

function tableNames(raw) {
  return raw
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all()
    .map((row) => row.name);
}

function count(raw, table) {
  return raw.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function createLegacyDatabase() {
  const { raw, db } = createDatabase();

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
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT CHECK(type IN ('INCOME', 'EXPENSE', 'TRANSFER')) NOT NULL,
      total_amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  `);

  const insertCategory = raw.prepare(`
    INSERT INTO categories (id, name, type, icon, color, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCategory.run(
    'cat_inc_salary',
    'Salario / Nómina',
    'INCOME',
    'briefcase',
    '#2767B0',
    1,
    '2026-01-01T00:00:00.000Z'
  );
  insertCategory.run(
    'cat_exp_food',
    'Alimentación y Supermercado',
    'EXPENSE',
    'shopping-cart',
    '#B45D22',
    1,
    '2026-01-01T00:00:00.000Z'
  );
  insertCategory.run(
    'cat_custom',
    'Categoría personalizada',
    'EXPENSE',
    'star',
    '#123456',
    0,
    '2026-02-02T00:00:00.000Z'
  );

  raw
    .prepare('INSERT INTO accounts (id, name, type) VALUES (?, ?, ?)')
    .run('account-1', 'Cuenta principal', 'CHECKING');
  const insertTransaction = raw.prepare(
    'INSERT INTO transactions (id, type, total_amount, date) VALUES (?, ?, ?, ?)'
  );
  insertTransaction.run('tx-income', 'INCOME', 100, '2026-01-10');
  insertTransaction.run('tx-expense', 'EXPENSE', 40, '2026-01-11');

  const insertSplit = raw.prepare(`
    INSERT INTO transaction_splits
      (id, transaction_id, account_id, category_id, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSplit.run(
    'split-income',
    'tx-income',
    'account-1',
    'cat_inc_salary',
    100,
    null
  );
  insertSplit.run(
    'split-expense',
    'tx-expense',
    'account-1',
    'cat_exp_food',
    40,
    null
  );

  return { raw, db };
}

test('instalación nueva termina en user_version 3 y crea todas las tablas', async () => {
  const { raw, db } = createDatabase();

  await runMigrations(db);

  assert.equal(userVersion(raw), 3);
  assert.deepEqual(tableNames(raw), [
    'accounts',
    'app_settings',
    'expense_categories',
    'fixed_term_deposits',
    'income_categories',
    'reminders',
    'transaction_splits',
    'transactions',
  ]);
  assert.equal(tableExists(raw, 'categories'), false);
  assert.equal(tableExists(raw, 'categories_backup_v1'), false);
  assert.equal(foreignKeys(raw), 1);
});

test('base en versión 0 con esquema actual y filas migra sin perder datos', async () => {
  const { raw, db } = createDatabase();
  raw.exec(BASELINE_DDL);

  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('account-1', 'Cuenta principal', 'CHECKING', 250.5, 'USD');
  raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, description, date)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('tx-1', 'EXPENSE', 25, 'Compra', '2026-01-15');
  raw
    .prepare(
      `INSERT INTO expense_categories (id, name, is_default, sort_order)
       VALUES (?, ?, ?, ?)`
    )
    .run('cat_exp_food', 'Alimentación y Supermercado', 1, 1);
  raw
    .prepare(
      `INSERT INTO transaction_splits
         (id, transaction_id, account_id, category_id, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run('split-1', 'tx-1', 'account-1', 'cat_exp_food', 25, 'nota');

  assert.equal(userVersion(raw), 0);

  await runMigrations(db);

  assert.equal(userVersion(raw), 3);
  assert.equal(count(raw, 'accounts'), 1);
  assert.equal(count(raw, 'transactions'), 1);
  assert.equal(count(raw, 'transaction_splits'), 1);
  assert.equal(count(raw, 'expense_categories'), 1);
  assert.equal(
    raw.prepare('SELECT name, balance FROM accounts').get().name,
    'Cuenta principal'
  );
  assert.equal(
    raw.prepare('SELECT balance FROM accounts').get().balance,
    250.5
  );
  assert.equal(
    raw.prepare('SELECT description FROM transactions').get().description,
    'Compra'
  );
  assert.equal(
    raw.prepare('SELECT notes FROM transaction_splits').get().notes,
    'nota'
  );
  assert.equal(tableExists(raw, 'app_settings'), true);
  assert.deepEqual(raw.prepare('PRAGMA foreign_key_check').all(), []);
});

test('base con tabla legacy categories crea el respaldo y migra las categorías', async () => {
  const { raw, db } = createLegacyDatabase();

  await runMigrations(db);

  assert.equal(userVersion(raw), 3);
  assert.equal(tableExists(raw, 'categories'), false);
  assert.equal(tableExists(raw, 'categories_backup_v1'), true);
  assert.equal(count(raw, 'categories_backup_v1'), 3);
  assert.equal(count(raw, 'income_categories'), 2);
  assert.equal(count(raw, 'expense_categories'), 2);
  assert.equal(count(raw, 'transaction_splits'), 2);
  assert.deepEqual(
    raw
      .prepare('SELECT id FROM transaction_splits ORDER BY id')
      .all()
      .map((row) => row.id),
    ['split-expense', 'split-income']
  );
  assert.equal(
    raw
      .prepare('SELECT COUNT(*) AS count FROM income_categories WHERE id = ?')
      .get('cat_custom').count,
    1
  );
  assert.equal(
    raw
      .prepare('SELECT COUNT(*) AS count FROM expense_categories WHERE id = ?')
      .get('cat_custom').count,
    1
  );
  const foreignKeysList = raw
    .prepare('PRAGMA foreign_key_list(transaction_splits)')
    .all();
  assert.equal(
    foreignKeysList.some((foreignKey) => foreignKey.table === 'categories'),
    false
  );
  assert.equal(tableExists(raw, 'app_settings'), true);
  assert.deepEqual(raw.prepare('PRAGMA foreign_key_check').all(), []);
});

test('una migración que falla después de un CREATE TABLE no avanza la versión ni deja la tabla', async () => {
  const { raw, db } = createDatabase();
  await runMigrations(db);
  assert.equal(userVersion(raw), 3);

  const failingMigration = {
    version: 4,
    name: 'falla_despues_de_crear',
    up: async (txn) => {
      await txn.execAsync(
        'CREATE TABLE migracion_fallida (id TEXT PRIMARY KEY NOT NULL)'
      );
      throw new Error('fallo intencional');
    },
  };

  await assert.rejects(
    () => runMigrations(db, [failingMigration]),
    /fallo intencional/
  );

  assert.equal(userVersion(raw), 3);
  assert.equal(tableExists(raw, 'migracion_fallida'), false);
});

test('una migración con requiresForeignKeysOff que falla reactiva foreign_keys', async () => {
  const { raw, db } = createDatabase();

  const failingMigration = {
    version: 1,
    name: 'falla_con_fk_off',
    requiresForeignKeysOff: true,
    up: async () => {
      throw new Error('fallo con claves desactivadas');
    },
  };

  await assert.rejects(
    () => runMigrations(db, [failingMigration]),
    /fallo con claves desactivadas/
  );

  assert.equal(userVersion(raw), 0);
  assert.equal(foreignKeys(raw), 1);
});

test('foreign_key_check advierte por consola y no bloquea el arranque con filas huérfanas', async () => {
  const { raw, db } = createDatabase();
  raw.exec(BASELINE_DDL);
  raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, date)
       VALUES (?, ?, ?, ?)`
    )
    .run('tx-1', 'EXPENSE', 10, '2026-01-15');
  raw.exec('PRAGMA foreign_keys = OFF;');
  raw
    .prepare(
      `INSERT INTO transaction_splits
         (id, transaction_id, account_id, category_id, amount)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('split-huerfano', 'tx-1', 'cuenta-inexistente', 'cat', 10);
  raw.exec('PRAGMA foreign_keys = ON;');

  assert.equal(userVersion(raw), 0);

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };

  try {
    await runMigrations(db);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(userVersion(raw), 3);
  assert.equal(count(raw, 'transaction_splits'), 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /1 fila\(s\) inválida\(s\)/);
  assert.match(warnings[0], /transaction_splits/);
});

test('ejecutar runMigrations dos veces no vuelve a aplicar migraciones', async () => {
  const { raw, db } = createDatabase();
  let applied = 0;

  const spyMigration = {
    version: 1,
    name: 'spy',
    up: async (txn) => {
      applied += 1;
      await txn.execAsync(
        'CREATE TABLE migracion_espia (id TEXT PRIMARY KEY NOT NULL)'
      );
    },
  };

  await runMigrations(db, [spyMigration]);
  await runMigrations(db, [spyMigration]);

  assert.equal(applied, 1);
  assert.equal(userVersion(raw), 1);
  assert.equal(tableExists(raw, 'migracion_espia'), true);
});
