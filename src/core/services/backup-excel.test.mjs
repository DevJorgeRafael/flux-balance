import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';

import {
  createExcelTemplateBytes,
  createExcelWorkbookBytes,
  parseExcelWorkbookBytes,
} from './backup-excel.ts';
import {
  ACCOUNT_COLUMNS,
  CATEGORY_COLUMNS,
  MOVEMENT_COLUMNS,
  getHeaders,
  getSheetName,
  isoToExcelSerial,
} from './backup-excel-format.ts';

const TIMESTAMP = '2026-01-02T10:00:00.000Z';
const NOW = '2026-01-02T10:00:00.000Z';

function createBackup() {
  return {
    format: 'flux-balance-backup',
    schemaVersion: 1,
    appVersion: '1.6.0',
    exportedAt: TIMESTAMP,
    currency: 'EUR',
    accounts: [
      {
        id: 'acc-1',
        name: 'Cuenta principal',
        type: 'FIXED_TERM',
        balance: 1000,
        currency: 'EUR',
        annualRate: 0.25,
        isArchived: false,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        fixedTermDeposits: [
          {
            id: 'dep-1',
            accountId: 'acc-1',
            principalAmount: 500,
            annualRate: 0.25,
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
            amount: 10,
            notes: 'Primera parte',
          },
          {
            id: 'split-2',
            transactionId: 'tx-1',
            accountId: 'acc-1',
            categoryId: 'cat-exp-1',
            amount: 15,
            notes: null,
          },
        ],
      },
    ],
  };
}

function visibleHeaders(columns, language) {
  return getHeaders(
    columns.filter((column) => !column.hidden),
    language
  );
}

function workbookBytes(workbook) {
  return new Uint8Array(
    XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true,
    })
  );
}

function createMinimalWorkbook({
  language = 'es',
  movementHeaders,
  movementRows,
  accountRows: customAccountRows,
  categoryRows: customCategoryRows,
  deleteMovements = false,
} = {}) {
  const workbook = XLSX.utils.book_new();
  const accountRows = customAccountRows ?? [
    ['Cuenta', 'Corriente', '1.234,56', 'EUR', null, 'No'],
  ];
  const categoryRows = customCategoryRows ?? [
    ['Salario', 'Ingreso', null, null, 'No', 0],
    ['Comida', 'Gasto', null, null, 'No', 1],
  ];
  const rows =
    movementRows ??
    [
      [
        isoToExcelSerial('2026-01-02'),
        'Gasto',
        'Cuenta',
        'Comida',
        'Compra',
        '12,50',
      ],
    ];

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      visibleHeaders(ACCOUNT_COLUMNS, language),
      ...accountRows,
    ]),
    getSheetName('accounts', language)
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      visibleHeaders(CATEGORY_COLUMNS, language),
      ...categoryRows,
    ]),
    getSheetName('categories', language)
  );
  if (!deleteMovements) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        movementHeaders ?? visibleHeaders(MOVEMENT_COLUMNS, language),
        ...rows,
      ]),
      getSheetName('movements', language)
    );
  }
  return workbook;
}

function parseWorkbook(workbook, language = 'es') {
  return parseExcelWorkbookBytes(workbookBytes(workbook), {
    language,
    appVersion: '1.6.0',
    fallbackCurrency: 'EUR',
    now: NOW,
  });
}

function firstError(result) {
  assert.equal(result.ok, false);
  return result.errors[0];
}

