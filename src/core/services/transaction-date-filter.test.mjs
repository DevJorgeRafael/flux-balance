import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterTransactionsByDateRange,
  formatDateRangeLabel,
  isDateInRange,
} from './transaction-date-filter.ts';

function transaction(id, date) {
  return { id, date };
}

test('sin rango devuelve todas las transacciones', () => {
  const all = [transaction('a', '2026-11-21'), transaction('b', '2026-10-01')];
  assert.deepEqual(filterTransactionsByDateRange(all, null), all);
});

test('un solo día incluye todas las horas de ese día', () => {
  const range = { start: new Date(2026, 10, 21) };
  assert.equal(isDateInRange('2026-11-21', range), true);
  assert.equal(isDateInRange('2026-11-21T23:59:00', range), true);
  assert.equal(isDateInRange('2026-11-20T23:59:00', range), false);
  assert.equal(isDateInRange('2026-11-22', range), false);
});

test('el rango es inclusivo en ambos extremos', () => {
  const all = [
    transaction('antes', '2026-11-14T23:59:00'),
    transaction('inicio', '2026-11-15T00:00:00'),
    transaction('medio', '2026-11-18'),
    transaction('fin', '2026-11-21T23:59:00'),
    transaction('despues', '2026-11-22'),
  ];
  const filtered = filterTransactionsByDateRange(all, {
    start: new Date(2026, 10, 15),
    end: new Date(2026, 10, 21),
  });

  assert.deepEqual(
    filtered.map((item) => item.id),
    ['inicio', 'medio', 'fin']
  );
});

test('fechas inválidas se excluyen cuando hay rango', () => {
  assert.equal(isDateInRange('no-es-fecha', { start: new Date(2026, 10, 21) }), false);
});

test('un rango invertido se normaliza al día inicial', () => {
  const range = { start: new Date(2026, 10, 21), end: new Date(2026, 10, 15) };
  assert.equal(isDateInRange('2026-11-21', range), true);
  assert.equal(isDateInRange('2026-11-15', range), false);
});

test('formatDateRangeLabel muestra un día o un intervalo', () => {
  const label = formatDateRangeLabel(
    { start: new Date(2026, 10, 15), end: new Date(2026, 10, 21) },
    'en-US'
  );
  assert.match(label ?? '', /Nov 15, 2026/);
  assert.match(label ?? '', /Nov 21, 2026/);
  assert.equal(formatDateRangeLabel(null, 'en-US'), null);
});
