import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectRecentTransactions,
  selectVisibleRecentTransactions,
} from './recent-transactions.ts';

const NOW = new Date(2026, 10, 20, 12);

function transaction(id, date) {
  return {
    id,
    type: 'EXPENSE',
    totalAmount: 10,
    date,
    createdAt: date,
    splits: [],
  };
}

test('muestra solo los movimientos del mes actual', () => {
  const result = selectRecentTransactions(
    [
      transaction('octubre', '2026-10-31'),
      transaction('noviembre-1', '2026-11-01'),
      transaction('noviembre-20', '2026-11-20T15:00:00.000Z'),
    ],
    { now: NOW }
  );

  assert.deepEqual(
    result.transactions.map((item) => item.id),
    ['noviembre-20', 'noviembre-1']
  );
  assert.equal(result.isFallback, false);
});

test('usa los últimos 5 movimientos si el mes actual está vacío', () => {
  const result = selectRecentTransactions(
    [
      transaction('octubre-1', '2026-10-01'),
      transaction('octubre-4', '2026-10-04'),
      transaction('octubre-2', '2026-10-02'),
      transaction('octubre-6', '2026-10-06'),
      transaction('octubre-3', '2026-10-03'),
      transaction('octubre-5', '2026-10-05'),
    ],
    { now: NOW }
  );

  assert.deepEqual(
    result.transactions.map((item) => item.id),
    ['octubre-6', 'octubre-5', 'octubre-4', 'octubre-3', 'octubre-2']
  );
  assert.equal(result.isFallback, true);
});

test('muestra todos los movimientos del mes actual sin recortarlos', () => {
  const result = selectRecentTransactions(
    [
      transaction('octubre', '2026-10-31'),
      transaction('noviembre-1', '2026-11-01'),
      transaction('noviembre-2', '2026-11-02'),
      transaction('noviembre-3', '2026-11-03'),
      transaction('noviembre-4', '2026-11-04'),
      transaction('noviembre-5', '2026-11-05'),
      transaction('noviembre-6', '2026-11-06'),
    ],
    { now: NOW }
  );

  assert.equal(result.transactions.length, 6);
  assert.equal(result.isFallback, false);
});

test('devuelve vacío y sin fallback cuando no hay movimientos válidos', () => {
  const result = selectRecentTransactions(
    [transaction('invalido', 'sin-fecha')],
    { now: NOW }
  );

  assert.deepEqual(result.transactions, []);
  assert.equal(result.isFallback, false);
});

test('muestra 5 movimientos y cuenta los ocultos', () => {
  const all = Array.from({ length: 7 }, (_, index) =>
    transaction(`tx-${index}`, `2026-11-${20 - index}`)
  );

  const collapsed = selectVisibleRecentTransactions(all);
  assert.equal(collapsed.transactions.length, 5);
  assert.equal(collapsed.hiddenCount, 2);
  assert.deepEqual(
    collapsed.transactions.map((item) => item.id),
    ['tx-0', 'tx-1', 'tx-2', 'tx-3', 'tx-4']
  );

  const expanded = selectVisibleRecentTransactions(all, { expanded: true });
  assert.equal(expanded.transactions.length, 7);
  assert.equal(expanded.hiddenCount, 0);
});

test('respeta un límite personalizado y tolera valores inválidos', () => {
  const all = Array.from({ length: 4 }, (_, index) =>
    transaction(`tx-${index}`, `2026-11-${20 - index}`)
  );

  assert.equal(selectVisibleRecentTransactions(all, { limit: 2 }).hiddenCount, 2);
  assert.equal(selectVisibleRecentTransactions(all, { limit: 0 }).transactions.length, 0);
  assert.equal(selectVisibleRecentTransactions(all, { limit: -1 }).transactions.length, 4);
});
