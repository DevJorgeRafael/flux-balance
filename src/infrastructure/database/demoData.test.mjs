import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from './schema.sql.ts';
import { isPaletteColor } from '../../core/constants/categoryPalettes.ts';
import { DEMO_ACCOUNT_IDS, buildDemoDataSet } from './demoData.ts';

const loadedAt = new Date('2026-10-26T18:30:00.000Z');
const WINDOW_DAYS = 21;

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffInDays(later, earlier) {
  return Math.round(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) / 86_400_000
  );
}

function countMovementsByDay(transactions) {
  const counts = new Map();

  for (const transaction of transactions) {
    const key = startOfDay(transaction.date).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

test('creates two accounts with movements across the last three weeks', () => {
  const data = buildDemoDataSet(loadedAt);

  assert.equal(data.accounts.length, 2);
  assert.equal(data.transactions.length, 29);

  const countsByDay = countMovementsByDay(data.transactions);
  const emptyDays = WINDOW_DAYS - countsByDay.size;
  const multiMovementDays = [...countsByDay.values()].filter(
    (count) => count >= 2 && count <= 3
  ).length;

  assert.equal(countsByDay.size, 15);
  assert.equal(emptyDays, 6);
  assert.equal(multiMovementDays, 10);
  assert.ok([...countsByDay.values()].every((count) => count <= 3));

  const dates = data.transactions.map((transaction) => new Date(transaction.date));
  const earliest = new Date(Math.min(...dates.map((date) => date.getTime())));
  const latest = new Date(Math.max(...dates.map((date) => date.getTime())));

  assert.equal(diffInDays(loadedAt, earliest), 19);
  assert.equal(diffInDays(loadedAt, latest), 0);

  for (const accountId of Object.values(DEMO_ACCOUNT_IDS)) {
    const accountTransactions = data.transactions.filter(
      (transaction) => transaction.split.accountId === accountId
    );

    assert.ok(accountTransactions.length >= 10);
  }

  for (const account of data.accounts) {
    assert.ok(new Date(account.createdAt) < earliest);
  }
});

test('alternates income and expense movements', () => {
  const data = buildDemoDataSet(loadedAt);
  const types = data.transactions.map((transaction) => transaction.type);

  assert.equal(types.filter((type) => type === 'INCOME').length, 15);
  assert.equal(types.filter((type) => type === 'EXPENSE').length, 14);

  for (let index = 1; index < types.length; index++) {
    assert.notEqual(types[index], types[index - 1]);
  }
});

test('uses only matching default categories for every movement', () => {
  const data = buildDemoDataSet(loadedAt);
  const categoriesById = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));

  for (const transaction of data.transactions) {
    const category = categoriesById.get(transaction.split.categoryId);

    assert.ok(category, `Unknown category: ${transaction.split.categoryId}`);
    assert.equal(category.type, transaction.type);
    assert.equal(transaction.split.amount, transaction.totalAmount);
  }

  assert.equal(
    new Set(data.transactions.map((transaction) => transaction.split.categoryId)).size,
    DEFAULT_CATEGORIES.length
  );
});

test('uses a distinct palette color for every default category of each type', () => {
  for (const type of ['INCOME', 'EXPENSE']) {
    const categories = DEFAULT_CATEGORIES.filter((category) => category.type === type);

    assert.equal(
      new Set(categories.map((category) => category.color)).size,
      categories.length
    );

    for (const category of categories) {
      assert.ok(
        isPaletteColor(type, category.color),
        `${category.id} color is outside the ${type} palette`
      );
    }
  }
});

test('keeps amounts and balances realistic for USD', () => {
  const data = buildDemoDataSet(loadedAt);
  const salary = data.transactions.find(
    (transaction) => transaction.split.categoryId === 'cat_inc_salary'
  );

  assert.ok(salary);
  assert.equal(salary.type, 'INCOME');
  assert.equal(salary.totalAmount, 482);
  assert.ok(
    data.transactions.every(
      (transaction) => transaction.totalAmount > 0 && transaction.totalAmount <= 1000
    )
  );
  assert.ok(
    data.accounts.every((account) => account.balance > 0 && account.balance < 10000)
  );
});

test('sets balances from the opening balance plus the seeded movements', () => {
  const data = buildDemoDataSet(loadedAt);
  const balances = new Map(data.accounts.map((account) => [account.id, account.balance]));

  assert.equal(balances.get(DEMO_ACCOUNT_IDS.checking), 1682.55);
  assert.equal(balances.get(DEMO_ACCOUNT_IDS.savings), 3549);
});
