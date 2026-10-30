import type { WorkBook, WorkSheet } from 'xlsx';
import * as XLSXImport from 'xlsx/dist/xlsx.mini.min.js';
import type { BackupFile } from '../models/backup';
import { createBackupFile } from './backup-format';
import {
  ACCOUNT_COLUMNS,
  CATEGORY_COLUMNS,
  MOVEMENT_COLUMNS,
  formatAccountType,
  formatBoolean,
  formatCategoryType,
  formatDepositStatus,
  formatDepositType,
  formatTransactionType,
  getHeaders,
  getSheetName,
  isDateOnlyIso,
  isoToExcelSerial,
  type ExcelColumnDefinition,
  type ExcelLanguage,
} from './backup-excel-format';
import {
  parseExcelWorkbook,
  type ExcelParseOptions,
} from './backup-excel-parse';

type XLSXModule = typeof XLSXImport;
const XLSX = (
  (XLSXImport as unknown as { default?: XLSXModule }).default ?? XLSXImport
) as XLSXModule;

interface DateCell {
  rowIndex: number;
  columnIndex: number;
  format: string;
}

function encodeColumn(index: number): string {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function setCellFormat(
  worksheet: WorkSheet,
  rowIndex: number,
  columnIndex: number,
  format: string
): void {
  const address = `${encodeColumn(columnIndex)}${rowIndex + 2}`;
  const cell = (worksheet as Record<string, unknown>)[address] as
    | { v?: unknown; z?: string }
    | undefined;
  if (cell && typeof cell.v === 'number') {
    cell.z = format;
  }
}

function columnWidth(column: ExcelColumnDefinition): number {
  switch (column.key) {
    case 'name':
    case 'account':
      return 24;
    case 'description':
      return 32;
    case 'balance':
    case 'amount':
    case 'principal':
      return 14;
    case 'currency':
    case 'color':
    case 'icon':
      return 12;
    case 'type':
      return 18;
    case 'startDate':
    case 'maturityDate':
    case 'date':
      return 14;
    default:
      return 14;
  }
}

function applySheetFormatting(
  worksheet: WorkSheet,
  columns: readonly ExcelColumnDefinition[],
  dateCells: DateCell[]
): void {
  worksheet['!cols'] = columns.map((column) =>
    column.hidden ? { hidden: true } : { wch: columnWidth(column) }
  );
  for (const dateCell of dateCells) {
    setCellFormat(
      worksheet,
      dateCell.rowIndex,
      dateCell.columnIndex,
      dateCell.format
    );
  }
}

function appendSheet(
  workbook: WorkBook,
  name: string,
  columns: readonly ExcelColumnDefinition[],
  language: ExcelLanguage,
  rows: unknown[][],
  dateCells: DateCell[]
): void {
  const worksheet = XLSX.utils.aoa_to_sheet([
    getHeaders(columns, language),
    ...rows,
  ]);
  applySheetFormatting(worksheet, columns, dateCells);
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

function buildAccountRows(
  backup: BackupFile,
  language: ExcelLanguage
): { rows: unknown[][]; dateCells: DateCell[] } {
  const rows: unknown[][] = [];
  const dateCells: DateCell[] = [];
  const fileMeta = JSON.stringify({
    currency: backup.currency,
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
    schemaVersion: backup.schemaVersion,
  });

  backup.accounts.forEach((account, accountIndex) => {
    rows.push([
      account.name,
      formatAccountType(account.type, language),
      account.balance,
      account.currency,
      account.annualRate === null ? null : account.annualRate * 100,
      formatBoolean(account.isArchived, language),
      null,
      null,
      null,
      null,
      null,
      JSON.stringify({
        kind: 'account',
        id: account.id,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }),
      accountIndex === 0 ? fileMeta : null,
    ]);

    for (const deposit of account.fixedTermDeposits) {
      const rowIndex = rows.length;
      const startSerial = isoToExcelSerial(deposit.startDate);
      const maturitySerial = isoToExcelSerial(deposit.maturityDate);
      rows.push([
        account.name,
        formatDepositType(language),
        null,
        account.currency,
        deposit.annualRate * 100,
        null,
        deposit.principalAmount,
        deposit.termMonths,
        startSerial,
        maturitySerial,
        formatDepositStatus(deposit.status, language),
        JSON.stringify({
          kind: 'deposit',
          id: deposit.id,
          accountId: account.id,
          createdAt: deposit.createdAt,
          startDate: deposit.startDate,
          maturityDate: deposit.maturityDate,
        }),
        null,
      ]);
      if (startSerial !== null) {
        dateCells.push({ rowIndex, columnIndex: 8, format: 'yyyy-mm-dd' });
      }
      if (maturitySerial !== null) {
        dateCells.push({ rowIndex, columnIndex: 9, format: 'yyyy-mm-dd' });
      }
    }
  });

  return { rows, dateCells };
}

function buildCategoryRows(
  backup: BackupFile,
  language: ExcelLanguage
): unknown[][] {
  return [...backup.incomeCategories, ...backup.expenseCategories].map(
    (category) => [
      category.name,
      formatCategoryType(category.type, language),
      category.color,
      category.icon,
      formatBoolean(category.isDefault, language),
      category.sortOrder,
      JSON.stringify({
        id: category.id,
        createdAt: category.createdAt,
      }),
    ]
  );
}

function buildMovementRows(
  backup: BackupFile,
  language: ExcelLanguage
): { rows: unknown[][]; dateCells: DateCell[] } {
  const rows: unknown[][] = [];
  const dateCells: DateCell[] = [];
  const accountsById = new Map(
    backup.accounts.map((account) => [account.id, account])
  );
  const categoriesById = new Map(
    [...backup.incomeCategories, ...backup.expenseCategories].map(
      (category) => [category.id, category]
    )
  );

  for (const transaction of backup.transactions) {
    const dateSerial = isoToExcelSerial(transaction.date);
    const dateFormat = isDateOnlyIso(transaction.date)
      ? 'yyyy-mm-dd'
      : 'yyyy-mm-dd hh:mm:ss';

    if (transaction.splits.length === 0) {
      const rowIndex = rows.length;
      rows.push([
        dateSerial,
        formatTransactionType(transaction.type, language),
        null,
        null,
        transaction.description,
        transaction.totalAmount,
        JSON.stringify({
          transactionId: transaction.id,
          splitId: null,
          noSplit: true,
          transactionCreatedAt: transaction.createdAt,
          transactionDate: transaction.date,
          accountId: null,
          categoryId: null,
          splitNotes: null,
        }),
      ]);
      if (dateSerial !== null) {
        dateCells.push({ rowIndex, columnIndex: 0, format: dateFormat });
      }
      continue;
    }

    for (const split of transaction.splits) {
      const rowIndex = rows.length;
      const account = accountsById.get(split.accountId);
      const category = categoriesById.get(split.categoryId);
      rows.push([
        dateSerial,
        formatTransactionType(transaction.type, language),
        account?.name ?? split.accountId,
        category?.name ?? (split.categoryId || null),
        transaction.description,
        split.amount,
        JSON.stringify({
          transactionId: transaction.id,
          splitId: split.id,
          transactionCreatedAt: transaction.createdAt,
          transactionDate: transaction.date,
          accountId: split.accountId,
          categoryId: split.categoryId,
          splitNotes: split.notes,
        }),
      ]);
      if (dateSerial !== null) {
        dateCells.push({ rowIndex, columnIndex: 0, format: dateFormat });
      }
    }
  }

  return { rows, dateCells };
}

function buildWorkbook(
  backup: BackupFile,
  language: ExcelLanguage
): WorkBook {
  const workbook = XLSX.utils.book_new();
  const accounts = buildAccountRows(backup, language);
  appendSheet(
    workbook,
    getSheetName('accounts', language),
    ACCOUNT_COLUMNS,
    language,
    accounts.rows,
    accounts.dateCells
  );
  appendSheet(
    workbook,
    getSheetName('categories', language),
    CATEGORY_COLUMNS,
    language,
    buildCategoryRows(backup, language),
    []
  );
  const movements = buildMovementRows(backup, language);
  appendSheet(
    workbook,
    getSheetName('movements', language),
    MOVEMENT_COLUMNS,
    language,
    movements.rows,
    movements.dateCells
  );
  workbook.Props = {
    Title: 'Flux Balance',
    Subject: 'Backup',
    Author: 'Flux Balance',
    Comments: JSON.stringify({
      currency: backup.currency,
      exportedAt: backup.exportedAt,
      appVersion: backup.appVersion,
      schemaVersion: backup.schemaVersion,
    }),
  };
  return workbook;
}

export function createExcelWorkbookBytes(
  backup: BackupFile,
  language: ExcelLanguage
): Uint8Array {
  const workbook = buildWorkbook(backup, language);
  const data = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
    cellDates: false,
  }) as ArrayBuffer;
  return new Uint8Array(data);
}

export function createExcelTemplateBytes(
  language: ExcelLanguage,
  appVersion: string,
  currency: string,
  now: string
): Uint8Array {
  const emptyBackup = createBackupFile(
    {
      accounts: [],
      incomeCategories: [],
      expenseCategories: [],
      transactions: [],
    },
    { appVersion, exportedAt: now, currency }
  );
  return createExcelWorkbookBytes(emptyBackup, language);
}

export function parseExcelWorkbookBytes(
  bytes: Uint8Array,
  options: ExcelParseOptions
) {
  try {
    const workbook = XLSX.read(bytes, {
      type: 'array',
      cellDates: false,
      raw: true,
    });
    return parseExcelWorkbook(workbook, options);
  } catch (error) {
    console.error('Error reading Excel workbook:', error);
    return {
      ok: false as const,
      errors: [{ code: 'invalidExcelFormat' as const }],
    };
  }
}
