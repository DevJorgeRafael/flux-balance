import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAnticipationEvents,
  currentYearMonth,
  getBudgetProgress,
  isValidYearMonth,
  sumSpendingByCategory,
} from './anticipation.ts';

const TODAY = new Date('2026-02-15T12:00:00.000Z');

function budget(overrides = {}) {
  return {
    id: 'bud-1',
    categoryId: 'cat-1',
    type: 'EXPENSE',
    yearMonth: '2026-02',
    limitAmount: 100,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  };
}

function input(overrides = {}) {
  return {
    budgets: [],
    spending: {},
    deposits: [],
    accounts: [],
    today: TODAY,
    ...overrides,
  };
}

test('valida el formato de mes y lo obtiene de una fecha', () => {
  assert.equal(isValidYearMonth('2026-02'), true);
  assert.equal(isValidYearMonth('2026-13'), false);
  assert.equal(isValidYearMonth('2026-2'), false);
  assert.equal(currentYearMonth(TODAY), '2026-02');
});

test('suma el gasto del mes por categoría e ignora otros tipos y meses', () => {
  const spending = sumSpendingByCategory(
    [
      {
        type: 'EXPENSE',
        date: '2026-02-03',
        totalAmount: 60,
        splits: [
          { categoryId: 'cat-1', amount: 40 },
          { categoryId: 'cat-2', amount: 20 },
        ],
      },
      {
        type: 'EXPENSE',
        date: '2026-01-03',
        totalAmount: 50,
        splits: [{ categoryId: 'cat-1', amount: 50 }],
      },
      {
        type: 'INCOME',
        date: '2026-02-04',
        totalAmount: 100,
        splits: [{ categoryId: 'cat-1', amount: 100 }],
      },
    ],
    '2026-02'
  );

  assert.deepEqual(spending, { 'cat-1': 40, 'cat-2': 20 });
});

test('el progreso del presupuesto distingue aviso y exceso', () => {
  assert.deepEqual(getBudgetProgress(100, 50), { ratio: 0.5, severity: 'info' });
  assert.deepEqual(getBudgetProgress(100, 80), { ratio: 0.8, severity: 'warning' });
  assert.deepEqual(getBudgetProgress(100, 120), { ratio: 1.2, severity: 'critical' });
  assert.deepEqual(getBudgetProgress(0, 10), { ratio: 0, severity: 'info' });
});

test('genera avisos de presupuesto en aviso y exceso', () => {
  const events = buildAnticipationEvents(
    input({
      budgets: [budget(), budget({ id: 'bud-2', categoryId: 'cat-2', limitAmount: 50 })],
      spending: { 'cat-1': 85, 'cat-2': 60 },
    })
  );

  assert.deepEqual(
    events.map((event) => event.kind),
    ['BUDGET_WARNING', 'BUDGET_EXCEEDED']
  );
  assert.equal(events[0].ratio, 0.85);
  assert.equal(events[0].id, 'budget:bud-1:2026-02');
});

test('ignora presupuestos de otros meses', () => {
  const events = buildAnticipationEvents(
    input({ budgets: [budget({ yearMonth: '2026-01' })], spending: { 'cat-1': 500 } })
  );
  assert.deepEqual(events, []);
});

test('aviso de depósito próximo a vencer dentro de la ventana', () => {
  const events = buildAnticipationEvents(
    input({
      deposits: [
        {
          id: 'dep-1',
          accountId: 'acc-1',
          maturityDate: '2026-02-20',
          principalAmount: 1000,
        },
        {
          id: 'dep-2',
          accountId: 'acc-1',
          maturityDate: '2026-03-20',
          principalAmount: 1000,
        },
      ],
      maturingDays: 7,
    })
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'DEPOSIT_MATURING');
  assert.equal(events[0].days, 5);
});

test('aviso de saldo bajo y de gasto atípico', () => {
  const events = buildAnticipationEvents(
    input({
      accounts: [
        { id: 'acc-1', balance: 50 },
        { id: 'acc-2', balance: 500 },
      ],
      lowBalanceThreshold: 100,
      averageDailySpend: 20,
      todaySpend: 45,
    })
  );

  assert.deepEqual(
    events.map((event) => event.kind),
    ['LOW_BALANCE', 'SPENDING_SPIKE']
  );
  assert.equal(events[0].accountId, 'acc-1');
});
