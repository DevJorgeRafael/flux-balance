import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { serializeBackup } from '../../core/services/backup-format.ts';
import { parseBackupText } from '../../core/services/backup-validation.ts';
import { buildBackupFromDatabase } from '../database/backup.ts';
import { BASELINE_DDL } from '../database/migrations/001_baseline.ts';
import { REMINDERS_DDL } from '../database/migrations/003_reminders.ts';
import { SqliteTransactionRepository } from './SqliteTransactionRepository.ts';

function createDatabase() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(BASELINE_DDL);
  raw.exec(REMINDERS_DDL);
  raw.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');

  const api = () => ({
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params = []) { return raw.prepare(sql).run(...params); },
    async getFirstAsync(sql, params = []) {
      return raw.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, params = []) { return raw.prepare(sql).all(...params); },
  });
  const db = {
    ...api(),
    async withExclusiveTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task(api());
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };

  raw.prepare(
    `INSERT INTO accounts (id, name, type, balance, currency)
     VALUES ('acc-origin', 'Origen', 'CHECKING', 500, 'USD')`
  ).run();
  raw.prepare(
    `INSERT INTO accounts (id, name, type, balance, currency)
     VALUES ('acc-target', 'Destino', 'FLEXIBLE_SAVINGS', 200, 'USD')`
  ).run();

  return {
    raw,
    db,
    repository: new SqliteTransactionRepository(() => Promise.resolve(db)),
  };
}

function balance(raw, id) {
  return raw.prepare('SELECT balance FROM accounts WHERE id = ?').get(id).balance;
}

function transferDraft() {
  return {
    type: 'TRANSFER',
    totalAmount: 150,
    date: '2026-02-01T09:00:00.000Z',
    description: 'Mover a ahorro',
    splits: [
      { accountId: 'acc-origin', amount: 150 },
      { accountId: 'acc-target', amount: 150 },
    ],
  };
}

test('crear una transferencia descuenta del origen y abona en el destino', async () => {
  const { raw, repository } = createDatabase();

  const created = await repository.createWithSplits(transferDraft());

  assert.equal(created.type, 'TRANSFER');
  assert.deepEqual(
    created.splits.map((split) => split.accountId),
    ['acc-origin', 'acc-target']
  );
  assert.equal(balance(raw, 'acc-origin'), 350);
  assert.equal(balance(raw, 'acc-target'), 350);
});

test('borrar una transferencia revierte ambos saldos', async () => {
  const { raw, repository } = createDatabase();
  const created = await repository.createWithSplits(transferDraft());

  await repository.delete(created.id);

  assert.equal(balance(raw, 'acc-origin'), 500);
  assert.equal(balance(raw, 'acc-target'), 200);
  assert.equal(
    raw.prepare('SELECT COUNT(*) AS count FROM transactions').get().count,
    0
  );
});

test('rechaza una transferencia entre la misma cuenta sin cambiar saldos', async () => {
  const { raw, repository } = createDatabase();
  const invalid = transferDraft();
  invalid.splits[1].accountId = 'acc-origin';

  await assert.rejects(() => repository.createWithSplits(invalid), /transferencia/);

  assert.equal(balance(raw, 'acc-origin'), 500);
  assert.equal(balance(raw, 'acc-target'), 200);
  assert.equal(
    raw.prepare('SELECT COUNT(*) AS count FROM transactions').get().count,
    0
  );
});

test('un respaldo conserva la transferencia y el orden de sus cuentas', async () => {
  const { db, repository } = createDatabase();
  await repository.createWithSplits(transferDraft());

  const data = await buildBackupFromDatabase(db);
  const backup = {
    format: 'flux-balance-backup',
    schemaVersion: 2,
    appVersion: '2.2.5',
    exportedAt: '2026-02-01T10:00:00.000Z',
    currency: 'USD',
    ...data,
  };
  const parsed = parseBackupText(serializeBackup(backup));

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const transfer = parsed.backup.transactions.find((tx) => tx.type === 'TRANSFER');
  assert.equal(transfer?.totalAmount, 150);
  assert.deepEqual(
    transfer?.splits.map((split) => split.accountId),
    ['acc-origin', 'acc-target']
  );
});

test('las transferencias no se pueden editar', async () => {
  const { repository } = createDatabase();
  const created = await repository.createWithSplits(transferDraft());

  await assert.rejects(
    () => repository.updateWithSplits(created.id, transferDraft()),
    /typeNotEditable|no se puede editar/
  );
});
