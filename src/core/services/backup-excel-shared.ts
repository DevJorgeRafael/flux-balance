import type {
  BackupAccount,
  BackupCategory,
  BackupValidationError,
} from '../models/backup';
import { isEmptyCell, parseBoolean } from './backup-excel-format';
import {
  getCell,
  type ExcelRow,
  type ExcelSheetTable,
} from './backup-excel-rows';
import {
  isValidBackupAmount,
  isValidBackupId,
} from './backup-validation-helpers';
import { addRowError, rowNumberValue } from './backup-excel-values';

export type IdFactory = (prefix: string) => string;

export interface AccountIndex {
  byId: Map<string, BackupAccount>;
  byName: Map<string, BackupAccount[]>;
}

export interface CategoryIndex {
  byId: Map<string, BackupCategory[]>;
  byTypeAndName: Map<string, BackupCategory[]>;
}

export interface ParsedAccounts {
  accounts: BackupAccount[];
  index: AccountIndex;
}

export interface ParsedCategories {
  incomeCategories: BackupCategory[];
  expenseCategories: BackupCategory[];
  index: CategoryIndex;
}

export function pushName<T>(
  map: Map<string, T[]>,
  key: string,
  value: T
): void {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

export function uniqueId(
  preferred: string | null,
  ids: Set<string>,
  prefix: string,
  table: ExcelSheetTable,
  row: ExcelRow,
  errors: BackupValidationError[],
  nextId: IdFactory
): string {
  let candidate = preferred;
  if (candidate && !isValidBackupId(candidate)) {
    addRowError(errors, table, row, 'invalidId', 'meta', {
      id:
        candidate.length > 40
          ? `${candidate.slice(0, 40)}...`
          : candidate,
    });
    candidate = null;
  }
  if (!candidate) return nextId(prefix);
  if (!ids.has(candidate)) {
    ids.add(candidate);
    return candidate;
  }

  addRowError(errors, table, row, 'duplicateId', 'meta', { id: candidate });
  const generated = nextId(prefix);
  ids.add(generated);
  return generated;
}

export function parseRequiredAmount(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string,
  errors: BackupValidationError[],
  positive: boolean
): number | null {
  if (isEmptyCell(getCell(table, row, key))) {
    addRowError(errors, table, row, 'missingField', key, { path: key });
    return null;
  }

  const value = rowNumberValue(table, row, key);
  if (value === null || !isValidBackupAmount(value)) {
    addRowError(errors, table, row, 'invalidAmount', key, { path: key });
    return null;
  }
  if (positive && value <= 0) {
    addRowError(errors, table, row, 'invalidPositiveAmount', key, { path: key });
    return null;
  }
  return value;
}

export function parseOptionalRate(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string,
  errors: BackupValidationError[]
): number | null {
  if (isEmptyCell(getCell(table, row, key))) return null;
  const value = rowNumberValue(table, row, key);
  if (value === null || !isValidBackupAmount(value)) {
    addRowError(errors, table, row, 'invalidRate', key, { path: key });
    return null;
  }
  return value / 100;
}

export function parseRequiredRate(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string,
  errors: BackupValidationError[]
): number | null {
  if (isEmptyCell(getCell(table, row, key))) {
    addRowError(errors, table, row, 'missingField', key, { path: key });
    return null;
  }
  return parseOptionalRate(table, row, key, errors);
}

export function parseBooleanCell(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string,
  errors: BackupValidationError[],
  defaultValue: boolean
): boolean {
  const value = getCell(table, row, key);
  if (isEmptyCell(value)) return defaultValue;
  const parsed = parseBoolean(value);
  if (parsed === null) {
    addRowError(errors, table, row, 'invalidBoolean', key, {
      value: String(value),
    });
    return defaultValue;
  }
  return parsed;
}
