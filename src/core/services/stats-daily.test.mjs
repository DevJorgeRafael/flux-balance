import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyStats, getMonthDayCount } from './stats-daily.ts';

const DAY = (day, month = 9, year = 2026) =>
  new Date(year, month, day, 12).toISOString();

function transaction({
  id = 'tx',
  type = 'EXPENSE',
  date = DAY(15),
  totalAmount = 100,
} = {}) {
  return {
    id,
    type,
    totalAmount,
    date,
    createdAt: date,
    splits: [],
  };
}

test('agrupa por día local, suma movimientos del mismo día y calcula métricas', () => {
  const stats = buildDailyStats({
    transactions: [
      transaction({ id: 'a', date: DAY(2), totalAmount: 100 }),
      transaction({ id: 'b', date: DAY(2), totalAmount: 50 }),
      transaction({ id: 'c', date: DAY(5), totalAmount: 300 }),
      transaction({ id: 'income', type: 'INCOME', date: DAY(5), totalAmount: 900 }),
      transaction({ id: 'transfer', type: 'TRANSFER', date: DAY(5), totalAmount: 400 }),
      transaction({ id: 'other-month', date: DAY(5, 8), totalAmount: 700 }),
    ],
    type: 'EXPENSE',
    year: 2026,
    monthIndex: 9,
    endDay: 6,
  });

  assert.deepEqual(
    stats.points.map((point) => point.amount),
    [0, 150, 0, 0, 300, 0]
  );
  assert.equal(stats.total, 450);
  assert.equal(stats.activeDays, 2);
  assert.equal(stats.average, 75);
  assert.deepEqual(stats.maxPoint, { day: 5, amount: 300 });
});

test('recorta el mes en curso en endDay y descarta movimientos posteriores', () => {
  const stats = buildDailyStats({
    transactions: [
      transaction({ id: 'a', date: DAY(20), totalAmount: 200 }),
      transaction({ id: 'b', date: DAY(25), totalAmount: 999 }),
    ],
    type: 'EXPENSE',
    year: 2026,
    monthIndex: 9,
    endDay: 20,
  });

  assert.equal(stats.points.length, 20);
  assert.equal(stats.total, 200);
  assert.deepEqual(stats.points[19], { day: 20, amount: 200 });
  assert.deepEqual(stats.maxPoint, { day: 20, amount: 200 });
});

test('devuelve puntos vacíos sin días y no inventa un pico', () => {
  const stats = buildDailyStats({
    transactions: [transaction()],
    type: 'EXPENSE',
    year: 2026,
    monthIndex: 9,
    endDay: 0,
  });

  assert.deepEqual(stats, {
    points: [],
    total: 0,
    activeDays: 0,
    average: 0,
    maxPoint: null,
  });
});

test('ignora fechas inválidas y montos no finitos', () => {
  const stats = buildDailyStats({
    transactions: [
      transaction({ id: 'invalid-date', date: 'no-es-una-fecha' }),
      transaction({ id: 'invalid-amount', totalAmount: Number.NaN }),
      transaction({ id: 'valid', date: DAY(10), totalAmount: 80 }),
    ],
    type: 'EXPENSE',
    year: 2026,
    monthIndex: 9,
    endDay: 12,
  });

  assert.equal(stats.total, 80);
  assert.deepEqual(stats.maxPoint, { day: 10, amount: 80 });
});

test('getMonthDayCount respeta febrero y los años bisiestos', () => {
  assert.equal(getMonthDayCount(2026, 1), 28);
  assert.equal(getMonthDayCount(2024, 1), 29);
  assert.equal(getMonthDayCount(2026, 9), 31);
});
