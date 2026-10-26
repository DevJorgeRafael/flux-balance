import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from './schema.sql.ts';
import { DEMO_ACCOUNT_IDS, buildDemoDataSet } from './demoData.ts';

const loadedAt = new Date('2026-10-26T18:30:00.000Z');

test('creates two accounts with five movements each on the load date', () => {
  const data = buildDemoDataSet(loadedAt);

  assert.equal(data.accounts.length, 2);
  assert.equal(data.transactions.length, 10);

  for (const accountId of Object.values(DEMO_ACCOUNT_IDS)) {
    const accountTransactions = data.transactions.filter(
      (transaction) => transaction.split.accountId === accountId
    );

    assert.equal(accountTransactions.length, 5);
    assert.ok(accountTransactions.length >= 4 && accountTransactions.length <= 6);
  }

  assert.ok(data.transactions.every((transaction) => transaction.date === loadedAt.toISOString()));
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

  assert.equal(new Set(data.transactions.map((transaction) => transaction.split.categoryId)).size, 10);
});

test('sets balances from the opening balance plus the seeded movements', () => {
  const data = buildDemoDataSet(loadedAt);
  const balances = new Map(data.accounts.map((account) => [account.id, account.balance]));

  assert.equal(balances.get(DEMO_ACCOUNT_IDS.checking), 1274500);
  assert.equal(balances.get(DEMO_ACCOUNT_IDS.savings), 524000);
});
