import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canEditTransaction,
  getBalanceDelta,
  getTransactionEditBlockReason,
  splitTotalMatches,
  validateTransactionUpdate,
} from './transaction-edit.ts';

function transaction(overrides = {}) {
  return {
    id: 'tx-1',
    type: 'EXPENSE',
    totalAmount: 100,
    description: 'Compra',
    date: '2026-01-02',
    createdAt: '2026-01-02T10:00:00.000Z',
    splits: [
      {
        id: 'split-1',
        transactionId: 'tx-1',
        accountId: 'acc-1',
        categoryId: 'cat-exp',
        amount: 100,
      },
    ],
    ...overrides,
  };
}

function update(overrides = {}) {
  return {
    type: 'EXPENSE',
    totalAmount: 100,
    description: 'Compra',
    date: '2026-01-02',
    splits: [{ accountId: 'acc-1', categoryId: 'cat-exp', amount: 100 }],
    ...overrides,
  };
}

test('bloquea transferencias, movimientos divididos y sin divisiones', () => {
  assert.equal(getTransactionEditBlockReason(transaction({ type: 'TRANSFER' })), 'TRANSFER');
  assert.equal(
    getTransactionEditBlockReason(
      transaction({
        splits: [
          { accountId: 'acc-1', amount: 50 },
          { accountId: 'acc-2', amount: 50 },
        ],
      })
    ),
    'MULTIPLE_SPLITS'
  );
  assert.equal(
    getTransactionEditBlockReason(transaction({ splits: [] })),
    'NO_SPLITS'
  );
  assert.equal(getTransactionEditBlockReason(transaction()), null);
});

test('canEditTransaction solo permite un movimiento simple de ingreso o gasto', () => {
  assert.equal(canEditTransaction(transaction()), true);
  assert.equal(canEditTransaction(transaction({ type: 'INCOME' })), true);
  assert.equal(canEditTransaction(transaction({ type: 'TRANSFER' })), false);
  assert.equal(
    canEditTransaction(
      transaction({
        splits: [
          { accountId: 'acc-1', amount: 50 },
          { accountId: 'acc-2', amount: 50 },
        ],
      })
    ),
    false
  );
});

test('getBalanceDelta suma ingresos, resta gastos y rechaza transferencias', () => {
  assert.equal(getBalanceDelta('INCOME', 100), 100);
  assert.equal(getBalanceDelta('EXPENSE', 100), -100);
  assert.throws(() => getBalanceDelta('TRANSFER', 100), /transferencias/i);
});

test('splitTotalMatches tolera el redondeo de la moneda', () => {
  assert.equal(splitTotalMatches(100, [{ amount: 100 }]), true);
  assert.equal(
    splitTotalMatches(100, [{ amount: 33.33 }, { amount: 66.67 }]),
    true
  );
  assert.equal(splitTotalMatches(100, [{ amount: 99.99 }]), false);
  assert.equal(splitTotalMatches(100, [{ amount: 90 }]), false);
  assert.equal(splitTotalMatches(100, [{ amount: 100 }], 0), true);
  assert.equal(splitTotalMatches(100, [{ amount: 99.4 }], 0), false);
});

test('valida una actualización correcta', () => {
  assert.deepEqual(validateTransactionUpdate(update()), { ok: true });
  assert.deepEqual(
    validateTransactionUpdate(update({ description: null })),
    { ok: true }
  );
  assert.deepEqual(
    validateTransactionUpdate(update({ description: '   ' })),
    { ok: true }
  );
});

test('rechaza tipos no editables', () => {
  assert.deepEqual(validateTransactionUpdate(update({ type: 'TRANSFER' })), {
    ok: false,
    error: 'typeNotEditable',
  });
});

test('rechaza importes inválidos', () => {
  for (const totalAmount of [0, -10, Number.NaN, Number.POSITIVE_INFINITY, 1e13]) {
    assert.deepEqual(
      validateTransactionUpdate(update({ totalAmount })),
      { ok: false, error: 'invalidAmount' }
    );
  }

  assert.deepEqual(
    validateTransactionUpdate(
      update({ splits: [{ accountId: 'acc-1', amount: 0 }] })
    ),
    { ok: false, error: 'invalidAmount' }
  );
});

test('rechaza fechas inválidas', () => {
  assert.deepEqual(validateTransactionUpdate(update({ date: 'no-es-fecha' })), {
    ok: false,
    error: 'invalidDate',
  });
  assert.deepEqual(validateTransactionUpdate(update({ date: '2026-02-30' })), {
    ok: false,
    error: 'invalidDate',
  });
});

test('rechaza descripciones demasiado largas', () => {
  assert.deepEqual(
    validateTransactionUpdate(update({ description: 'x'.repeat(201) })),
    { ok: false, error: 'descriptionTooLong' }
  );
});

test('rechaza movimientos sin cuenta y con divisiones descuadradas', () => {
  assert.deepEqual(
    validateTransactionUpdate(update({ splits: [] })),
    { ok: false, error: 'missingAccount' }
  );
  assert.deepEqual(
    validateTransactionUpdate(
      update({ splits: [{ accountId: '   ', amount: 100 }] })
    ),
    { ok: false, error: 'missingAccount' }
  );
  assert.deepEqual(
    validateTransactionUpdate(
      update({ splits: [{ accountId: 'acc-1', amount: 90 }] })
    ),
    { ok: false, error: 'splitTotalMismatch' }
  );
});
