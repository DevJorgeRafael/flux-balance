import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { BASELINE_DDL } from '../database/migrations/001_baseline.ts';
import { SqliteTransactionRepository } from './SqliteTransactionRepository.ts';

function createDatabase({ failOn } = {}) {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(BASELINE_DDL);

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

function seedAccount(raw, id, balance) {
  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES (?, ?, 'CHECKING', ?, 'USD')`
    )
    .run(id, id, balance);
}

function seedCategory(raw, type, id) {
  const table = type === 'INCOME' ? 'income_categories' : 'expense_categories';
  raw.prepare(`INSERT INTO ${table} (id, name) VALUES (?, ?)`).run(id, id);
}

function seedTransaction(raw, overrides = {}) {
  const {
    id = 'tx-1',
    type = 'EXPENSE',
    totalAmount = 100,
    description = 'Compra',
    date = '2026-01-02',
    createdAt = '2026-01-02T10:00:00.000Z',
    accountId = 'acc-1',
    categoryId = 'cat-exp',
    notes = null,
  } = overrides;

  raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, description, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, type, totalAmount, description, date, createdAt);
  raw
    .prepare(
      `INSERT INTO transaction_splits (id, transaction_id, account_id, category_id, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(`split-${id}`, id, accountId, categoryId, totalAmount, notes);
}

function getBalance(raw, id) {
  return raw.prepare('SELECT balance FROM accounts WHERE id = ?').get(id)?.balance;
}

function getTransaction(raw, id) {
  return raw.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
}

function getSplits(raw, id) {
  return raw
    .prepare('SELECT * FROM transaction_splits WHERE transaction_id = ? ORDER BY id')
    .all(id);
}

test('updateWithSplits mueve el saldo entre cuentas y conserva identidad y notas', async () => {
  const { raw, db } = createDatabase();
  seedAccount(raw, 'acc-1', 900);
  seedAccount(raw, 'acc-2', 500);
  seedCategory(raw, 'EXPENSE', 'cat-exp');
  seedTransaction(raw, { notes: 'nota original' });

  const repo = new SqliteTransactionRepository(async () => db);
  const updated = await repo.updateWithSplits('tx-1', {
    type: 'EXPENSE',
    totalAmount: 40,
    description: 'Compra editada',
    date: '2026-01-02',
    splits: [{ accountId: 'acc-2', categoryId: 'cat-exp', amount: 40 }],
  });

  assert.equal(updated.id, 'tx-1');
  assert.equal(updated.createdAt, '2026-01-02T10:00:00.000Z');
  assert.equal(updated.date, '2026-01-02');
  assert.equal(updated.totalAmount, 40);
  assert.equal(updated.description, 'Compra editada');
  assert.equal(updated.splits.length, 1);
  assert.equal(updated.splits[0].accountId, 'acc-2');
  assert.equal(updated.splits[0].notes, 'nota original');
  assert.equal(getBalance(raw, 'acc-1'), 1000);
  assert.equal(getBalance(raw, 'acc-2'), 460);
  assert.equal(getTransaction(raw, 'tx-1').total_amount, 40);
});

test('updateWithSplits cambia un gasto a ingreso y ajusta el saldo', async () => {
  const { raw, db } = createDatabase();
  seedAccount(raw, 'acc-1', 900);
  seedCategory(raw, 'INCOME', 'cat-inc');
  seedTransaction(raw);

  const repo = new SqliteTransactionRepository(async () => db);
  const updated = await repo.updateWithSplits('tx-1', {
    type: 'INCOME',
    totalAmount: 100,
    description: 'Compra',
    date: '2026-01-02',
    splits: [{ accountId: 'acc-1', categoryId: 'cat-inc', amount: 100 }],
  });

  assert.equal(updated.type, 'INCOME');
  assert.equal(updated.splits[0].categoryId, 'cat-inc');
  assert.equal(getBalance(raw, 'acc-1'), 1100);
});

test('updateWithSplits revierte saldos y datos si la cuenta no existe', async () => {
  const { raw, db } = createDatabase();
  seedAccount(raw, 'acc-1', 900);
  seedCategory(raw, 'EXPENSE', 'cat-exp');
  seedTransaction(raw, { notes: 'nota original' });

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(
    () =>
      repo.updateWithSplits('tx-1', {
        type: 'EXPENSE',
        totalAmount: 40,
        description: 'Compra editada',
        date: '2026-01-02',
        splits: [{ accountId: 'acc-missing', categoryId: 'cat-exp', amount: 40 }],
      }),
    /La cuenta acc-missing no existe/
  );

  assert.equal(getBalance(raw, 'acc-1'), 900);
  assert.equal(getTransaction(raw, 'tx-1').total_amount, 100);
  assert.equal(getTransaction(raw, 'tx-1').description, 'Compra');
  const splits = getSplits(raw, 'tx-1');
  assert.equal(splits.length, 1);
  assert.equal(splits[0].account_id, 'acc-1');
  assert.equal(splits[0].amount, 100);
  assert.equal(splits[0].notes, 'nota original');
});

test('updateWithSplits revierte todo si falla la inserción de la nueva división', async () => {
  const { raw, db } = createDatabase({
    failOn: (sql) => sql.includes('INSERT INTO transaction_splits'),
  });
  seedAccount(raw, 'acc-1', 900);
  seedAccount(raw, 'acc-2', 500);
  seedCategory(raw, 'EXPENSE', 'cat-exp');
  seedTransaction(raw);

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(
    () =>
      repo.updateWithSplits('tx-1', {
        type: 'EXPENSE',
        totalAmount: 40,
        description: 'Compra editada',
        date: '2026-01-02',
        splits: [{ accountId: 'acc-2', categoryId: 'cat-exp', amount: 40 }],
      }),
    /forced failure/
  );

  assert.equal(getBalance(raw, 'acc-1'), 900);
  assert.equal(getBalance(raw, 'acc-2'), 500);
  assert.equal(getTransaction(raw, 'tx-1').total_amount, 100);
  const splits = getSplits(raw, 'tx-1');
  assert.equal(splits.length, 1);
  assert.equal(splits[0].account_id, 'acc-1');
});

test('updateWithSplits rechaza una categoría que no pertenece al tipo', async () => {
  const { raw, db } = createDatabase();
  seedAccount(raw, 'acc-1', 900);
  seedCategory(raw, 'INCOME', 'cat-inc');
  seedTransaction(raw);

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(
    () =>
      repo.updateWithSplits('tx-1', {
        type: 'EXPENSE',
        totalAmount: 100,
        description: 'Compra',
        date: '2026-01-02',
        splits: [{ accountId: 'acc-1', categoryId: 'cat-inc', amount: 100 }],
      }),
    /La categoría cat-inc no existe/
  );

  assert.equal(getBalance(raw, 'acc-1'), 900);
  assert.equal(getTransaction(raw, 'tx-1').total_amount, 100);
});

test('updateWithSplits bloquea transferencias y movimientos divididos', async () => {
  const { raw, db } = createDatabase();
  seedAccount(raw, 'acc-1', 900);
  seedAccount(raw, 'acc-2', 500);
  seedCategory(raw, 'EXPENSE', 'cat-exp');
  seedTransaction(raw, { type: 'TRANSFER' });

  const repo = new SqliteTransactionRepository(async () => db);

  await assert.rejects(
    () =>
      repo.updateWithSplits('tx-1', {
        type: 'EXPENSE',
        totalAmount: 100,
        description: 'Compra',
        date: '2026-01-02',
        splits: [{ accountId: 'acc-1', categoryId: 'cat-exp', amount: 100 }],
      }),
    /no se puede editar/
  );

  raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, description, date, created_at)
       VALUES ('tx-split', 'EXPENSE', 100, 'Dividido', '2026-01-03', '2026-01-03T10:00:00.000Z')`
    )
    .run();
  raw
    .prepare(
      `INSERT INTO transaction_splits (id, transaction_id, account_id, category_id, amount)
       VALUES ('split-a', 'tx-split', 'acc-1', 'cat-exp', 50),
              ('split-b', 'tx-split', 'acc-2', 'cat-exp', 50)`
    )
    .run();

  await assert.rejects(
    () =>
      repo.updateWithSplits('tx-split', {
        type: 'EXPENSE',
        totalAmount: 100,
        description: 'Dividido',
        date: '2026-01-03',
        splits: [{ accountId: 'acc-1', categoryId: 'cat-exp', amount: 100 }],
      }),
    /no se puede editar/
  );

  assert.equal(getSplits(raw, 'tx-split').length, 2);
  assert.equal(getBalance(raw, 'acc-1'), 900);
  assert.equal(getBalance(raw, 'acc-2'), 500);
});
