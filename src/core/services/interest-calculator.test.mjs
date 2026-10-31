import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDailyProjection,
  calculateFixedTermMaturity,
  calculateMonthlyGain,
} from './interest-calculator.ts';

test('calcula la ganancia mensual y el vencimiento', () => {
  assert.equal(calculateMonthlyGain(1000, 12), 10);
  assert.equal(calculateFixedTermMaturity(1000, 12, 12), 1120);
});

test('acepta capital y tasa cero', () => {
  assert.equal(calculateMonthlyGain(0, 0), 0);
  assert.equal(calculateFixedTermMaturity(0, 0, 1), 0);
  assert.deepEqual(calculateDailyProjection(0, 0, 1), [
    { day: 1, balance: 0, interestEarned: 0 },
  ]);
});

test('genera una proyección diaria finita', () => {
  const projection = calculateDailyProjection(1000, 12, 30);

  assert.equal(projection.length, 30);
  assert.equal(projection[0].day, 1);
  assert.equal(projection[29].day, 30);
  assert.ok(projection[29].balance > 1000);
  assert.ok(Number.isFinite(projection[29].balance));
});

test('rechaza valores no válidos con RangeError', () => {
  assert.throws(() => calculateMonthlyGain(-1, 12), RangeError);
  assert.throws(() => calculateMonthlyGain(1000, Number.NaN), RangeError);
  assert.throws(() => calculateFixedTermMaturity(1000, 12, 0), RangeError);
  assert.throws(() => calculateFixedTermMaturity(1000, 12, 1.5), RangeError);
  assert.throws(() => calculateDailyProjection(1000, 12, 0), RangeError);
  assert.throws(
    () => calculateDailyProjection(1000, Number.POSITIVE_INFINITY, 30),
    RangeError
  );
});
