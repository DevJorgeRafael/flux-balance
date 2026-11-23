import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getGoalProgress,
  isFutureGoalDeadline,
  isValidGoalDeadline,
  isValidGoalName,
  requiredMonthlyContribution,
  simulateSavings,
} from './financial-twin.ts';

const TODAY = new Date('2026-02-15T12:00:00.000Z');

test('valida nombre y fecha límite de la meta', () => {
  assert.equal(isValidGoalName('Viaje a Japón'), true);
  assert.equal(isValidGoalName('   '), false);
  assert.equal(isValidGoalDeadline('2026-12-31'), true);
  assert.equal(isValidGoalDeadline('2026-02-30'), false);
  assert.equal(isValidGoalDeadline('2026-2-01'), false);
});

test('solo acepta fechas límite futuras', () => {
  assert.equal(isFutureGoalDeadline('2026-02-16', TODAY), true);
  assert.equal(isFutureGoalDeadline('2026-02-15', TODAY), true);
  assert.equal(isFutureGoalDeadline('2026-02-14', TODAY), false);
  assert.equal(isFutureGoalDeadline('2026-02-30', TODAY), false);
});

test('calcula progreso, meses restantes y cuota mensual', () => {
  const progress = getGoalProgress({
    targetAmount: 1200,
    currentBalance: 300,
    deadline: '2026-05-15',
    today: TODAY,
  });

  assert.equal(progress.ratio, 0.25);
  assert.equal(progress.remaining, 900);
  assert.equal(progress.daysLeft, 89);
  assert.equal(progress.monthlyRequired, 300);
  assert.equal(progress.reached, false);
});

test('una meta alcanzada no requiere aportaciones', () => {
  const progress = getGoalProgress({
    targetAmount: 100,
    currentBalance: 150,
    deadline: '2026-03-01',
    today: TODAY,
  });

  assert.equal(progress.ratio, 1);
  assert.equal(progress.remaining, 0);
  assert.equal(progress.monthlyRequired, 0);
  assert.equal(progress.reached, true);
});

test('simula aportaciones con interés compuesto mensual', () => {
  const result = simulateSavings({
    initialBalance: 1000,
    monthlyContribution: 100,
    annualRate: 0.12,
    months: 12,
  });

  assert.equal(result.series.length, 13);
  assert.ok(result.finalBalance > 1000 + 1200);
  assert.ok(result.totalInterest > 0);
  assert.equal(result.series[0].balance, 1000);
});

test('sin interés la simulación es lineal', () => {
  const result = simulateSavings({
    initialBalance: 0,
    monthlyContribution: 50,
    annualRate: 0,
    months: 6,
  });

  assert.equal(result.finalBalance, 300);
  assert.equal(result.totalInterest, 0);
});

test('calcula la cuota necesaria para alcanzar una meta', () => {
  const withoutInterest = requiredMonthlyContribution({
    target: 1200,
    initialBalance: 0,
    annualRate: 0,
    months: 12,
  });
  assert.equal(withoutInterest, 100);

  const withInterest = requiredMonthlyContribution({
    target: 1200,
    initialBalance: 0,
    annualRate: 0.12,
    months: 12,
  });
  assert.ok(withInterest < withoutInterest);

  assert.equal(
    requiredMonthlyContribution({
      target: 500,
      initialBalance: 600,
      annualRate: 0,
      months: 6,
    }),
    0
  );
});
