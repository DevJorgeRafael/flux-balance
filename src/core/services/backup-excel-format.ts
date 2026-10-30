import type { AccountType, FixedTermDeposit } from '../models/account';
import type { CategoryType } from '../models/category';
import type { TransactionType } from '../models/transaction';
import { isValidDateString } from './backup-validation-helpers';

export type ExcelLanguage = 'es' | 'en';

export type ExcelSheetKey = 'accounts' | 'categories' | 'movements';

export interface ExcelColumnDefinition<Key extends string = string> {
  key: Key;
  es: string;
  en: string;
  hidden?: boolean;
}

export const EXCEL_SHEETS: Record<
  ExcelSheetKey,
  Record<ExcelLanguage, string>
> = {
  accounts: { es: 'Cuentas', en: 'Accounts' },
  categories: { es: 'Categorías', en: 'Categories' },
  movements: { es: 'Movimientos', en: 'Movements' },
};

export const ACCOUNT_COLUMNS = [
  { key: 'name', es: 'Nombre', en: 'Name' },
  { key: 'type', es: 'Tipo', en: 'Type' },
  { key: 'balance', es: 'Saldo', en: 'Balance' },
  { key: 'currency', es: 'Moneda', en: 'Currency' },
  { key: 'annualRate', es: 'Tasa anual (%)', en: 'Annual rate (%)' },
  { key: 'archived', es: 'Archivada', en: 'Archived' },
  { key: 'principal', es: 'Principal', en: 'Principal' },
  { key: 'termMonths', es: 'Plazo (meses)', en: 'Term (months)' },
  { key: 'startDate', es: 'Inicio', en: 'Start' },
  { key: 'maturityDate', es: 'Vencimiento', en: 'Maturity' },
  { key: 'status', es: 'Estado', en: 'Status' },
  { key: 'meta', es: '_Meta', en: '_Meta', hidden: true },
  { key: 'fileMeta', es: '_Archivo', en: '_Archivo', hidden: true },
] as const satisfies readonly ExcelColumnDefinition[];

export const CATEGORY_COLUMNS = [
  { key: 'name', es: 'Nombre', en: 'Name' },
  { key: 'type', es: 'Tipo', en: 'Type' },
  { key: 'color', es: 'Color', en: 'Color' },
  { key: 'icon', es: 'Icono', en: 'Icon' },
  { key: 'isDefault', es: 'Predeterminada', en: 'Default' },
  { key: 'sortOrder', es: 'Orden', en: 'Order' },
  { key: 'meta', es: '_Meta', en: '_Meta', hidden: true },
] as const satisfies readonly ExcelColumnDefinition[];

export const MOVEMENT_COLUMNS = [
  { key: 'date', es: 'Fecha', en: 'Date' },
  { key: 'type', es: 'Tipo', en: 'Type' },
  { key: 'account', es: 'Cuenta', en: 'Account' },
  { key: 'category', es: 'Categoría', en: 'Category' },
  { key: 'description', es: 'Descripción', en: 'Description' },
  { key: 'amount', es: 'Monto', en: 'Amount' },
  { key: 'meta', es: '_Meta', en: '_Meta', hidden: true },
] as const satisfies readonly ExcelColumnDefinition[];

export type AccountColumnKey = (typeof ACCOUNT_COLUMNS)[number]['key'];
export type CategoryColumnKey = (typeof CATEGORY_COLUMNS)[number]['key'];
export type MovementColumnKey = (typeof MOVEMENT_COLUMNS)[number]['key'];

export type ExcelColumnKey =
  | AccountColumnKey
  | CategoryColumnKey
  | MovementColumnKey;

const ACCOUNT_TYPE_LABELS: Record<
  ExcelLanguage,
  Record<AccountType | 'DEPOSIT', string>
