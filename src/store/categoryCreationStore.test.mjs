import test from 'node:test';
import assert from 'node:assert/strict';

import { useCategoryCreationStore } from './categoryCreationStore.ts';

function category(id, type = 'EXPENSE') {
  return {
    id,
    name: id,
    type,
    isDefault: false,
    sortOrder: 0,
    createdAt: '2026-11-23T00:00:00.000Z',
  };
}

function store() {
  return useCategoryCreationStore.getState();
}

test.beforeEach(() => {
  store().clear();
});

test('requestCategory guarda el tipo y abre una nueva petición', () => {
  store().requestCategory('EXPENSE');

  assert.equal(store().type, 'EXPENSE');
  assert.equal(store().requestId, 1);
  assert.equal(store().result, null);
  assert.equal(store().resultRequestId, null);
});

test('setResult solo publica si hay una petición abierta', () => {
  const item = category('cat_exp_nueva');

  store().setResult(item);
  assert.equal(store().result, null);

  store().requestCategory('EXPENSE');
  store().setResult(item);
  assert.deepEqual(store().result, item);
  assert.equal(store().resultRequestId, store().requestId);
});

test('consumeResult devuelve el resultado una sola vez', () => {
  const item = category('cat_exp_nueva');
  store().requestCategory('EXPENSE');
  store().setResult(item);

  assert.deepEqual(store().consumeResult(), item);
  assert.equal(store().consumeResult(), null);
  assert.equal(store().result, null);
});

test('un resultado de una petición anterior se descarta', () => {
  const oldItem = category('cat_exp_vieja');
  store().requestCategory('EXPENSE');
  store().setResult(oldItem);

  store().requestCategory('INCOME');
  assert.equal(store().type, 'INCOME');
  assert.equal(store().consumeResult(), null);

  const newItem = category('cat_inc_nueva', 'INCOME');
  store().setResult(newItem);
  assert.deepEqual(store().consumeResult(), newItem);
});

test('requestCategory deja una navegación pendiente y se consume una vez', () => {
  assert.equal(store().pendingType, null);

  store().requestCategory('EXPENSE');
  assert.equal(store().pendingType, 'EXPENSE');
  assert.equal(store().consumePendingType(), 'EXPENSE');
  assert.equal(store().consumePendingType(), null);
  assert.equal(store().pendingType, null);
});

test('el token de reapertura se reinicia y se incrementa al publicar', () => {
  store().notifyPickerReopen();
  assert.equal(store().pickerReopenToken, 1);

  store().requestCategory('EXPENSE');
  assert.equal(store().pickerReopenToken, 0);

  store().notifyPickerReopen();
  assert.equal(store().pickerReopenToken, 1);
});

test('clear reinicia todo el handoff', () => {
  store().requestCategory('INCOME');
  store().setResult(category('cat_inc_nueva', 'INCOME'));
  store().clear();

  assert.equal(store().requestId, 0);
  assert.equal(store().type, null);
  assert.equal(store().result, null);
  assert.equal(store().resultRequestId, null);
  assert.equal(store().pickerReopenToken, 0);
});
