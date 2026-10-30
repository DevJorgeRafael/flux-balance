import type {
  BackupValidationError,
  BackupValidationErrorCode,
} from '../models/backup';
import {
  excelSerialToDate,
  excelSerialToIsoDate,
  excelSerialToIsoDateTime,
  isoToExcelSerial,
  isEmptyCell,
  parseExcelNumber,
  serialMatchesIso,
} from './backup-excel-format';
import { addExcelError, getCell, type ExcelRow, type ExcelSheetTable } from './backup-excel-rows';

export interface ExcelDateValue {
  serial: number;
  isoDate: string;
  isoDateTime: string;
  dateOnly: boolean;
}

export function rowText(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string
): string {
  const value = getCell(table, row, key);
  return typeof value === 'string' ? value.trim() : '';
}

export function rowNumberValue(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string
): number | null {
  return parseExcelNumber(getCell(table, row, key));
}

export function addRowError(
  errors: BackupValidationError[],
  table: ExcelSheetTable,
  row: ExcelRow,
  code: BackupValidationErrorCode,
  column?: string,
  params?: Record<string, string | number>
): void {
  const columnHeader = column
    ? table.headerByKey.get(column) ?? column
    : undefined;
  const path = columnHeader ?? params?.path;
  addExcelError(errors, code, table.sheetName, row.rowNumber, columnHeader, {
    ...params,
    ...(path !== undefined ? { path } : {}),
  });
}

export function rowDate(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string,
  errors: BackupValidationError[]
): ExcelDateValue | null {
  const value = getCell(table, row, key);
  if (isEmptyCell(value)) {
    addRowError(errors, table, row, 'missingField', key, { path: key });
    return null;
  }

  let serial: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    serial = value;
  } else if (value instanceof Date && Number.isFinite(value.getTime())) {
    const iso = value.toISOString();
    serial = isoToExcelSerial(iso);
  } else if (typeof value === 'string') {
    serial = isoToExcelSerial(value);
  }

  if (serial === null) {
    addRowError(errors, table, row, 'invalidDate', key, { path: key });
    return null;
  }

  const date = excelSerialToDate(serial);
  const year = date.getUTCFullYear();
  if (
    !Number.isFinite(date.getTime()) ||
    year < 1900 ||
    year > 9999
  ) {
    addRowError(errors, table, row, 'invalidDate', key, { path: key });
    return null;
  }

  return {
    serial,
    isoDate: excelSerialToIsoDate(serial),
    isoDateTime: excelSerialToIsoDateTime(serial),
    dateOnly: Math.abs(serial - Math.round(serial)) < 1e-9,
  };
}

export function readMetaString(
  meta: Record<string, unknown> | null,
  key: string
): string | null {
  if (!meta) return null;
  const value = meta[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

export function readMetaBoolean(
  meta: Record<string, unknown> | null,
  key: string
): boolean | null {
  if (!meta) return null;
  return typeof meta[key] === 'boolean' ? (meta[key] as boolean) : null;
}

export function isValidIsoDate(value: string): boolean {
  return isoToExcelSerial(value) !== null;
}

export function readMetaDate(
  meta: Record<string, unknown> | null,
  key: string,
  table: ExcelSheetTable,
  row: ExcelRow,
  errors: BackupValidationError[]
): string | null {
  const value = readMetaString(meta, key);
  if (!value) return null;
  if (isValidIsoDate(value)) return value;

  addRowError(errors, table, row, 'invalidDate', '_Meta', { path: '_Meta' });
  return null;
}

export function createIdFactory(seed: string): (prefix: string) => string {
  const stamp = seed.replace(/\D/g, '').slice(0, 14) || '0';
  let sequence = 0;
  return (prefix: string) => {
    const id = `${prefix}_${stamp}_${sequence.toString(36)}`;
    sequence += 1;
    return id;
  };
}

export function chooseIsoDate(
  date: ExcelDateValue,
  original: string | null
): string {
  if (original && serialMatchesIso(date.serial, original)) return original;
  return date.dateOnly ? date.isoDate : date.isoDateTime;
}
