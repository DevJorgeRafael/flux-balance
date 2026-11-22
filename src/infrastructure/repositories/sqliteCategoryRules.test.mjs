import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { CATEGORY_RULES_DDL } from '../database/migrations/005_category_rules.ts';
import { SqliteCategoryRuleRepository } from './SqliteCategoryRuleRepository.ts';

function createRepository() {
  const raw = new DatabaseSync(':memory:');
  raw.exec(CATEGORY_RULES_DDL);
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
    repository: new SqliteCategoryRuleRepository(() => Promise.resolve(api())),
  };
}

const draft = {
  keyword: 'mercadona',
  categoryId: 'cat-food',
  type: 'EXPENSE',
};

test('crea una regla y la lista por tipo', async () => {
  const { repository } = createRepository();

  const created = await repository.create(draft);
  assert.equal(created.keyword, 'mercadona');
  assert.equal(created.hits, 1);

  const rules = await repository.getAll('EXPENSE');
  assert.equal(rules.length, 1);
  assert.equal((await repository.getAll('INCOME')).length, 0);
});

test('crear la misma palabra suma un uso en vez de duplicar', async () => {
  const { repository } = createRepository();
  await repository.create(draft);
  const second = await repository.create({ ...draft, categoryId: 'cat-other' });

  assert.equal(second.hits, 2);
  assert.equal(second.categoryId, 'cat-food');
  assert.equal((await repository.getAll()).length, 1);
});

test('busca por palabra y elimina reglas', async () => {
  const { repository } = createRepository();
  const created = await repository.create(draft);

  assert.equal((await repository.findByKeyword('mercadona', 'EXPENSE'))?.id, created.id);
  assert.equal(await repository.findByKeyword('mercadona', 'INCOME'), null);

  await repository.delete(created.id);
  assert.equal(await repository.getById(created.id), null);
});
