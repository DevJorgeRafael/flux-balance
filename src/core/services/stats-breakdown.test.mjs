import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OTHER_SLICE_ID,
  UNCATEGORIZED_SLICE_ID,
  buildMonthlyStats,
} from './stats-breakdown.ts';

const labels = { uncategorized: 'Sin categoría', other: 'Otros' };

function category(id, name, type = 'EXPENSE', color = null) {
  return {
    id,
    name,
    type,
    color,
    isDefault: true,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function transaction({
  id,
  type = 'EXPENSE',
  date = new Date(2026, 9, 15, 12).toISOString(),
  splits,
  totalAmount,
}) {
  const resolvedSplits =
    splits ??
    [
      {
        id: `${id}-split`,
        transactionId: id,
        accountId: 'account-1',
        categoryId: 'food',
        amount: totalAmount,
      },
    ];

  return {
    id,
    type,
    totalAmount: totalAmount ?? resolvedSplits.reduce((sum, split) => sum + split.amount, 0),
    date,
    createdAt: date,
    splits: resolvedSplits,
  };
}

function split(id, categoryId, amount) {
  return {
    id: `${id}-split`,
    transactionId: id,
    accountId: 'account-1',
    categoryId,
    amount,
  };
}

function build(transactions, categories, overrides = {}) {
  return buildMonthlyStats({
    transactions,
    categories,
    year: 2026,
    monthIndex: 9,
    labels,
    ...overrides,
  });
}

test('groups the selected month and type, sorts by amount and sums percentages to 100', () => {
  const categories = [
    category('food', 'Alimentación', 'EXPENSE', '#B45D22'),
    category('transport', 'Transporte', 'EXPENSE', '#B44922'),
    category('salary', 'Salario', 'INCOME', '#2767B0'),
  ];
  const transactions = [
    transaction({ id: 'tx-food', splits: [split('tx-food', 'food', 100)] }),
    transaction({ id: 'tx-transport', splits: [split('tx-transport', 'transport', 300)] }),
    transaction({
      id: 'tx-salary',
      type: 'INCOME',
      splits: [split('tx-salary', 'salary', 500)],
    }),
    transaction({
      id: 'tx-previous-month',
      date: new Date(2026, 8, 15, 12).toISOString(),
      splits: [split('tx-previous-month', 'food', 999)],
    }),
  ];

  const result = build(transactions, categories);

  assert.equal(result.expense.total, 400);
  assert.deepEqual(
    result.expense.slices.map(({ id, amount, percentage }) => ({ id, amount, percentage })),
    [
      { id: 'transport', amount: 300, percentage: 75 },
      { id: 'food', amount: 100, percentage: 25 },
    ]
  );
  assert.equal(result.expense.slices.reduce((sum, slice) => sum + slice.percentage, 0), 100);
  assert.equal(result.expense.slices[0]?.color, '#B44922');
  assert.equal(result.expense.slices[1]?.color, '#B45D22');

  assert.equal(result.income.total, 500);
  assert.equal(result.income.slices[0]?.id, 'salary');
  assert.equal(result.income.slices[0]?.percentage, 100);
  assert.equal(result.income.slices[0]?.color, '#2767B0');
});

test('groups missing or unknown categories as uncategorized', () => {
  const categories = [category('food', 'Alimentación')];
  const transactions = [
    transaction({
      id: 'tx-uncategorized',
      splits: [split('tx-uncategorized', '', 40), split('tx-uncategorized', 'missing', 60)],
    }),
  ];

  const result = build(transactions, categories);

  assert.equal(result.expense.total, 100);
  assert.equal(result.expense.slices[0]?.color, undefined);
  assert.deepEqual(
    result.expense.slices.map(({ id, name, amount, percentage, kind }) => ({
      id,
      name,
      amount,
      percentage,
      kind,
    })),
    [
      {
        id: UNCATEGORIZED_SLICE_ID,
        name: 'Sin categoría',
        amount: 100,
        percentage: 100,
        kind: 'uncategorized',
      },
    ]
  );
});

test('does not use a category from the opposite movement type', () => {
  const categories = [category('food', 'Alimentación', 'EXPENSE')];
  const transactions = [
    transaction({
      id: 'tx-wrong-type',
      type: 'INCOME',
      splits: [split('tx-wrong-type', 'food', 90)],
    }),
  ];

  const result = build(transactions, categories);

  assert.equal(result.income.total, 90);
  assert.deepEqual(
    result.income.slices.map(({ id, amount, kind }) => ({ id, amount, kind })),
    [{ id: UNCATEGORIZED_SLICE_ID, amount: 90, kind: 'uncategorized' }]
  );
});

test('ignores transfers and counts transactions without splits as uncategorized', () => {
  const categories = [category('food', 'Alimentación')];
  const transactions = [
    transaction({
      id: 'tx-transfer',
      type: 'TRANSFER',
      totalAmount: 500,
      splits: [],
    }),
    transaction({
      id: 'tx-no-splits',
      totalAmount: 80,
      splits: [],
    }),
  ];

  const result = build(transactions, categories);

  assert.equal(result.income.total, 0);
  assert.equal(result.expense.total, 80);
  assert.deepEqual(
    result.expense.slices.map(({ id, amount, kind }) => ({ id, amount, kind })),
    [{ id: UNCATEGORIZED_SLICE_ID, amount: 80, kind: 'uncategorized' }]
  );
});

test('returns an empty breakdown for a month without movements', () => {
  const result = build([], [category('food', 'Alimentación')]);

  assert.deepEqual(result.income, { total: 0, slices: [] });
  assert.deepEqual(result.expense, { total: 0, slices: [] });
});

test('rounds percentages with the largest remainder so they add up to 100', () => {
  const categories = [category('a', 'A'), category('b', 'B'), category('c', 'C')];
  const transactions = [
    transaction({ id: 'tx-a', splits: [split('tx-a', 'a', 1)] }),
    transaction({ id: 'tx-b', splits: [split('tx-b', 'b', 1)] }),
    transaction({ id: 'tx-c', splits: [split('tx-c', 'c', 1)] }),
  ];

  const result = build(transactions, categories);

  assert.deepEqual(
    result.expense.slices.map((slice) => slice.percentage),
    [34, 33, 33]
  );
  assert.equal(result.expense.slices.reduce((sum, slice) => sum + slice.percentage, 0), 100);
});

test('shows six categories and groups the rest into Other', () => {
  const categories = Array.from({ length: 8 }, (_, index) =>
    category(`category-${index + 1}`, `Categoría ${index + 1}`)
  );
  const amounts = [800, 700, 600, 500, 400, 300, 200, 100];
  const transactions = categories.map((item, index) =>
    transaction({
      id: `tx-${item.id}`,
      splits: [split(`tx-${item.id}`, item.id, amounts[index])],
    })
  );

  const result = build(transactions, categories);
  const other = result.expense.slices.find((slice) => slice.id === OTHER_SLICE_ID);

  assert.equal(result.expense.slices.length, 7);
  assert.ok(other);
  assert.equal(other.name, 'Otros');
  assert.equal(other.amount, 300);
  assert.equal(other.kind, 'other');
  assert.equal(other.color, undefined);
  assert.equal(result.expense.slices.reduce((sum, slice) => sum + slice.percentage, 0), 100);
});