> = {
  es: {
    CHECKING: 'Corriente',
    FLEXIBLE_SAVINGS: 'Ahorro flexible',
    FIXED_TERM: 'Plazo fijo',
    DEPOSIT: 'Depósito a plazo',
  },
  en: {
    CHECKING: 'Checking',
    FLEXIBLE_SAVINGS: 'Flexible savings',
    FIXED_TERM: 'Fixed term',
    DEPOSIT: 'Term deposit',
  },
};

const CATEGORY_TYPE_LABELS: Record<
  ExcelLanguage,
  Record<CategoryType, string>
> = {
  es: { INCOME: 'Ingreso', EXPENSE: 'Gasto' },
  en: { INCOME: 'Income', EXPENSE: 'Expense' },
};

const TRANSACTION_TYPE_LABELS: Record<
  ExcelLanguage,
  Record<TransactionType, string>
> = {
  es: { INCOME: 'Ingreso', EXPENSE: 'Gasto', TRANSFER: 'Transferencia' },
  en: { INCOME: 'Income', EXPENSE: 'Expense', TRANSFER: 'Transfer' },
};

const DEPOSIT_STATUS_LABELS: Record<
  ExcelLanguage,
  Record<FixedTermDeposit['status'], string>
> = {
  es: { ACTIVE: 'Activo', MATURED: 'Vencido', CANCELLED: 'Cancelado' },
  en: { ACTIVE: 'Active', MATURED: 'Matured', CANCELLED: 'Cancelled' },
};

const ACCOUNT_TYPE_CODES: readonly AccountType[] = [
  'CHECKING',
  'FLEXIBLE_SAVINGS',
  'FIXED_TERM',
];
const CATEGORY_TYPE_CODES: readonly CategoryType[] = ['INCOME', 'EXPENSE'];
const TRANSACTION_TYPE_CODES: readonly TransactionType[] = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
];
const DEPOSIT_STATUS_CODES: readonly FixedTermDeposit['status'][] = [
  'ACTIVE',
  'MATURED',
  'CANCELLED',
];

export function getSheetName(
  key: ExcelSheetKey,
  language: ExcelLanguage
): string {
  return EXCEL_SHEETS[key][language];
}

export function getColumnHeader(
  columns: readonly ExcelColumnDefinition[],
  key: string,
  language: ExcelLanguage
): string {
  const column = columns.find((item) => item.key === key);
  if (!column) return key;
  return language === 'es' ? column.es : column.en;
}

export function getHeaders(
  columns: readonly ExcelColumnDefinition[],
  language: ExcelLanguage
): string[] {
  return columns.map((column) =>
    language === 'es' ? column.es : column.en
  );
}

export function getRequiredColumnKeys(
  columns: readonly ExcelColumnDefinition[]
): string[] {
  return columns.filter((column) => !column.hidden).map((column) => column.key);
}

export function findColumnKey(
  columns: readonly ExcelColumnDefinition[],
  header: unknown
): string | null {
  if (typeof header !== 'string') return null;
  const normalized = header.trim();
  const column = columns.find(
    (item) => item.es === normalized || item.en === normalized
  );
  return column?.key ?? null;
}

export function formatAccountType(
  type: AccountType,
  language: ExcelLanguage
): string {
  return ACCOUNT_TYPE_LABELS[language][type];
}

export function formatDepositType(language: ExcelLanguage): string {
  return ACCOUNT_TYPE_LABELS[language].DEPOSIT;
}

export function parseAccountType(
  value: unknown
): AccountType | 'DEPOSIT' | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized === 'DEPOSIT') return 'DEPOSIT';
  const code = ACCOUNT_TYPE_CODES.find((item) => item === normalized);
  if (code) return code;

  for (const language of ['es', 'en'] as const) {
    const entry = Object.entries(ACCOUNT_TYPE_LABELS[language]).find(
      ([, label]) => label.toLowerCase() === normalized.toLowerCase()
    );
    if (entry) return entry[0] as AccountType | 'DEPOSIT';
  }
  return null;
}

export function formatCategoryType(
  type: CategoryType,
  language: ExcelLanguage
): string {
  return CATEGORY_TYPE_LABELS[language][type];
}

