import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import {
  createExcelWorkbookBytes,
  parseExcelWorkbookBytes,
} from '../../core/services/backup-excel.ts';
import { createBackupFile, serializeBackup } from '../../core/services/backup-format.ts';
import { parseBackupText } from '../../core/services/backup-validation.ts';
import { buildBackupFromDatabase, importBackupIntoDatabase } from './backup.ts';
import { SCHEMA_DDL } from './schema.sql.ts';

const TIMESTAMP = '2026-01-02T10:00:00.000Z';

function createDatabase({ failOn, foreignKeys = true } = {}) {
  const raw = new DatabaseSync(':memory:');
  raw.exec(`PRAGMA foreign_keys = ${foreignKeys ? 'ON' : 'OFF'};`);
  raw.exec(SCHEMA_DDL);
  raw.exec(
    'CREATE TABLE app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
  );

  const db = {
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

function createBackupFixture() {
  return {
    format: 'flux-balance-backup',
    schemaVersion: 1,
    appVersion: '1.5.5',
    exportedAt: TIMESTAMP,
    currency: 'EUR',
    accounts: [
      {
        id: 'acc-1',
        name: 'Cuenta principal',
        type: 'CHECKING',
        balance: 975,
        currency: 'EUR',
        annualRate: null,
        isArchived: false,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        fixedTermDeposits: [
          {
            id: 'dep-1',
            accountId: 'acc-1',
            principalAmount: 500,
            annualRate: 0.4,
            termMonths: 3,
            startDate: '2026-01-01',
            maturityDate: '2026-04-01',
            status: 'ACTIVE',
            createdAt: TIMESTAMP,
          },
        ],
      },
      {
        id: 'acc-2',
        name: 'Ahorro archivado',
        type: 'FLEXIBLE_SAVINGS',
        balance: 300,
        currency: 'EUR',
        annualRate: 0.375,
        isArchived: true,
        createdAt: '2026-01-01T09:00:00.000Z',
        updatedAt: TIMESTAMP,
        fixedTermDeposits: [],
      },
    ],
    incomeCategories: [
      {
        id: 'cat-inc-1',
        name: 'Salario',
        type: 'INCOME',
        color: null,
        icon: null,
        isDefault: false,
        sortOrder: 0,
        createdAt: TIMESTAMP,
      },
    ],
    expenseCategories: [
      {
        id: 'cat-exp-1',
        name: 'Supermercado',
        type: 'EXPENSE',
        color: '#B45D22',
        icon: 'shopping-cart',
        isDefault: false,
        sortOrder: 0,
        createdAt: TIMESTAMP,
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        totalAmount: 25,
        description: 'Compra',
        date: '2026-01-02',
        createdAt: TIMESTAMP,
        splits: [
          {
            id: 'split-1',
            transactionId: 'tx-1',
            accountId: 'acc-1',
            categoryId: 'cat-exp-1',
            amount: 25,
            notes: 'Nota de compra',
          },
        ],
      },
      {
        id: 'tx-2',
        type: 'INCOME',
        totalAmount: 100,
        description: null,
        date: '2026-01-01',
        createdAt: '2026-01-01T09:00:00.000Z',
        splits: [
          {
            id: 'split-2',
            transactionId: 'tx-2',
            accountId: 'acc-2',
            categoryId: 'cat-inc-1',
            amount: 100,
            notes: null,
          },
        ],
      },
    ],
  };
}

function count(raw, table) {
  return raw.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function readSetting(raw, key) {
  return raw
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(key)?.value;
}

test('exportar, reiniciar e importar conserva todos los datos', async () => {
  const { raw, db } = createDatabase();
  const parsed = parseBackupText(JSON.stringify(createBackupFixture()));
  assert.equal(parsed.ok, true);

  await importBackupIntoDatabase(db, parsed.backup);
  const exported = await buildBackupFromDatabase(db);

  const backupFile = createBackupFile(exported, {
    appVersion: '1.5.5',
    exportedAt: TIMESTAMP,
    currency: 'EUR',
  });
  const serialized = serializeBackup(backupFile);
  const reimported = parseBackupText(serialized);
  assert.equal(reimported.ok, true);

  raw.exec(`
    DELETE FROM transaction_splits;
    DELETE FROM transactions;
    DELETE FROM fixed_term_deposits;
    DELETE FROM accounts;
    DELETE FROM income_categories;
    DELETE FROM expense_categories;
  `);
  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run('acc-extra', 'Dato viejo', 'CHECKING', 1, 'USD');
  raw
    .prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
    .run('currency', 'USD');
  raw
    .prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
    .run('themePreference', 'dark');

  await importBackupIntoDatabase(db, reimported.backup);
  const restored = await buildBackupFromDatabase(db);

  assert.deepEqual(restored, exported);
  assert.equal(count(raw, 'accounts'), 2);
  assert.equal(count(raw, 'fixed_term_deposits'), 1);
  assert.equal(count(raw, 'income_categories'), 1);
  assert.equal(count(raw, 'expense_categories'), 1);
  assert.equal(count(raw, 'transactions'), 2);
  assert.equal(count(raw, 'transaction_splits'), 2);
  assert.equal(readSetting(raw, 'currency'), 'EUR');
  assert.equal(readSetting(raw, 'themePreference'), 'dark');
});

test('revierte el reemplazo completo si falla una inserción', async () => {
  const { raw, db } = createDatabase();
  const parsed = parseBackupText(JSON.stringify(createBackupFixture()));
  assert.equal(parsed.ok, true);

  await importBackupIntoDatabase(db, parsed.backup);
  const before = await buildBackupFromDatabase(db);

  const invalidBackup = {
    ...parsed.backup,
    accounts: [
      ...parsed.backup.accounts,
      {
        ...parsed.backup.accounts[0],
        name: 'Cuenta duplicada',
      },
    ],
  };

  await assert.rejects(
    () => importBackupIntoDatabase(db, invalidBackup),
    /UNIQUE|constraint/i
  );

  const after = await buildBackupFromDatabase(db);

  assert.deepEqual(after, before);
  assert.equal(count(raw, 'accounts'), 2);
  assert.equal(count(raw, 'transactions'), 2);
  assert.equal(count(raw, 'transaction_splits'), 2);
});

test('rechaza backups con referencias inválidas aunque las foreign keys estén desactivadas', async () => {
  const { raw, db } = createDatabase({ foreignKeys: false });
  const fixture = createBackupFixture();
  fixture.transactions[0].splits[0].accountId = 'missing-account';
  const backupFile = createBackupFile(fixture, {
    appVersion: '1.5.5',
    exportedAt: TIMESTAMP,
    currency: 'EUR',
  });

  await assert.rejects(
    () => importBackupIntoDatabase(db, backupFile),
    /referencias inválidas/
  );

  assert.equal(count(raw, 'accounts'), 0);
  assert.equal(count(raw, 'transactions'), 0);
  assert.equal(count(raw, 'transaction_splits'), 0);
});

test('la importación desde Excel revierte si falla una inserción', async () => {
  const { raw, db } = createDatabase({
    failOn: (sql) => sql.includes('INSERT INTO transactions'),
  });
  const fixture = createBackupFixture();
  fixture.accounts[0] = {
    ...fixture.accounts[0],
    type: 'FIXED_TERM',
    annualRate: 0.25,
    fixedTermDeposits: fixture.accounts[0].fixedTermDeposits.map((deposit) => ({
      ...deposit,
      annualRate: 0.25,
    })),
  };
  const backupFile = createBackupFile(fixture, {
    appVersion: '1.5.5',
    exportedAt: TIMESTAMP,
    currency: 'EUR',
  });
  const bytes = createExcelWorkbookBytes(backupFile, 'es');
  const parsed = parseExcelWorkbookBytes(bytes, {
    language: 'es',
    appVersion: '1.5.5',
    fallbackCurrency: 'EUR',
    now: TIMESTAMP,
  });

  assert.equal(parsed.ok, true);

  await assert.rejects(
    () => importBackupIntoDatabase(db, parsed.backup),
    /forced failure/
  );

  assert.equal(count(raw, 'accounts'), 0);
  assert.equal(count(raw, 'fixed_term_deposits'), 0);
  assert.equal(count(raw, 'income_categories'), 0);
  assert.equal(count(raw, 'expense_categories'), 0);
  assert.equal(count(raw, 'transactions'), 0);
  assert.equal(count(raw, 'transaction_splits'), 0);
});
