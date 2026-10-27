import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCategoryName,
  parseCategoryType,
  validateCategoryName,
} from './category-management.ts';

function category(id, name, type) {
  return { id, name, type };
}

test('trims category names and rejects empty values', () => {
  assert.equal(normalizeCategoryName('  Mascotas  '), 'Mascotas');
  assert.equal(validateCategoryName('   ', [], 'EXPENSE'), 'required');
  assert.equal(validateCategoryName('  Comida  ', [], 'EXPENSE'), null);
});

test('rejects duplicates in the same type ignoring case', () => {
  const categories = [
    category('food', 'Alimentación', 'EXPENSE'),
    category('salary', 'Salario', 'INCOME'),
  ];

  assert.equal(
    validateCategoryName('  alimentación ', categories, 'EXPENSE'),
    'duplicate'
  );
  assert.equal(validateCategoryName('Salario', categories, 'EXPENSE'), null);
  assert.equal(validateCategoryName('Salario', categories, 'INCOME'), 'duplicate');
});

test('allows keeping the current name while editing', () => {
  const categories = [category('pets', 'Mascotas', 'EXPENSE')];

  assert.equal(
    validateCategoryName(' Mascotas ', categories, 'EXPENSE', 'pets'),
    null
  );
  assert.equal(
    validateCategoryName('Mascotas', categories, 'EXPENSE', 'other'),
    'duplicate'
  );
});

test('parses only supported category types', () => {
  assert.equal(parseCategoryType('income'), 'INCOME');
  assert.equal(parseCategoryType(' EXPENSE '), 'EXPENSE');
  assert.equal(parseCategoryType('transfer'), null);
  assert.equal(parseCategoryType(undefined), null);
});
