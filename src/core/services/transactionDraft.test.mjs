import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseTransactionDraft,
  serializeTransactionDraft,
} from './transactionDraft.ts';

function draft() {
  return {
    type: 'EXPENSE',
    amount: '12,50',
    description: 'Café',
    accountId: 'acc_1',
    destinationAccountId: 'acc_2',
    categoryId: 'cat_exp_food',
  };
}

test('parseTransactionDraft reconstruye un borrador válido', () => {
  assert.deepEqual(parseTransactionDraft(serializeTransactionDraft(draft())), draft());
});

test('parseTransactionDraft rechaza datos ausentes o corruptos', () => {
  assert.equal(parseTransactionDraft(null), null);
  assert.equal(parseTransactionDraft(''), null);
  assert.equal(parseTransactionDraft('{no-es-json'), null);
  assert.equal(parseTransactionDraft(JSON.stringify({ type: 'OTRO' })), null);
  assert.equal(
    parseTransactionDraft(JSON.stringify({ ...draft(), description: 42 })),
    null
  );
});