export function parseCategoryType(value: unknown): CategoryType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const code = CATEGORY_TYPE_CODES.find((item) => item === normalized);
  if (code) return code;

  for (const language of ['es', 'en'] as const) {
    const entry = Object.entries(CATEGORY_TYPE_LABELS[language]).find(
      ([, label]) => label.toLowerCase() === normalized.toLowerCase()
    );
    if (entry) return entry[0] as CategoryType;
  }
  return null;
}

export function formatTransactionType(
  type: TransactionType,
  language: ExcelLanguage
): string {
  return TRANSACTION_TYPE_LABELS[language][type];
}

export function parseTransactionType(
  value: unknown
): TransactionType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const code = TRANSACTION_TYPE_CODES.find((item) => item === normalized);
  if (code) return code;

  for (const language of ['es', 'en'] as const) {
    const entry = Object.entries(TRANSACTION_TYPE_LABELS[language]).find(
      ([, label]) => label.toLowerCase() === normalized.toLowerCase()
    );
    if (entry) return entry[0] as TransactionType;
  }
  return null;
}

export function categoryNameKey(
  type: CategoryType,
  name: string
): string {
  return `${type}\u0000${name.trim().toLowerCase()}`;
}

export function formatDepositStatus(
  status: FixedTermDeposit['status'],
  language: ExcelLanguage
): string {
  return DEPOSIT_STATUS_LABELS[language][status];
}

export function parseDepositStatus(
  value: unknown
): FixedTermDeposit['status'] | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const code = DEPOSIT_STATUS_CODES.find((item) => item === normalized);
  if (code) return code;

  for (const language of ['es', 'en'] as const) {
    const entry = Object.entries(DEPOSIT_STATUS_LABELS[language]).find(
      ([, label]) => label.toLowerCase() === normalized.toLowerCase()
    );
    if (entry) return entry[0] as FixedTermDeposit['status'];
  }
  return null;
}

export function formatBoolean(
  value: boolean,
  language: ExcelLanguage
): string {
  if (language === 'es') return value ? 'Sí' : 'No';
  return value ? 'Yes' : 'No';
}

export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (['sí', 'si', 'yes', 'true', '1', 'x'].includes(normalized)) return true;
  if (['no', 'false', '0'].includes(normalized)) return false;
  return null;
}

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function dateToExcelSerial(date: Date): number {
  return (date.getTime() - EXCEL_EPOCH_MS) / DAY_MS;
}

export function excelSerialToDate(serial: number): Date {
  return new Date(EXCEL_EPOCH_MS + serial * DAY_MS);
}

export function isoToExcelSerial(value: string): number | null {
  const trimmed = value.trim();
  if (!isValidDateString(trimmed)) return null;

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return dateToExcelSerial(new Date(Date.UTC(year, month - 1, day)));
  }

  const timestamp = Date.parse(trimmed.replace(' ', 'T'));
  if (!Number.isFinite(timestamp)) return null;
  return dateToExcelSerial(new Date(timestamp));
}

export function excelSerialToIsoDate(serial: number): string {
  return excelSerialToDate(serial).toISOString().slice(0, 10);
}

export function excelSerialToIsoDateTime(serial: number): string {
  return excelSerialToDate(serial).toISOString();
}

export function isDateOnlyIso(value: string): boolean {
  return DATE_ONLY_PATTERN.test(value.trim());
}

export function serialMatchesIso(
  serial: number,
  value: string,
  toleranceMs = 1000
): boolean {
  const expected = isoToExcelSerial(value);
  if (expected === null) return false;
  return Math.abs(serial - expected) * DAY_MS <= toleranceMs;
}

export function parseExcelNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') return null;

  let normalized = value.trim().replace(/\s/g, '');
  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    normalized = normalized.replace(',', '.');
  }

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseExcelInteger(value: unknown): number | null {
  const parsed = parseExcelNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) return null;
  return parsed;
}

export function isEmptyCell(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}
