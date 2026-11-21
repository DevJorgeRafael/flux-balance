import test from 'node:test';
import assert from 'node:assert/strict';
import { selectRecentTransactions } from './recent-transactions.ts';

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
