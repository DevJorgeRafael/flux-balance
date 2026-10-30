import type { WorkBook } from 'xlsx';
import { isSupportedCurrency, resolveCurrencyCode } from '../constants/currencies';
import {
  BACKUP_SCHEMA_VERSION,
  type BackupAccount,
  type BackupParseResult,
  type BackupTransaction,
  type BackupValidationError,
} from '../models/backup';
import { createBackupFile } from './backup-format';
import { parseAccountRows } from './backup-excel-accounts';
import { parseCategoryRows } from './backup-excel-categories';
import {
  ACCOUNT_COLUMNS,
  CATEGORY_COLUMNS,
  MOVEMENT_COLUMNS,
  type ExcelLanguage,
} from './backup-excel-format';
import { parseMovementRows } from './backup-excel-movements';
import {
  addExcelError,
  getFileMeta,
  readExcelTables,
  type ExcelSheetTable,
} from './backup-excel-rows';
import {
  createIdFactory,
  isValidIsoDate,
  readMetaString,
} from './backup-excel-values';
import { validateBackup } from './backup-validation';

export interface ExcelParseOptions {
  language: ExcelLanguage;
  appVersion: string;
  fallbackCurrency: string;
  now?: string;
}

function resolveFileMetadata(
  accountsTable: ExcelSheetTable | null,
  accounts: BackupAccount[],
  options: ExcelParseOptions,
  errors: BackupValidationError[]
): { currency: string; exportedAt: string; appVersion: string } {
  const now = options.now ?? new Date().toISOString();
  const fileMeta = accountsTable ? getFileMeta(accountsTable, errors) : null;
  const rawCurrency = readMetaString(fileMeta, 'currency');
  let currency = options.fallbackCurrency;
  if (rawCurrency) {
    if (isSupportedCurrency(rawCurrency)) {
      currency = rawCurrency;
    } else {
      addExcelError(
        errors,
        'invalidCurrency',
        accountsTable?.sheetName,
        undefined,
        undefined,
        { currency: rawCurrency }
      );
    }
  } else if (accounts.length > 0) {
    currency = accounts[0].currency;
  }

  const rawExportedAt = readMetaString(fileMeta, 'exportedAt');
  let exportedAt = now;
  if (rawExportedAt) {
    if (isValidIsoDate(rawExportedAt)) {
      exportedAt = rawExportedAt;
    } else {
      addExcelError(
        errors,
        'invalidDate',
        accountsTable?.sheetName,
        undefined,
        '_Archivo',
        { path: '_Archivo' }
      );
    }
  }

  const rawVersion = readMetaString(fileMeta, 'appVersion');
  const rawSchemaVersion = fileMeta?.schemaVersion;
  if (
    typeof rawSchemaVersion === 'number' &&
    Number.isInteger(rawSchemaVersion) &&
    rawSchemaVersion > BACKUP_SCHEMA_VERSION
  ) {
    addExcelError(
      errors,
      'futureSchemaVersion',
      accountsTable?.sheetName,
      undefined,
      '_Archivo',
      { version: rawSchemaVersion, supported: BACKUP_SCHEMA_VERSION }
    );
  }

  return {
    currency: resolveCurrencyCode(currency),
    exportedAt,
    appVersion: rawVersion ?? options.appVersion,
  };
}

export function parseExcelWorkbook(
  workbook: WorkBook,
  options: ExcelParseOptions
): BackupParseResult {
  const now = options.now ?? new Date().toISOString();
  const nextId = createIdFactory(now);
  const tables = readExcelTables(workbook, options.language, {
    accounts: ACCOUNT_COLUMNS,
    categories: CATEGORY_COLUMNS,
    movements: MOVEMENT_COLUMNS,
  });
  const errors = tables.errors;

  const parsedAccounts = parseAccountRows(
    tables.accounts,
    errors,
    now,
    nextId
  );
  const parsedCategories = parseCategoryRows(
    tables.categories,
    errors,
    now,
    nextId
  );

  let transactions: BackupTransaction[] = [];
  if (tables.accounts && tables.categories && tables.movements) {
    transactions = parseMovementRows(
      tables.movements,
      parsedAccounts.index,
      parsedCategories.index,
      errors,
      now,
      nextId
    );
  }

  const metadata = resolveFileMetadata(
    tables.accounts,
    parsedAccounts.accounts,
    options,
    errors
  );

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const backup = createBackupFile(
    {
      accounts: parsedAccounts.accounts,
      incomeCategories: parsedCategories.incomeCategories,
      expenseCategories: parsedCategories.expenseCategories,
      transactions,
    },
    metadata
  );

  return validateBackup(backup);
}
