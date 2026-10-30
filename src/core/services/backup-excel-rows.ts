import type { CellObject, WorkBook, WorkSheet } from 'xlsx';
import type {
  BackupValidationError,
  BackupValidationErrorCode,
} from '../models/backup';
import {
  EXCEL_SHEETS,
  findColumnKey,
  getRequiredColumnKeys,
  isEmptyCell,
  type ExcelColumnDefinition,
  type ExcelLanguage,
  type ExcelSheetKey,
} from './backup-excel-format';

export interface ExcelRow {
  rowNumber: number;
  values: unknown[];
}

export interface ExcelSheetTable {
  key: ExcelSheetKey;
  sheetName: string;
  columns: readonly ExcelColumnDefinition[];
  columnIndexes: Map<string, number>;
  headerByKey: Map<string, string>;
  rows: ExcelRow[];
}

export interface ExcelTableSet {
  accounts: ExcelSheetTable | null;
  categories: ExcelSheetTable | null;
  movements: ExcelSheetTable | null;
  errors: BackupValidationError[];
}

interface SheetRange {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

function columnName(index: number): string {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function decodeRange(ref: string): SheetRange | null {
  const match = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(ref.trim());
  if (!match) return null;

  const decodeColumn = (letters: string): number => {
    let value = 0;
    for (const letter of letters) {
      value = value * 26 + (letter.charCodeAt(0) - 64);
    }
    return value - 1;
  };

  const startColumn = decodeColumn(match[1]);
  const startRow = Number(match[2]) - 1;
  const endColumn = match[3] ? decodeColumn(match[3]) : startColumn;
  const endRow = match[4] ? Number(match[4]) - 1 : startRow;

  return { startRow, startColumn, endRow, endColumn };
}

function getCellValue(
  worksheet: WorkSheet,
  row: number,
  column: number
): unknown {
  const address = `${columnName(column)}${row + 1}`;
  const cell = (worksheet as Record<string, unknown>)[address] as
    | CellObject
    | undefined;
  if (!cell) return undefined;
  if (cell.t === 'e') return undefined;
  return cell.v;
}

function findSheetName(
  workbook: WorkBook,
  key: ExcelSheetKey,
  language: ExcelLanguage
): string | null {
  const preferred = EXCEL_SHEETS[key][language];
  if (workbook.SheetNames.includes(preferred)) return preferred;

  const fallback = EXCEL_SHEETS[key][language === 'es' ? 'en' : 'es'];
  if (workbook.SheetNames.includes(fallback)) return fallback;

  return null;
}

export function addExcelError(
  errors: BackupValidationError[],
  code: BackupValidationErrorCode,
  sheet?: string,
  row?: number,
  column?: string,
  params?: Record<string, string | number>
): void {
  errors.push({ code, sheet, row, column, params });
}

export function readSheetTable(
  workbook: WorkBook,
  key: ExcelSheetKey,
  columns: readonly ExcelColumnDefinition[],
  language: ExcelLanguage,
  errors: BackupValidationError[]
): ExcelSheetTable | null {
  const sheetName = findSheetName(workbook, key, language);
  if (!sheetName) {
    const expected = EXCEL_SHEETS[key][language];
    addExcelError(errors, 'missingSheet', expected, undefined, undefined, {
      sheet: expected,
    });
    return null;
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet || !worksheet['!ref']) {
    const expected = EXCEL_SHEETS[key][language];
    addExcelError(errors, 'missingSheet', expected, undefined, undefined, {
      sheet: expected,
    });
    return null;
  }

  const range = decodeRange(worksheet['!ref']);
  if (!range) {
    addExcelError(errors, 'missingSheet', sheetName);
    return null;
  }

  const columnIndexes = new Map<string, number>();
  const headerByKey = new Map<string, string>();
  for (let column = range.startColumn; column <= range.endColumn; column += 1) {
    const header = getCellValue(worksheet, range.startRow, column);
    const columnKey = findColumnKey(columns, header);
    if (columnKey && !columnIndexes.has(columnKey)) {
      columnIndexes.set(columnKey, column - range.startColumn);
      if (typeof header === 'string') {
        headerByKey.set(columnKey, header.trim());
      }
    }
  }

  let hasMissingColumn = false;
  for (const requiredKey of getRequiredColumnKeys(columns)) {
    if (columnIndexes.has(requiredKey)) continue;
    const column = columns.find((item) => item.key === requiredKey);
    const expectedHeader = column
      ? language === 'es'
        ? column.es
        : column.en
      : requiredKey;
    addExcelError(errors, 'missingColumn', sheetName, undefined, expectedHeader, {
      sheet: sheetName,
      column: expectedHeader,
    });
    hasMissingColumn = true;
  }

  if (hasMissingColumn) return null;

  const rows: ExcelRow[] = [];
  for (let row = range.startRow + 1; row <= range.endRow; row += 1) {
    const values: unknown[] = [];
    for (let column = range.startColumn; column <= range.endColumn; column += 1) {
      values.push(getCellValue(worksheet, row, column));
    }
    rows.push({ rowNumber: row + 1, values });
  }

  return {
    key,
    sheetName,
    columns,
    columnIndexes,
    headerByKey,
    rows,
  };
}

export function getCell(
  table: ExcelSheetTable,
  row: ExcelRow,
  key: string
): unknown {
  const index = table.columnIndexes.get(key);
  if (index === undefined) return undefined;
  return row.values[index];
}

export function isRowEmpty(
  table: ExcelSheetTable,
  row: ExcelRow
): boolean {
  return getRequiredColumnKeys(table.columns).every((key) =>
    isEmptyCell(getCell(table, row, key))
  );
}

export function getRowMeta(
  table: ExcelSheetTable,
  row: ExcelRow,
  errors: BackupValidationError[]
): Record<string, unknown> | null {
  const value = getCell(table, row, 'meta');
  if (isEmptyCell(value)) return null;
  if (typeof value !== 'string') {
    addExcelError(errors, 'invalidType', table.sheetName, row.rowNumber, '_Meta');
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // El error se informa debajo.
  }

  addExcelError(
    errors,
    'invalidValue',
    table.sheetName,
    row.rowNumber,
    '_Meta'
  );
  return null;
}

export function getFileMeta(
  table: ExcelSheetTable,
  errors: BackupValidationError[]
): Record<string, unknown> | null {
  for (const row of table.rows) {
    const value = getCell(table, row, 'fileMeta');
    if (isEmptyCell(value)) continue;
    if (typeof value !== 'string') {
      addExcelError(
        errors,
        'invalidType',
        table.sheetName,
        row.rowNumber,
        '_Archivo'
      );
      return null;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // El error se informa debajo.
    }

    addExcelError(
      errors,
      'invalidValue',
      table.sheetName,
      row.rowNumber,
      '_Archivo'
    );
    return null;
  }
  return null;
}

export interface ExcelColumns {
  accounts: readonly ExcelColumnDefinition[];
  categories: readonly ExcelColumnDefinition[];
  movements: readonly ExcelColumnDefinition[];
}

export function readExcelTables(
  workbook: WorkBook,
  language: ExcelLanguage,
  columns: ExcelColumns
): ExcelTableSet {
  const errors: BackupValidationError[] = [];
  const accounts = readSheetTable(
    workbook,
    'accounts',
    columns.accounts,
    language,
    errors
  );
  const categories = readSheetTable(
    workbook,
    'categories',
    columns.categories,
    language,
    errors
  );
  const movements = readSheetTable(
    workbook,
    'movements',
    columns.movements,
    language,
    errors
  );

  return { accounts, categories, movements, errors };
}
