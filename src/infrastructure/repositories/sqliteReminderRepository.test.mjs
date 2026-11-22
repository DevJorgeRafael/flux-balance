import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import {
  MAX_AMOUNT,
  MAX_REMINDER_TITLE_LENGTH,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '../../core/constants/inputLimits.ts';
import { BASELINE_DDL } from '../database/migrations/001_baseline.ts';
import { REMINDERS_DDL } from '../database/migrations/003_reminders.ts';
import {
  ReminderValidationError,
  SqliteReminderRepository,
} from './SqliteReminderRepository.ts';

const FIXED_NOW = new Date(2026, 0, 1, 8, 0, 0, 0);

function createDatabase() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(BASELINE_DDL);
  raw.exec(REMINDERS_DDL);
  raw
    .prepare(
      `INSERT INTO accounts (id, name, type, balance, currency)
       VALUES ('acc-1', 'Cuenta principal', 'CHECKING', 1000, 'USD')`
    )
    .run();
  raw
    .prepare(
      `INSERT INTO expense_categories (id, name, is_default, sort_order)
       VALUES ('cat-expense', 'Servicios', 1, 0)`
    )
    .run();
  raw
    .prepare(
      `INSERT INTO income_categories (id, name, is_default, sort_order)
       VALUES ('cat-income', 'Salario', 1, 0)`
    )
    .run();

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

function createRepository(raw, now = FIXED_NOW) {
  const { db } = raw;
  return new SqliteReminderRepository(async () => db, () => now);
}

function reminderData(overrides = {}) {
  return {
    title: 'Pago de luz',
    type: 'EXPENSE',
    recurrence: 'MONTHLY',
    time: '09:00',
    startDate: '2026-01-31',
    ...overrides,
  };
}

test('crea un recordatorio mensual y calcula su próxima ejecución', async () => {
  const database = createDatabase();
  const repository = createRepository(database);

  const reminder = await repository.create(
    reminderData({
      description: ' Factura mensual ',
      amount: 125.5,
      accountId: 'acc-1',
      categoryId: 'cat-expense',
    })
  );

  assert.equal(reminder.title, 'Pago de luz');
  assert.equal(reminder.description, 'Factura mensual');
  assert.equal(reminder.amount, 125.5);
  assert.equal(reminder.accountId, 'acc-1');
  assert.equal(reminder.categoryId, 'cat-expense');
  assert.equal(reminder.isArchived, false);
  assert.equal(
    new Date(reminder.nextRunAt).getTime(),
    new Date(2026, 0, 31, 9, 0, 0, 0).getTime()
  );
  assert.deepEqual(await repository.getById(reminder.id), reminder);
});

test('crear valida título, descripción, monto, hora, fecha y referencias', async () => {
  const database = createDatabase();
  const repository = createRepository(database);

  const cases = [
    [{ title: '   ' }, 'TITLE_REQUIRED'],
    [{ title: 'x'.repeat(MAX_REMINDER_TITLE_LENGTH + 1) }, 'TITLE_TOO_LONG'],
    [
      { description: 'x'.repeat(MAX_TRANSACTION_DESCRIPTION_LENGTH + 1) },
      'DESCRIPTION_TOO_LONG',
    ],
    [{ amount: 0 }, 'AMOUNT_INVALID'],
    [{ amount: MAX_AMOUNT + 1 }, 'AMOUNT_INVALID'],
    [{ time: '24:00' }, 'TIME_INVALID'],
    [{ startDate: '2026-02-30' }, 'START_DATE_INVALID'],
    [{ type: 'TRANSFER' }, 'TYPE_INVALID'],
    [{ recurrence: 'YEARLY' }, 'RECURRENCE_INVALID'],
    [{ accountId: 'acc-missing' }, 'ACCOUNT_NOT_FOUND'],
    [{ categoryId: 'cat-missing' }, 'CATEGORY_NOT_FOUND'],
    [{ categoryId: 'cat-income' }, 'CATEGORY_NOT_FOUND'],
  ];

  for (const [overrides, code] of cases) {
    await assert.rejects(
      () => repository.create(reminderData(overrides)),
      (error) =>
        error instanceof ReminderValidationError && error.code === code
    );
  }

  await assert.rejects(
    () =>
      repository.create(
        reminderData({ recurrence: 'ONCE', startDate: '2025-12-01' })
      ),
    (error) =>
      error instanceof ReminderValidationError &&
      error.code === 'START_DATE_IN_PAST'
  );
});

test('getDue solo devuelve recordatorios activos y vencidos', async () => {
  const database = createDatabase();
  const repository = createRepository(database);

  const once = await repository.create(
    reminderData({
      title: 'Pago único',
      recurrence: 'ONCE',
      startDate: '2026-01-05',
    })
  );
  const archived = await repository.create(
    reminderData({
      title: 'Archivado',
      startDate: '2026-01-10',
    })
  );
  await repository.update(archived.id, { isArchived: true });
  const future = await repository.create(
    reminderData({
      title: 'Futuro',
      startDate: '2026-03-31',
    })
  );

  const due = await repository.getDue('2026-02-01T00:00:00.000Z');
  assert.deepEqual(
    due.map((reminder) => reminder.id),
    [once.id]
  );

  const active = await repository.getAll();
  assert.deepEqual(
    active.map((reminder) => reminder.id),
    [once.id, future.id]
  );

  const all = await repository.getAll(true);
  assert.deepEqual(
    all.map((reminder) => reminder.id).sort(),
    [once.id, archived.id, future.id].sort()
  );
});

test('recordNotificationSent archiva un ONCE y conserva last_notified_at', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(
    reminderData({
      title: 'Pago único',
      recurrence: 'ONCE',
      startDate: '2026-01-05',
    })
  );
  const sentAt = new Date(2026, 0, 5, 9, 1).toISOString();

  const updated = await repository.recordNotificationSent(reminder.id, sentAt);

  assert.equal(updated.isArchived, true);
  assert.equal(updated.lastNotifiedAt, sentAt);
  assert.equal(updated.nextRunAt, null);
});

