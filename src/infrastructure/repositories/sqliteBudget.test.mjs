import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { BASELINE_DDL } from '../database/migrations/001_baseline.ts';
import { BUDGETS_DDL } from '../database/migrations/004_budgets.ts';
import { SqliteBudgetRepository } from './SqliteBudgetRepository.ts';

function createDatabase() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(BASELINE_DDL);
  raw.exec(BUDGETS_DDL);
  raw.prepare("INSERT INTO expense_categories (id, name) VALUES ('cat-1', 'Comida')").run();

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
  return { raw, repository: new SqliteBudgetRepository(() => Promise.resolve(db)) };
}

function validBudget(overrides = {}) {
  return {
    categoryId: 'cat-1',
    type: 'EXPENSE',
    yearMonth: '2026-02',
    limitAmount: 200,
    ...overrides,
  };
}

test('crea, lista, actualiza y borra un presupuesto', async () => {
  const { repository } = createDatabase();

  const created = await repository.create(validBudget());
  assert.equal(created.limitAmount, 200);
  assert.equal(created.yearMonth, '2026-02');

  const listed = await repository.getAll('2026-02');
  assert.equal(listed.length, 1);

  const updated = await repository.update(created.id, { limitAmount: 250 });
  assert.equal(updated.limitAmount, 250);

  await repository.delete(created.id);
  assert.deepEqual(await repository.getAll(), []);
});

test('rechaza meses, montos y categorías inválidos', async () => {
  const { repository } = createDatabase();

  await assert.rejects(
    () => repository.create(validBudget({ yearMonth: '2026-13' })),
    /inválidos/
  );
  await assert.rejects(
    () => repository.create(validBudget({ limitAmount: 0 })),
    /mayor que cero/
  );
  await assert.rejects(
    () => repository.create(validBudget({ categoryId: 'no-existe' })),
    /no existe/
  );
});

test('busca un presupuesto por categoría, tipo y mes', async () => {
  const { repository } = createDatabase();
  await repository.create(validBudget());

  const found = await repository.getByCategory('cat-1', 'EXPENSE', '2026-02');
  assert.equal(found?.limitAmount, 200);
  assert.equal(
    await repository.getByCategory('cat-1', 'EXPENSE', '2026-03'),
    null
  );
});
