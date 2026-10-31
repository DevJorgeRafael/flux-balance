import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getBackupFileName,
  hasBackupData,
  serializeBackup,
} from './backup-format.ts';
import { parseBackupText, validateBackup } from './backup-validation.ts';

const TIMESTAMP = '2026-01-02T10:00:00.000Z';

function createValidBackup() {
  return {
    format: 'flux-balance-backup',
    schemaVersion: 1,
    appVersion: '1.5.5',
    exportedAt: TIMESTAMP,
    currency: 'EUR',
    accounts: [
      {
        id: 'acc-1',
        name: 'Cuenta principal',
        type: 'CHECKING',
        balance: 1000,
        currency: 'EUR',
        annualRate: null,
        isArchived: false,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        fixedTermDeposits: [
          {
            id: 'dep-1',
            accountId: 'acc-1',
            principalAmount: 500,
            annualRate: 0.4,
            termMonths: 3,
            startDate: '2026-01-01',
            maturityDate: '2026-04-01',
            status: 'ACTIVE',
            createdAt: TIMESTAMP,
          },
        ],
      },
    ],
    incomeCategories: [
      {
        id: 'cat-inc-1',
        name: 'Salario',
        type: 'INCOME',
        color: null,
        icon: null,
        isDefault: false,
        sortOrder: 0,
        createdAt: TIMESTAMP,
      },
    ],
    expenseCategories: [
      {
        id: 'cat-exp-1',
        name: 'Supermercado',
        type: 'EXPENSE',
        color: '#B45D22',
        icon: 'shopping-cart',
        isDefault: false,
        sortOrder: 0,
        createdAt: TIMESTAMP,
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        totalAmount: 25,
        description: 'Compra',
        date: '2026-01-02',
        createdAt: TIMESTAMP,
        splits: [
          {
            id: 'split-1',
            transactionId: 'tx-1',
            accountId: 'acc-1',
            categoryId: 'cat-exp-1',
            amount: 25,
            notes: null,
          },
        ],
      },
    ],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstError(result) {
  assert.equal(result.ok, false);
  return result.errors[0];
}

test('acepta un respaldo válido y devuelve el resumen', () => {
  const backup = createValidBackup();
  const result = parseBackupText(JSON.stringify(backup));

  assert.equal(result.ok, true);
  assert.deepEqual(result.preview, {
    accounts: 1,
    incomeCategories: 1,
    expenseCategories: 1,
    transactions: 1,
    exportedAt: TIMESTAMP,
    currency: 'EUR',
    appVersion: '1.5.5',
    schemaVersion: 1,
  });
  assert.equal(result.backup.accounts[0].fixedTermDeposits.length, 1);
  assert.equal(result.backup.transactions[0].splits.length, 1);
});

test('rechaza un archivo que no es JSON', () => {
  const error = firstError(parseBackupText('{ esto no es json'));

  assert.equal(error.code, 'invalidJson');
});

test('rechaza un JSON con formato incorrecto', () => {
  const backup = createValidBackup();
  backup.format = 'otra-app';

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'invalidFormat');
  assert.equal(error.path, 'format');
});

test('rechaza un respaldo de una versión futura', () => {
  const backup = createValidBackup();
  backup.schemaVersion = 2;

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'futureSchemaVersion');
  assert.deepEqual(error.params, { version: 2, supported: 1 });
});

test('rechaza un respaldo con un campo obligatorio faltante', () => {
  const backup = createValidBackup();
  delete backup.accounts[0].name;

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'missingField');
  assert.equal(error.path, 'accounts[0].name');
});

test('rechaza montos inválidos', () => {
  const backup = createValidBackup();
  backup.accounts[0].balance = 'mucho';

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'invalidAmount');
  assert.equal(error.path, 'accounts[0].balance');
});

test('rechaza montos negativos o demasiado grandes', () => {
  const negative = createValidBackup();
  negative.accounts[0].balance = -1;
  assert.equal(firstError(validateBackup(negative)).code, 'invalidAmount');

  const tooLarge = createValidBackup();
  tooLarge.transactions[0].totalAmount = 1_000_000_000_001;
  const error = firstError(validateBackup(tooLarge));

  assert.equal(error.code, 'invalidAmount');
  assert.equal(error.path, 'transactions[0].totalAmount');
});

test('rechaza ids inválidos, vacíos o demasiado largos', () => {
  const invalid = createValidBackup();
  invalid.accounts[0].id = 'cuenta con espacios';
  const invalidError = firstError(validateBackup(invalid));

  assert.equal(invalidError.code, 'invalidId');
  assert.equal(invalidError.path, 'accounts[0].id');

  const empty = createValidBackup();
  empty.accounts[0].id = '';
  const emptyError = firstError(validateBackup(empty));

  assert.equal(emptyError.code, 'invalidId');
  assert.equal(emptyError.path, 'accounts[0].id');

  const long = createValidBackup();
  long.transactions[0].id = 'a'.repeat(129);
  const longError = firstError(validateBackup(long));

  assert.equal(longError.code, 'invalidId');
  assert.equal(longError.path, 'transactions[0].id');
});