test('recordNotificationSent reprograma un recurrente', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(reminderData());
  const sentAt = new Date(2026, 0, 31, 9, 1).toISOString();

  const updated = await repository.recordNotificationSent(reminder.id, sentAt);

  assert.equal(updated.isArchived, false);
  assert.equal(updated.lastNotifiedAt, sentAt);
  assert.equal(
    new Date(updated.nextRunAt).getTime(),
    new Date(2026, 1, 28, 9, 0, 0, 0).getTime()
  );
});

test('recordNotificationSent valida la fecha de envío', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(reminderData());

  await assert.rejects(
    () => repository.recordNotificationSent(reminder.id, '2026-01-31'),
    (error) =>
      error instanceof ReminderValidationError &&
      error.code === 'SENT_AT_INVALID'
  );
  assert.equal(
    await repository.recordNotificationSent('missing', undefined),
    null
  );
});

test('update recalcula el calendario y valida los cambios', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(reminderData());

  const changedTime = await repository.update(reminder.id, { time: '10:15' });
  assert.equal(
    new Date(changedTime.nextRunAt).getTime(),
    new Date(2026, 0, 31, 10, 15, 0, 0).getTime()
  );

  const changedDate = await repository.update(reminder.id, {
    startDate: '2026-02-15',
  });
  assert.equal(
    new Date(changedDate.nextRunAt).getTime(),
    new Date(2026, 1, 15, 10, 15, 0, 0).getTime()
  );

  await assert.rejects(
    () =>
      repository.update(reminder.id, {
        recurrence: 'ONCE',
        startDate: '2025-12-01',
      }),
    (error) =>
      error instanceof ReminderValidationError &&
      error.code === 'START_DATE_IN_PAST'
  );

  const archived = await repository.update(reminder.id, { isArchived: true });
  assert.equal(archived.isArchived, true);

  await assert.rejects(
    () => repository.update(reminder.id, { categoryId: 'cat-income' }),
    (error) =>
      error instanceof ReminderValidationError &&
      error.code === 'CATEGORY_NOT_FOUND'
  );
  await assert.rejects(
    () => repository.update('missing', { title: 'Otro' }),
    /Reminder not found/
  );
});

