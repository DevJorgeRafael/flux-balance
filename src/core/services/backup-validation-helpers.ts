import { MAX_AMOUNT } from '../constants/inputLimits';
import type {
  BackupValidationError,
  BackupValidationErrorCode,
} from '../models/backup';

export type UnknownRecord = Record<string, unknown>;

export const MAX_BACKUP_ID_LENGTH = 128;
export const BACKUP_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export const BACKUP_LIMITS = {
  accounts: 1000,
  categoriesPerType: 1000,
  transactions: 10000,
  depositsPerAccount: 100,
  splitsPerTransaction: 100,
  excelRowsPerSheet: 100000,
} as const;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-](\d{2}):?(\d{2}))?$/;

export function isValidBackupId(id: string): boolean {
  return (
    id.length > 0 &&
    id.length <= MAX_BACKUP_ID_LENGTH &&
    BACKUP_ID_PATTERN.test(id)
  );
}

export function isValidBackupAmount(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_AMOUNT
  );
}

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function isOneOf<T extends string>(
  value: string,
  options: readonly T[]
): value is T {
  return (options as readonly string[]).includes(value);
}

export function addError(
  errors: BackupValidationError[],
  code: BackupValidationErrorCode,
  path?: string,
  params?: Record<string, string | number>
): void {
  errors.push({ code, path, params });
}

export function missingField(
  errors: BackupValidationError[],
  path: string
): null {
  addError(errors, 'missingField', path);
  return null;
}

export function requireString(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[],
  allowEmpty = false
): string | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (typeof field !== 'string') {
    addError(errors, 'invalidType', path);
    return null;
  }
  if (!allowEmpty && field.trim().length === 0) {
    addError(errors, 'invalidValue', path);
    return null;
  }
  return field;
}

export function requireNullableString(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): string | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (field !== null && typeof field !== 'string') {
    addError(errors, 'invalidType', path);
    return null;
  }
  return field as string | null;
}

export function validateId(
  id: string,
  path: string,
  errors: BackupValidationError[]
): string | null {
  if (isValidBackupId(id)) return id;

  addError(errors, 'invalidId', path, {
    id: id.length > 40 ? `${id.slice(0, 40)}...` : id,
  });
  return null;
}

export function requireId(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[],
  allowEmpty = false
): string | null {
  const id = requireString(value, key, path, errors, true);
  if (id === null) return null;
  if (id.length === 0) {
    if (allowEmpty) return id;
    addError(errors, 'invalidId', path, { id: '' });
    return null;
  }
  return validateId(id, path, errors);
}

export function requireAmount(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): number | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (typeof field !== 'number' || !isValidBackupAmount(field)) {
    addError(errors, 'invalidAmount', path, { max: MAX_AMOUNT });
    return null;
  }
  return field;
}

export function requireNullableAmount(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): number | null {
  if (!hasOwn(value, key)) return missingField(errors, path);
  if (value[key] === null) return null;
  return requireAmount(value, key, path, errors);
}

export function requireBoolean(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): boolean | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (typeof field !== 'boolean') {
    addError(errors, 'invalidType', path);
    return null;
  }
  return field;
}

export function requireInteger(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): number | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (typeof field !== 'number' || !Number.isInteger(field)) {
    addError(errors, 'invalidType', path);
    return null;
  }
  return field;
}

export function requirePositiveInteger(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): number | null {
  const field = requireInteger(value, key, path, errors);
  if (field === null) return null;
  if (field <= 0) {
    addError(errors, 'invalidValue', path);
    return null;
  }
  return field;
}

function isValidDateParts(
  year: number,
  month: number,
  day: number
): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed);
  if (dateOnly) {
    return isValidDateParts(
      Number(dateOnly[1]),
      Number(dateOnly[2]),
      Number(dateOnly[3])
    );
  }

  const dateTime = DATE_TIME_PATTERN.exec(trimmed);
  if (!dateTime) return false;

  if (
    !isValidDateParts(
      Number(dateTime[1]),
      Number(dateTime[2]),
      Number(dateTime[3])
    )
  ) {
    return false;
  }

  const hour = Number(dateTime[4]);
  const minute = Number(dateTime[5]);
  const second = dateTime[6] === undefined ? 0 : Number(dateTime[6]);
  const offsetHour = dateTime[7] === undefined ? 0 : Number(dateTime[7]);
  const offsetMinute = dateTime[8] === undefined ? 0 : Number(dateTime[8]);
  if (
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return false;
  }

  return Number.isFinite(Date.parse(trimmed.replace(' ', 'T')));
}

export function requireDate(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): string | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (!isValidDateString(field)) {
    addError(errors, 'invalidDate', path);
    return null;
  }
  return field;
}

export function requireArray(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): unknown[] | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (!Array.isArray(field)) {
    addError(errors, 'invalidType', path);
    return null;
  }
  return field;
}

export function checkArrayLimit(
  errors: BackupValidationError[],
  path: string,
  items: unknown[],
  limit: number
): boolean {
  if (items.length <= limit) return true;

  addError(errors, 'tooManyItems', path, {
    limit,
    count: items.length,
  });
  return false;
}

export function registerId(
  id: string | null,
  ids: Set<string>,
  path: string,
  errors: BackupValidationError[]
): void {
  if (!id) return;
  if (validateId(id, path, errors) === null) return;
  if (ids.has(id)) {
    addError(errors, 'duplicateId', path, { id });
    return;
  }
  ids.add(id);
}
