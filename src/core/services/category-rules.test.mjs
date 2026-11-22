import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLearnedRules,
  extractKeywords,
  normalizeKeyword,
  suggestCategory,
} from './category-rules.ts';

function rule(overrides = {}) {
  return {
    id: 'rule-1',
    keyword: 'mercadona',
    categoryId: 'cat-food',
    type: 'EXPENSE',
    hits: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('normaliza texto sin acentos, mayúsculas ni espacios extra', () => {
  assert.equal(normalizeKeyword('  MERCADONA  Óptica '), 'mercadona optica');
  assert.equal(normalizeKeyword(' Café   con   leche '), 'cafe con leche');
});

test('extrae palabras útiles y descarta artículos y palabras cortas', () => {
  const keywords = extractKeywords('Pago en MERCADONA de la ciudad');
  assert.ok(keywords.includes('mercadona'));
  assert.ok(keywords.includes('pago'));
  assert.ok(!keywords.includes('la'));
  assert.ok(!keywords.includes('de'));
  assert.ok(!keywords.includes('en'));
});

test('sugiere la regla con la palabra más larga y desempata con usos', () => {
  const rules = [
    rule(),
    rule({ id: 'rule-2', keyword: 'mercado', categoryId: 'cat-other', hits: 9 }),
    rule({ id: 'rule-3', keyword: 'mercadona', categoryId: 'cat-market', hits: 4 }),
  ];

  const suggestion = suggestCategory('Compra en Mercadona', rules, 'EXPENSE');
  assert.equal(suggestion?.categoryId, 'cat-market');
  assert.equal(suggestion?.keyword, 'mercadona');
});

test('ignora reglas de otro tipo y descripciones vacías', () => {
  assert.equal(
    suggestCategory('Mercadona', [rule({ type: 'INCOME' })], 'EXPENSE'),
    null
  );
  assert.equal(suggestCategory('', [rule()], 'EXPENSE'), null);
});

test('aprende reglas nuevas y no repite las existentes', () => {
  const existing = [rule({ keyword: 'pago' })];
  const learned = buildLearnedRules(
    'Pago Mercadona',
    'cat-food',
    'EXPENSE',
    existing
  );

  assert.deepEqual(learned, [
    { keyword: 'mercadona', categoryId: 'cat-food', type: 'EXPENSE' },
  ]);
});

test('no aprende sin categoría ni con descripción sin palabras útiles', () => {
  assert.deepEqual(buildLearnedRules('Mercadona', '', 'EXPENSE', []), []);
  assert.deepEqual(buildLearnedRules('de la', 'cat-1', 'EXPENSE', []), []);
});
