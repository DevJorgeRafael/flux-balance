import {
  getCurrencyDecimals,
  isSupportedCurrency,
} from '../constants/currencies';
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  type BackupFile,
  type BackupParseResult,
  type BackupValidationError,
  type BackupValidationErrorCode,
} from '../models/backup';
import { getBackupPreview } from './backup-format';
import { migrateBackup } from './backup-migration';
import {
  BACKUP_LIMITS,
  addError,
  checkArrayLimit,
  isRecord,
  requireArray,
  requireDate,
  requireString,
} from './backup-validation-helpers';
import {
  validateAccount,
  validateCategoryList,
  validateTransaction,
} from './backup-validation-entities';

function fail(code: BackupValidationErrorCode): BackupParseResult {
  return { ok: false, errors: [{ code }] };
}

export function validateBackup(raw: unknown): BackupParseResult {
  if (!isRecord(raw)) return fail('invalidFormat');
  if (raw.format !== BACKUP_FORMAT) {
    return { ok: false, errors: [{ code: 'invalidFormat', path: 'format' }] };
  }

  const migration = migrateBackup(raw);
  if (!migration.ok) {
    return { ok: false, errors: [migration.error] };
  }

  if (!isRecord(migration.value)) return fail('invalidFormat');
  const value = migration.value;
  const errors: BackupValidationError[] = [];

  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    addError(errors, 'invalidSchemaVersion', 'schemaVersion');
  }

  requireString(value, 'appVersion', 'appVersion', errors);
  requireDate(value, 'exportedAt', 'exportedAt', errors);

  const currency = requireString(value, 'currency', 'currency', errors);
  if (currency && !isSupportedCurrency(currency)) {
    addError(errors, 'invalidCurrency', 'currency', { currency });
  }

  let accounts = requireArray(value, 'accounts', 'accounts', errors);
  let incomeCategories = requireArray(
    value,
    'incomeCategories',
    'incomeCategories',
    errors
  );
  let expenseCategories = requireArray(
    value,
    'expenseCategories',
    'expenseCategories',
    errors
  );
  let transactions = requireArray(
    value,
    'transactions',
    'transactions',
    errors
  );

  let limitExceeded = false;
  if (
    accounts &&
    !checkArrayLimit(errors, 'accounts', accounts, BACKUP_LIMITS.accounts)
  ) {
    accounts = null;
    limitExceeded = true;
  }
  if (
    incomeCategories &&
    !checkArrayLimit(
      errors,
      'incomeCategories',
      incomeCategories,
      BACKUP_LIMITS.categoriesPerType
    )
  ) {
    incomeCategories = null;
    limitExceeded = true;
  }
  if (
    expenseCategories &&
    !checkArrayLimit(
      errors,
      'expenseCategories',
      expenseCategories,
      BACKUP_LIMITS.categoriesPerType
    )
  ) {
    expenseCategories = null;
    limitExceeded = true;
  }
  if (
    transactions &&
    !checkArrayLimit(
      errors,
      'transactions',
      transactions,
      BACKUP_LIMITS.transactions
    )
  ) {
    transactions = null;
    limitExceeded = true;
  }
  if (limitExceeded) {
    return { ok: false, errors };
  }

  const currencyDecimals = getCurrencyDecimals(currency);

  const accountIds = new Set<string>();
  const depositIds = new Set<string>();
  const incomeCategoryIds = new Set<string>();
  const expenseCategoryIds = new Set<string>();
  const transactionIds = new Set<string>();
  const splitIds = new Set<string>();

  accounts?.forEach((account, index) => {
    validateAccount(
      account,
      `accounts[${index}]`,
      errors,
      accountIds,
      depositIds
    );
  });

  if (incomeCategories) {
    validateCategoryList(
      incomeCategories,
      'INCOME',
      'incomeCategories',
      errors,
      incomeCategoryIds
    );
  }
  if (expenseCategories) {
    validateCategoryList(
      expenseCategories,
      'EXPENSE',
      'expenseCategories',
      errors,
      expenseCategoryIds
    );
  }

  transactions?.forEach((transaction, index) => {
    validateTransaction(
      transaction,
      `transactions[${index}]`,
      errors,
      accountIds,
      incomeCategoryIds,
      expenseCategoryIds,
      transactionIds,
      splitIds,
      currencyDecimals
    );
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const backup = value as unknown as BackupFile;
  return {
    ok: true,
    backup,
    preview: getBackupPreview(backup),
  };
}

export function parseBackupText(text: string): BackupParseResult {
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    return fail('invalidJson');
  }

  return validateBackup(raw);
}
