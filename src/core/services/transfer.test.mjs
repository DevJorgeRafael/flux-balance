import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TRANSFER_DESTINATION_INDEX,
  TRANSFER_SOURCE_INDEX,
  buildReconciliationDraft,
  buildTransferDraft,
  getSplitBalanceDelta,
  getTransferBalanceDelta,
  isTransferDraftValid,
  validateTransferInput,
} from './transfer.ts';

const DATE = '2026-02-01T09:00:00.000Z';

function validInput() {
  return {
    sourceAccountId: 'acc-origin',
    destinationAccountId: 'acc-target',
    amount: 150,
    date: DATE,
    description: 'Mover a ahorro',
  };
}

test('construye una transferencia con dos divisiones en orden origen y destino', () => {
  const result = buildTransferDraft(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.draft.type, 'TRANSFER');
  assert.equal(result.draft.totalAmount, 150);
  assert.deepEqual(
    result.draft.splits.map((split) => split.accountId),
    ['acc-origin', 'acc-target']
  );
  assert.equal(isTransferDraftValid(result.draft), true);
});

test('rechaza cuentas iguales, importes inválidos y fechas inválidas', () => {
  assert.equal(
    validateTransferInput({ ...validInput(), destinationAccountId: 'acc-origin' }),
    'invalidAccounts'
  );
  assert.equal(validateTransferInput({ ...validInput(), amount: 0 }), 'invalidAmount');
  assert.equal(validateTransferInput({ ...validInput(), amount: -1 }), 'invalidAmount');
  assert.equal(validateTransferInput({ ...validInput(), date: 'no-fecha' }), 'invalidDate');
});

test('rechaza descripciones demasiado largas', () => {
  const description = 'x'.repeat(201);
  assert.equal(
    validateTransferInput({ ...validInput(), description }),
    'descriptionTooLong'
  );
});

test('el delta de saldo depende del tipo y del lado de la transferencia', () => {
  assert.equal(getSplitBalanceDelta('INCOME', 0, 100), 100);
  assert.equal(getSplitBalanceDelta('EXPENSE', 0, 100), -100);
  assert.equal(getSplitBalanceDelta('TRANSFER', TRANSFER_SOURCE_INDEX, 100), -100);
  assert.equal(
    getSplitBalanceDelta('TRANSFER', TRANSFER_DESTINATION_INDEX, 100),
    100
  );
  assert.throws(() => getSplitBalanceDelta('TRANSFER', 2, 100));
});

test('calcula el efecto neto por cuenta en una transferencia', () => {
  const splits = [
    { accountId: 'acc-origin', amount: 150 },
    { accountId: 'acc-target', amount: 150 },
  ];

  assert.equal(getTransferBalanceDelta(splits, 'acc-origin'), -150);
  assert.equal(getTransferBalanceDelta(splits, 'acc-target'), 150);
  assert.equal(getTransferBalanceDelta(splits, 'otra'), 0);
});

test('rechaza borradores de transferencia incompletos', () => {
  const draft = buildTransferDraft(validInput()).draft;

  assert.equal(isTransferDraftValid({ ...draft, splits: draft.splits.slice(0, 1) }), false);
  assert.equal(isTransferDraftValid({ ...draft, type: 'INCOME' }), false);
  const repeated = { ...draft, splits: [draft.splits[0], { ...draft.splits[1], accountId: 'acc-origin' }] };
  assert.equal(isTransferDraftValid(repeated), false);
});

test('la conciliación genera un ingreso, un gasto o nada según la diferencia', () => {
  const base = {
    accountId: 'acc-1',
    date: DATE,
    description: 'Ajuste de saldo',
    currentBalance: 100,
  };

  const income = buildReconciliationDraft({ ...base, expectedBalance: 125 });
  assert.equal(income?.type, 'INCOME');
  assert.equal(income?.totalAmount, 25);
  assert.equal(income?.splits[0].accountId, 'acc-1');

  const expense = buildReconciliationDraft({ ...base, expectedBalance: 80 });
  assert.equal(expense?.type, 'EXPENSE');
  assert.equal(expense?.totalAmount, 20);

  assert.equal(buildReconciliationDraft({ ...base, expectedBalance: 100 }), null);
});

test('la conciliación respeta los decimales y rechaza datos inválidos', () => {
  const base = {
    accountId: 'acc-1',
    date: DATE,
    description: 'Ajuste',
    currentBalance: 100,
  };

  const draft = buildReconciliationDraft(
    { ...base, expectedBalance: 100.004 },
    2
  );
  assert.equal(draft, null);

  assert.equal(
    buildReconciliationDraft({ ...base, accountId: '', expectedBalance: 110 }),
    null
  );
  assert.equal(
    buildReconciliationDraft({ ...base, date: 'fecha', expectedBalance: 110 }),
    null
  );
  assert.equal(
    buildReconciliationDraft({ ...base, expectedBalance: Number.NaN }),
    null
  );
});
