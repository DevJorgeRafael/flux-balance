import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { SCHEMA_DDL } from '../database/schema.sql.ts';
import { SqliteAccountRepository } from './SqliteAccountRepository.ts';
import { SqliteTransactionRepository } from './SqliteTransactionRepository.ts';

function createDatabase({ failOn } = {}) {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(SCHEMA_DDL);

  const createApi = () => ({
    async execAsync(sql) {
      if (failOn?.(sql)) throw new Error('forced failure');
      raw.exec(sql);
    },
    async runAsync(sql, params = []) {
      if (failOn?.(sql)) throw new Error('forced failure');
      return raw.prepare(sql).run(...params);
    },
    async getFirstAsync(sql, params = []) {
      if (failOn?.(sql)) throw new Error('forced failure');
      return raw.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, params = []) {
      if (failOn?.(sql)) throw new Error('forced failure');
      return raw.prepare(sql).all(...params);
    },
  });

  const db = {
    ...createApi(),
    async withExclusiveTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task(createApi());
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return { raw, db };
}

function failOnNth(fragment, target) {
  let matches = 0;
  return (sql) => {
    if (!sql.includes(fragment)) return false;
    matches += 1;
    return matches === target;
  };
}

function seedAccount(raw, id = 'acc-1', balance = 1000) {
  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES (?, ?, 'CHECKING', ?, 'USD')`
    )
    .run(id, 'Cuenta principal', balance);
}

function seedCategory(raw, type, id) {
  const table = type === 'INCOME' ? 'income_categories' : 'expense_categories';
  raw
    .prepare(`INSERT INTO ${table} (id, name) VALUES (?, ?)`)
    .run(id, id);
}

function count(raw, table) {
  return raw.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function getBalance(raw, id) {
  return raw.prepare('SELECT balance FROM accounts WHERE id = ?').get(id)?.balance;
}

test('getAll parametriza IDs con comillas, punto y coma y --', async () => {
  const { raw, db } = createDatabase();
  seedAccount(raw);
  seedCategory(raw, 'EXPENSE', 'cat-exp');

  const maliciousId = "tx') OR 1=1 --";
  const ids = [maliciousId, "tx'; DROP TABLE transactions; --", 'tx-normal'];
  const dates = ['2026-01-03', '2026-01-02', '2026-01-01'];
  const insertTransaction = raw.prepare(
    `INSERT INTO transactions (id, type, total_amount, date, created_at)
     VALUES (?, 'EXPENSE', ?, ?, ?)`
  );
  const insertSplit = raw.prepare(
    `INSERT INTO transaction_splits
       (id, transaction_id, account_id, category_id, amount)
     VALUES (?, ?, ?, ?, ?)`
  );

  ids.forEach((id, index) => {
    insertTransaction.run(id, 10 + index, dates[index], `${dates[index]}T00:00:00.000Z`);
    insertSplit.run(`split-${index}`, id, 'acc-1', 'cat-exp', 10 + index);
  });

  const repo = new SqliteTransactionRepository(async () => db);
  const [transaction] = await repo.getAll({ limit: 1 });

  assert.ok(transaction);
  assert.equal(transaction.id, maliciousId);
  assert.equal(transaction.splits.length, 1);
  assert.equal(transaction.splits[0].transactionId, maliciousId);
  assert.equal(count(raw, 'transactions'), 3);
});

test('createWithSplits revierte todo si falla una inserción intermedia', async () => {
  const { raw, db } = createDatabase({
    failOn: failOnNth('INSERT INTO transaction_splits', 2),
  });
  seedAccount(raw);
  seedCategory(raw, 'EXPENSE', 'cat-exp');

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(
    () =>
      repo.createWithSplits({
        type: 'EXPENSE',
        totalAmount: 30,
        description: 'Compra',
        date: '2026-01-02',
        splits: [
          { accountId: 'acc-1', categoryId: 'cat-exp', amount: 10 },
          { accountId: 'acc-1', categoryId: 'cat-exp', amount: 20 },
        ],
      }),
    /forced failure/
  );

  assert.equal(count(raw, 'transactions'), 0);
  assert.equal(count(raw, 'transaction_splits'), 0);
  assert.equal(getBalance(raw, 'acc-1'), 1000);
});

test('createWithSplits revierte si la cuenta no existe', async () => {
  const { raw, db } = createDatabase();
  seedCategory(raw, 'EXPENSE', 'cat-exp');

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(
    () =>
      repo.createWithSplits({
        type: 'EXPENSE',
        totalAmount: 10,
        description: 'Compra',
        date: '2026-01-02',
        splits: [{ accountId: 'acc-missing', categoryId: 'cat-exp', amount: 10 }],
      }),
    /La cuenta acc-missing no existe/
  );

  assert.equal(count(raw, 'transactions'), 0);
  assert.equal(count(raw, 'transaction_splits'), 0);
});

test('delete revierte saldos y conserva el movimiento si falla el DELETE', async () => {
  const { raw, db } = createDatabase({
    failOn: (sql) => sql.includes('DELETE FROM transactions'),
  });
  seedAccount(raw, 'acc-1', 900);
  seedCategory(raw, 'EXPENSE', 'cat-exp');
  raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, date, created_at)
       VALUES (?, 'EXPENSE', ?, ?, ?)`
    )
    .run('tx-1', 100, '2026-01-02', '2026-01-02T00:00:00.000Z');
  raw
    .prepare(
      `INSERT INTO transaction_splits
         (id, transaction_id, account_id, category_id, amount)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('split-1', 'tx-1', 'acc-1', 'cat-exp', 100);

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(() => repo.delete('tx-1'), /forced failure/);

  assert.equal(count(raw, 'transactions'), 1);
  assert.equal(count(raw, 'transaction_splits'), 1);
  assert.equal(getBalance(raw, 'acc-1'), 900);
});

test('create de cuenta con depósito inicial revierte cuenta y depósito si falla el saldo', async () => {
  const { raw, db } = createDatabase({
    failOn: (sql) => sql.includes('UPDATE accounts SET balance = balance + ?'),
  });
  const repo = new SqliteAccountRepository(async () => db);

  await assert.rejects(
    () =>
      repo.create({
        name: 'Plazo fijo',
        type: 'FIXED_TERM',
        initialFixedTermDeposit: {
          principalAmount: 500,
          annualRate: 0.1,
          termMonths: 3,
          startDate: '2026-01-01',
        },
      }),
    /forced failure/
  );

  assert.equal(count(raw, 'accounts'), 0);
  assert.equal(count(raw, 'fixed_term_deposits'), 0);
});

test('addFixedTermDeposit revierte si la cuenta no existe', async () => {
  const { raw, db } = createDatabase();
  const repo = new SqliteAccountRepository(async () => db);

  await assert.rejects(
    () =>
      repo.addFixedTermDeposit({
        accountId: 'acc-missing',
        principalAmount: 500,
        annualRate: 0.1,
        termMonths: 3,
        startDate: '2026-01-01',
      }),
    /La cuenta acc-missing no existe/
  );

  assert.equal(count(raw, 'fixed_term_deposits'), 0);
});

test('addFixedTermDeposit revierte depósito y saldo si falla la actualización', async () => {
  const { raw, db } = createDatabase({
    failOn: (sql) => sql.includes('UPDATE accounts SET balance = balance + ?'),
  });
  seedAccount(raw, 'acc-1', 1000);
  const repo = new SqliteAccountRepository(async () => db);

  await assert.rejects(
    () =>
      repo.addFixedTermDeposit({
        accountId: 'acc-1',
        principalAmount: 500,
        annualRate: 0.1,
        termMonths: 3,
        startDate: '2026-01-01',
      }),
    /forced failure/
  );

  assert.equal(count(raw, 'fixed_term_deposits'), 0);
  assert.equal(getBalance(raw, 'acc-1'), 1000);
});