test('rechaza fechas inexistentes', () => {
  const backup = createValidBackup();
  backup.accounts[0].createdAt = '2026-02-30T10:00:00.000Z';

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'invalidDate');
  assert.equal(error.path, 'accounts[0].createdAt');
});

test('rechaza una suma de splits que no coincide con el total', () => {
  const backup = createValidBackup();
  backup.transactions[0].splits[0].amount = 24;

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'invalidSplitTotal');
  assert.equal(error.path, 'transactions[0].splits');
  assert.deepEqual(error.params, { expected: 25, actual: 24 });
});

test('acepta la tolerancia de redondeo en la suma de splits', () => {
  const backup = createValidBackup();
  const baseSplit = backup.transactions[0].splits[0];
  backup.transactions[0].totalAmount = 0.3;
  backup.transactions[0].splits = [
    { ...baseSplit, id: 'split-1', amount: 0.1 },
    { ...baseSplit, id: 'split-2', amount: 0.2 },
  ];

  const result = validateBackup(backup);

  assert.equal(result.ok, true);
});

test('rechaza respaldos que superan los límites de elementos', () => {
  const accounts = createValidBackup();
  const baseAccount = accounts.accounts[0];
  accounts.accounts = Array.from({ length: 1001 }, (_, index) => ({
    ...clone(baseAccount),
    id: `acc-${index}`,
    name: `Cuenta ${index}`,
  }));

  const accountsError = firstError(validateBackup(accounts));
  assert.equal(accountsError.code, 'tooManyItems');
  assert.equal(accountsError.path, 'accounts');

  const splits = createValidBackup();
  const baseSplit = splits.transactions[0].splits[0];
  splits.transactions[0].splits = Array.from(
    { length: 101 },
    (_, index) => ({
      ...clone(baseSplit),
      id: `split-${index}`,
    })
  );

  const splitsError = firstError(validateBackup(splits));
  assert.equal(splitsError.code, 'tooManyItems');
  assert.equal(splitsError.path, 'transactions[0].splits');
});

test('rechaza referencias a cuentas inexistentes', () => {
  const backup = createValidBackup();
  backup.transactions[0].splits[0].accountId = 'acc-inexistente';

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'missingAccount');
  assert.equal(error.path, 'transactions[0].splits[0].accountId');
  assert.deepEqual(error.params, { id: 'acc-inexistente' });
});

test('rechaza referencias a categorías inexistentes', () => {
  const backup = createValidBackup();
  backup.transactions[0].splits[0].categoryId = 'cat-inexistente';

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'missingCategory');
  assert.equal(error.path, 'transactions[0].splits[0].categoryId');
  assert.deepEqual(error.params, { id: 'cat-inexistente', type: 'EXPENSE' });
});

test('rechaza ids duplicados', () => {
  const backup = createValidBackup();
  backup.accounts.push({ ...clone(backup.accounts[0]), name: 'Duplicada' });

  const error = firstError(validateBackup(backup));

  assert.equal(error.code, 'duplicateId');
  assert.equal(error.path, 'accounts[1].id');
  assert.deepEqual(error.params, { id: 'acc-1' });
});

test('migra un respaldo de la versión 0 a la versión 1', () => {
  const backup = createValidBackup();
  backup.schemaVersion = 0;
  delete backup.accounts[0].annualRate;
  delete backup.accounts[0].isArchived;
  delete backup.accounts[0].fixedTermDeposits;
  delete backup.incomeCategories[0].type;
  delete backup.incomeCategories[0].isDefault;
  delete backup.incomeCategories[0].sortOrder;
  delete backup.incomeCategories[0].createdAt;
  delete backup.expenseCategories[0].type;
  delete backup.expenseCategories[0].isDefault;
  delete backup.expenseCategories[0].sortOrder;
  delete backup.expenseCategories[0].createdAt;
  delete backup.transactions[0].description;
  delete backup.transactions[0].createdAt;
  delete backup.transactions[0].splits[0].notes;

  const result = validateBackup(backup);

  assert.equal(result.ok, true);
  assert.equal(result.backup.schemaVersion, 1);
  assert.equal(result.backup.accounts[0].annualRate, null);
  assert.equal(result.backup.accounts[0].isArchived, false);
  assert.deepEqual(result.backup.accounts[0].fixedTermDeposits, []);
  assert.equal(result.backup.incomeCategories[0].type, 'INCOME');
  assert.equal(result.backup.expenseCategories[0].type, 'EXPENSE');
  assert.equal(result.backup.transactions[0].description, null);
  assert.equal(result.backup.transactions[0].createdAt, '2026-01-02');
  assert.equal(result.backup.transactions[0].splits[0].notes, null);
});

test('serializa el respaldo con salto de línea y detecta datos', () => {
  const backup = createValidBackup();
  const text = serializeBackup(backup);

  assert.ok(text.endsWith('\n'));
  assert.deepEqual(JSON.parse(text), backup);
  assert.equal(hasBackupData(backup), true);
  assert.equal(
    hasBackupData({
      accounts: [],
      incomeCategories: [],
      expenseCategories: [],
      transactions: [],
    }),
    false
  );
});

test('genera el nombre de archivo de exportación estable', () => {
  const date = new Date(2026, 0, 2, 3, 4, 5);

  assert.equal(getBackupFileName(date), 'flux-balance-backup-2026-01-02.json');
});
