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
      return (
        (Array.isArray(params)
          ? statement.get(...params)
          : statement.get(params)) ?? null
      );
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

function tableExists(raw, table) {
  return Boolean(
    raw
      .prepare(
        "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?"
      )
      .get(table)
  );
}

function indexNames(raw, table) {
  return raw
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'index' AND tbl_name = ? AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all(table)
    .map((row) => row.name);
}

function insertReminder(raw, overrides = {}) {
  const reminder = {
    id: 'rem-1',
    title: 'Pago de luz',
    type: 'EXPENSE',
    description: null,
    amount: null,
    account_id: null,
    category_id: null,
    recurrence: 'MONTHLY',
    time: '09:00',
    start_date: '2026-01-31',
    next_run_at: '2026-01-31T15:00:00.000Z',
    is_archived: 0,
    last_notified_at: null,
    ...overrides,
  };

  raw
    .prepare(
      `INSERT INTO reminders
         (id, title, type, description, amount, account_id, category_id,
          recurrence, time, start_date, next_run_at, is_archived,
          last_notified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      reminder.id,
      reminder.title,
      reminder.type,
      reminder.description,
      reminder.amount,
      reminder.account_id,
      reminder.category_id,
      reminder.recurrence,
      reminder.time,
      reminder.start_date,
      reminder.next_run_at,
      reminder.is_archived,
      reminder.last_notified_at
    );
}

test('una instalación nueva termina en user_version 3 con la tabla reminders', async () => {
  const { raw, db } = createDatabase();

  await runMigrations(db);

  assert.equal(userVersion(raw), 3);
  assert.equal(tableExists(raw, 'reminders'), true);
  assert.deepEqual(indexNames(raw, 'reminders'), [
    'idx_reminders_account',
    'idx_reminders_category',
    'idx_reminders_due',
  ]);

  const foreignKeys = raw.prepare('PRAGMA foreign_key_list(reminders)').all();
  assert.equal(foreignKeys.length, 1);
  assert.equal(foreignKeys[0].from, 'account_id');
  assert.equal(foreignKeys[0].table, 'accounts');
  assert.equal(foreignKeys[0].on_delete, 'SET NULL');
});

test('una base en user_version 2 migra a 3 sin perder datos', async () => {
  const { raw, db } = createDatabase();
  raw.exec(BASELINE_DDL);
  raw.exec(
    'CREATE TABLE app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
  );
  raw.exec('PRAGMA user_version = 2;');
  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES ('acc-1', 'Cuenta principal', 'CHECKING', 100, 'USD')`
    )
    .run();
  raw
    .prepare(
      `INSERT INTO expense_categories (id, name, is_default, sort_order)
       VALUES ('cat-exp', 'Servicios', 1, 0)`
    )
    .run();

  await runMigrations(db);

  assert.equal(userVersion(raw), 3);
  assert.equal(tableExists(raw, 'reminders'), true);
  assert.equal(
    raw.prepare('SELECT name FROM accounts WHERE id = ?').get('acc-1').name,
    'Cuenta principal'
  );
  assert.equal(
    raw
      .prepare('SELECT name FROM expense_categories WHERE id = ?')
      .get('cat-exp').name,
    'Servicios'
  );
});

test('la tabla reminders aplica CHECKs y ON DELETE SET NULL', async () => {
  const { raw, db } = createDatabase();
  await runMigrations(db);

  insertReminder(raw, { id: 'rem-valid' });

  assert.throws(
    () => insertReminder(raw, { id: 'rem-type', type: 'TRANSFER' }),
    /CHECK constraint failed/
  );
  assert.throws(
    () => insertReminder(raw, { id: 'rem-recurrence', recurrence: 'YEARLY' }),
    /CHECK constraint failed/
  );
  assert.throws(
    () => insertReminder(raw, { id: 'rem-time', time: '24:00' }),
    /CHECK constraint failed/
  );
  assert.throws(
    () => insertReminder(raw, { id: 'rem-date', start_date: '2026-13-01' }),
    /CHECK constraint failed/
  );
  assert.throws(
    () => insertReminder(raw, { id: 'rem-amount', amount: 0 }),
    /CHECK constraint failed/
  );
  assert.throws(
    () =>
      insertReminder(raw, {
        id: 'rem-no-next',
        next_run_at: null,
        is_archived: 0,
      }),
    /CHECK constraint failed/
  );

  insertReminder(raw, { id: 'rem-once', recurrence: 'ONCE', next_run_at: null });
  insertReminder(raw, {
    id: 'rem-archived',
    recurrence: 'MONTHLY',
    next_run_at: null,
    is_archived: 1,
  });

  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES ('acc-1', 'Cuenta principal', 'CHECKING', 100, 'USD')`
    )
    .run();
  insertReminder(raw, { id: 'rem-account', account_id: 'acc-1' });

  raw.prepare('DELETE FROM accounts WHERE id = ?').run('acc-1');

  assert.equal(
    raw
      .prepare('SELECT account_id FROM reminders WHERE id = ?')
      .get('rem-account').account_id,
    null
  );
});
