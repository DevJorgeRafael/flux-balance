import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { BASELINE_DDL } from '../database/migrations/001_baseline.ts';
import { GOALS_DDL } from '../database/migrations/006_goals.ts';
import { SqliteGoalRepository } from './SqliteGoalRepository.ts';

function createRepository() {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  raw.exec(BASELINE_DDL);
  raw.exec(GOALS_DDL);
  raw.prepare(
    `INSERT INTO accounts (id, name, type, balance, currency)
     VALUES ('acc-1', 'Ahorros', 'FLEXIBLE_SAVINGS', 100, 'USD')`
  ).run();

  const api = () => ({
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params = []) { return raw.prepare(sql).run(...params); },
    async getFirstAsync(sql, params = []) {
      return raw.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, params = []) { return raw.prepare(sql).all(...params); },
  });
  return {
    raw,
    repository: new SqliteGoalRepository(() => Promise.resolve(api())),
  };
}

const draft = {
  name: 'Viaje a Japón',
  targetAmount: 2000,
  deadline: '2026-12-31',
  accountId: 'acc-1',
};

test('crea, lista, actualiza y borra una meta', async () => {
  const { repository } = createRepository();

  const created = await repository.create(draft);
  assert.equal(created.name, 'Viaje a Japón');
  assert.equal((await repository.getAll()).length, 1);

  const updated = await repository.update(created.id, { targetAmount: 2500 });
  assert.equal(updated.targetAmount, 2500);

  await repository.delete(created.id);
  assert.deepEqual(await repository.getAll(), []);
});

test('rechaza nombres, importes y fechas inválidos', async () => {
  const { repository } = createRepository();

  await assert.rejects(
    () => repository.create({ ...draft, name: '  ' }),
    /Nombre/
  );
  await assert.rejects(
    () => repository.create({ ...draft, targetAmount: -1 }),
    /mayor que cero/
  );
  await assert.rejects(
    () => repository.create({ ...draft, deadline: '2026-02-30' }),
    /fecha/i
  );
  await assert.rejects(
    () => repository.create({ ...draft, deadline: '2020-01-01' }),
    /futura/
  );
  await assert.rejects(
    () => repository.create({ ...draft, accountId: 'no-existe' }),
    /no existe/
  );
});