test('exporta e importa cuentas, depósitos y splits sin perder metadatos', () => {
  const backup = createBackup();
  const bytes = createExcelWorkbookBytes(backup, 'es');
  const result = parseExcelWorkbookBytes(bytes, {
    language: 'es',
    appVersion: '1.6.0',
    fallbackCurrency: 'EUR',
    now: NOW,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.backup, backup);
  assert.equal(result.preview.accounts, 1);
  assert.equal(result.preview.transactions, 1);
});

test('acepta hojas y encabezados en inglés', () => {
  const backup = createBackup();
  const bytes = createExcelWorkbookBytes(backup, 'en');
  const result = parseExcelWorkbookBytes(bytes, {
    language: 'en',
    appVersion: '1.6.0',
    fallbackCurrency: 'USD',
    now: NOW,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.backup, backup);
});

test('acepta fechas seriales y números con coma decimal sin columnas ocultas', () => {
  const result = parseWorkbook(createMinimalWorkbook());

  assert.equal(result.ok, true);
  assert.equal(result.backup.accounts[0].balance, 1234.56);
  assert.equal(result.backup.transactions[0].totalAmount, 12.5);
  assert.equal(result.backup.transactions[0].date, '2026-01-02');
  assert.equal(result.backup.transactions[0].splits[0].amount, 12.5);
});

test('rechaza una hoja faltante con ubicación', () => {
  const error = firstError(
    parseWorkbook(createMinimalWorkbook({ deleteMovements: true }))
  );

  assert.equal(error.code, 'missingSheet');
  assert.equal(error.sheet, 'Movimientos');
});

test('rechaza una columna faltante con hoja y columna', () => {
  const headers = visibleHeaders(MOVEMENT_COLUMNS, 'es').filter(
    (header) => header !== 'Monto'
  );
  const error = firstError(
    parseWorkbook(createMinimalWorkbook({ movementHeaders: headers }))
  );

  assert.equal(error.code, 'missingColumn');
  assert.equal(error.sheet, 'Movimientos');
  assert.equal(error.column, 'Monto');
});

test('rechaza una categoría inexistente', () => {
  const workbook = createMinimalWorkbook({
    movementRows: [
      [
        isoToExcelSerial('2026-01-02'),
        'Gasto',
        'Cuenta',
        'No existe',
        'Compra',
        10,
      ],
    ],
  });
  const error = firstError(parseWorkbook(workbook));

  assert.equal(error.code, 'unknownCategory');
  assert.equal(error.sheet, 'Movimientos');
  assert.equal(error.row, 2);
});

test('rechaza una cuenta inexistente', () => {
  const workbook = createMinimalWorkbook({
    movementRows: [
      [
        isoToExcelSerial('2026-01-02'),
        'Gasto',
        'No existe',
        'Comida',
        'Compra',
        10,
      ],
    ],
  });
  const error = firstError(parseWorkbook(workbook));

  assert.equal(error.code, 'unknownAccount');
  assert.equal(error.sheet, 'Movimientos');
});

test('rechaza un monto no positivo', () => {
  const workbook = createMinimalWorkbook({
    movementRows: [
      [
        isoToExcelSerial('2026-01-02'),
        'Gasto',
        'Cuenta',
        'Comida',
        'Compra',
        0,
      ],
    ],
  });
  const error = firstError(parseWorkbook(workbook));

  assert.equal(error.code, 'invalidPositiveAmount');
  assert.equal(error.sheet, 'Movimientos');
});

test('rechaza montos negativos o demasiado grandes en Excel', () => {
  const negative = createMinimalWorkbook({
    movementRows: [
      [
        isoToExcelSerial('2026-01-02'),
        'Gasto',
        'Cuenta',
        'Comida',
        'Compra',
        -5,
      ],
    ],
  });
  const negativeError = firstError(parseWorkbook(negative));
  assert.equal(negativeError.code, 'invalidAmount');
  assert.equal(negativeError.sheet, 'Movimientos');

  const tooLarge = createMinimalWorkbook({
    movementRows: [
      [
        isoToExcelSerial('2026-01-02'),
        'Gasto',
        'Cuenta',
        'Comida',
        'Compra',
        1_000_000_000_001,
      ],
    ],
  });
  const tooLargeError = firstError(parseWorkbook(tooLarge));
  assert.equal(tooLargeError.code, 'invalidAmount');
  assert.equal(tooLargeError.sheet, 'Movimientos');
});

test('rechaza un saldo negativo en la hoja de cuentas', () => {
  const workbook = createMinimalWorkbook({
    accountRows: [['Cuenta', 'Corriente', '-1', 'EUR', null, 'No']],
  });
  const error = firstError(parseWorkbook(workbook));

  assert.equal(error.code, 'invalidAmount');
  assert.equal(error.sheet, 'Cuentas');
});

test('rechaza un serial de fecha fuera de rango', () => {
  const workbook = createMinimalWorkbook({
    movementRows: [
      [
        1_000_000_000,
        'Gasto',
        'Cuenta',
        'Comida',
        'Compra',
        10,
      ],
    ],
  });
  const error = firstError(parseWorkbook(workbook));

  assert.equal(error.code, 'invalidDate');
  assert.equal(error.sheet, 'Movimientos');
});

test('rechaza ids inválidos en los metadatos de Excel', () => {
  const backup = createBackup();
  backup.accounts[0].id = 'cuenta con espacios';
  const bytes = createExcelWorkbookBytes(backup, 'es');
  const result = parseExcelWorkbookBytes(bytes, {
    language: 'es',
    appVersion: '1.6.0',
    fallbackCurrency: 'EUR',
    now: NOW,
  });
  const error = firstError(result);

  assert.equal(error.code, 'invalidId');
  assert.equal(error.sheet, 'Cuentas');
});

test('rechaza demasiados splits agrupados en Excel', () => {
  const backup = createBackup();
  const baseSplit = backup.transactions[0].splits[0];
  backup.transactions[0].splits = Array.from(
    { length: 101 },
    (_, index) => ({
      ...baseSplit,
      id: `split-${index}`,
      amount: 0.1,
    })
  );
  backup.transactions[0].totalAmount = 10.1;

  const bytes = createExcelWorkbookBytes(backup, 'es');
  const result = parseExcelWorkbookBytes(bytes, {
    language: 'es',
    appVersion: '1.6.0',
    fallbackCurrency: 'EUR',
    now: NOW,
  });
  const error = firstError(result);

  assert.equal(error.code, 'tooManyItems');
  assert.equal(error.sheet, 'Movimientos');
});

test('genera una plantilla vacía con las tres hojas', () => {
  const bytes = createExcelTemplateBytes(
    'es',
    '1.6.0',
    'EUR',
    TIMESTAMP
  );
  const workbook = XLSX.read(bytes, { type: 'array' });
  assert.deepEqual(workbook.SheetNames, ['Cuentas', 'Categorías', 'Movimientos']);

  const result = parseExcelWorkbookBytes(bytes, {
    language: 'es',
    appVersion: '1.6.0',
    fallbackCurrency: 'EUR',
    now: NOW,
  });
  assert.equal(result.ok, true);
  assert.equal(result.preview.accounts, 0);
});
