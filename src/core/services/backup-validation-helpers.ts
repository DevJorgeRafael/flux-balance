import type {
  BackupValidationError,
  BackupValidationErrorCode,
} from '../models/backup';

export type UnknownRecord = Record<string, unknown>;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

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

export function requireAmount(
  value: UnknownRecord,
  key: string,
  path: string,
  errors: BackupValidationError[]
): number | null {
  if (!hasOwn(value, key)) return missingField(errors, path);

  const field = value[key];
  if (typeof field !== 'number' || !Number.isFinite(field)) {
    addError(errors, 'invalidAmount', path);
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

function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  if (!DATE_TIME_PATTERN.test(trimmed)) return false;
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

export function registerId(
  id: string | null,
  ids: Set<string>,
  path: string,
  errors: BackupValidationError[]
): void {
  if (!id) return;
  if (ids.has(id)) {
    addError(errors, 'duplicateId', path, { id });
    return;
  }
  ids.add(id);
}
