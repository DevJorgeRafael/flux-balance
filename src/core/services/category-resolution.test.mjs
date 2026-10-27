import test from 'node:test';
import assert from 'node:assert/strict';
import {
  categoryTableForType,
  resolveCategoryForType,
} from './category-resolution.ts';

function category(id, name, type) {
  return {
    id,
    name,
    type,
    isDefault: true,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

test('maps each transaction type to its category table', () => {
  assert.equal(categoryTableForType('INCOME'), 'income_categories');
  assert.equal(categoryTableForType('EXPENSE'), 'expense_categories');
});

test('resolves a category only when it belongs to the transaction type', () => {
  const categories = [
    category('salary', 'Salario', 'INCOME'),
    category('food', 'Alimentación', 'EXPENSE'),
  ];

  assert.equal(resolveCategoryForType('salary', 'INCOME', categories)?.name, 'Salario');
  assert.equal(resolveCategoryForType('food', 'EXPENSE', categories)?.name, 'Alimentación');
  assert.equal(resolveCategoryForType('salary', 'EXPENSE', categories), null);
  assert.equal(resolveCategoryForType('food', 'INCOME', categories), null);
});

test('disambiguates the same id when it exists in both category types', () => {
  const categories = [
    category('shared', 'Compartida ingreso', 'INCOME'),
    category('shared', 'Compartida gasto', 'EXPENSE'),
  ];

  assert.equal(
    resolveCategoryForType('shared', 'INCOME', categories)?.name,
    'Compartida ingreso'
  );
  assert.equal(
    resolveCategoryForType('shared', 'EXPENSE', categories)?.name,
    'Compartida gasto'
  );
});

test('returns null for missing, empty or unknown categories', () => {
  const categories = [category('food', 'Alimentación', 'EXPENSE')];

  assert.equal(resolveCategoryForType(undefined, 'EXPENSE', categories), null);
  assert.equal(resolveCategoryForType('', 'EXPENSE', categories), null);
  assert.equal(resolveCategoryForType('   ', 'EXPENSE', categories), null);
  assert.equal(resolveCategoryForType('missing', 'EXPENSE', categories), null);
});