test('reconcileNextRunAt archiva un ONCE vencido sin tocar last_notified_at', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(
    reminderData({
      title: 'Pago único',
      recurrence: 'ONCE',
      startDate: '2026-01-05',
    })
  );

  const reconciled = await repository.reconcileNextRunAt(
    reminder.id,
    new Date(2026, 0, 6, 8)
  );

  assert.equal(reconciled.isArchived, true);
  assert.equal(reconciled.nextRunAt, null);
  assert.equal(reconciled.lastNotifiedAt, null);
});

test('reconcileNextRunAt avanza un recurrente y conserva el futuro', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const recurring = await repository.create(reminderData());
  const future = await repository.create(
    reminderData({
      title: 'Futuro',
      recurrence: 'ONCE',
      startDate: '2026-03-05',
    })
  );

  const reconciled = await repository.reconcileNextRunAt(
    recurring.id,
    new Date(2026, 1, 1, 8)
  );
  const untouched = await repository.reconcileNextRunAt(
    future.id,
    new Date(2026, 1, 1, 8)
  );

  assert.equal(reconciled.isArchived, false);
  assert.equal(
    new Date(reconciled.nextRunAt).getTime(),
    new Date(2026, 1, 28, 9, 0, 0, 0).getTime()
  );
  assert.equal(untouched.nextRunAt, future.nextRunAt);
  assert.equal(untouched.isArchived, false);
});

test('reconcileNextRunAt ignora archivados y devuelve null si no existe', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const archived = await repository.create(reminderData());
  await repository.update(archived.id, { isArchived: true });

  assert.deepEqual(
    await repository.reconcileNextRunAt(
      archived.id,
      new Date(2027, 0, 1, 8)
    ),
    { ...archived, isArchived: true }
  );
  assert.equal(
    await repository.reconcileNextRunAt('missing', new Date(2027, 0, 1, 8)),
    null
  );
});

test('delete elimina el recordatorio y la cuenta queda en null', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(
    reminderData({ accountId: 'acc-1' })
  );

  database.raw.prepare('DELETE FROM accounts WHERE id = ?').run('acc-1');

  assert.equal((await repository.getById(reminder.id)).accountId, null);

  await repository.update(reminder.id, { isArchived: true });
  await repository.delete(reminder.id);
  assert.equal(await repository.getById(reminder.id), null);
});

test('delete elimina un recordatorio archivado', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(reminderData());

  await repository.update(reminder.id, { isArchived: true });
  await repository.delete(reminder.id);

  assert.equal(await repository.getById(reminder.id), null);
});

test('delete rechaza un recordatorio activo', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(reminderData());

  await assert.rejects(
    () => repository.delete(reminder.id),
    (error) =>
      error instanceof ReminderValidationError &&
      error.code === 'NOT_ARCHIVED'
  );
  assert.notEqual(await repository.getById(reminder.id), null);
});

test('delete de un archivado conserva cuenta, categoría, movimiento y split', async () => {
  const database = createDatabase();
  const repository = createRepository(database);
  const reminder = await repository.create(
    reminderData({ accountId: 'acc-1', categoryId: 'cat-expense' })
  );
  await repository.update(reminder.id, { isArchived: true });

  database.raw
    .prepare(
      `INSERT INTO transactions (id, type, total_amount, description, date)
       VALUES ('tx-1', 'EXPENSE', 125.5, 'Factura', '2026-01-31')`
    )
    .run();
  database.raw
    .prepare(
      `INSERT INTO transaction_splits
         (id, transaction_id, account_id, category_id, amount)
       VALUES ('split-1', 'tx-1', 'acc-1', 'cat-expense', 125.5)`
    )
    .run();

  await repository.delete(reminder.id);

  assert.equal(await repository.getById(reminder.id), null);
  assert.ok(
    database.raw.prepare('SELECT id FROM accounts WHERE id = ?').get('acc-1')
  );
  assert.ok(
    database.raw
      .prepare('SELECT id FROM expense_categories WHERE id = ?')
      .get('cat-expense')
  );
  assert.ok(
    database.raw
      .prepare('SELECT id FROM transactions WHERE id = ?')
      .get('tx-1')
  );
  assert.ok(
    database.raw
      .prepare('SELECT id FROM transaction_splits WHERE id = ?')
      .get('split-1')
  );
});
