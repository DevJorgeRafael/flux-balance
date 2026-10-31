import type { AccountType, FixedTermDeposit } from './account';
import type { CategoryType } from './category';
import type { TransactionType } from './transaction';

export const BACKUP_FORMAT = 'flux-balance-backup';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupFixedTermDeposit {
  id: string;
  accountId: string;
  principalAmount: number;
  annualRate: number;
  termMonths: number;
  startDate: string;
  maturityDate: string;
  status: FixedTermDeposit['status'];
  createdAt: string;
}

export interface BackupAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  annualRate: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  fixedTermDeposits: BackupFixedTermDeposit[];
}

export interface BackupCategory {
  id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface BackupTransactionSplit {
  id: string;
  transactionId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  notes: string | null;
}

export interface BackupTransaction {
  id: string;
  type: TransactionType;
  totalAmount: number;
  description: string | null;
  date: string;
  createdAt: string;
  splits: BackupTransactionSplit[];
}

export interface BackupData {
  accounts: BackupAccount[];
  incomeCategories: BackupCategory[];
  expenseCategories: BackupCategory[];
  transactions: BackupTransaction[];
}

export interface BackupFile extends BackupData {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  currency: string;
}

export interface BackupPreview {
  accounts: number;
  incomeCategories: number;
  expenseCategories: number;
  transactions: number;
  exportedAt: string;
  currency: string;
  appVersion: string;
  schemaVersion: number;
}

export type BackupValidationErrorCode =
  | 'invalidJson'
  | 'invalidFormat'
  | 'invalidExcelFormat'
  | 'invalidSchemaVersion'
  | 'futureSchemaVersion'
  | 'unsupportedSchemaVersion'
  | 'missingField'
  | 'missingSheet'
  | 'missingColumn'
  | 'invalidType'
  | 'invalidAmount'
  | 'invalidPositiveAmount'
  | 'invalidDate'
  | 'invalidId'
  | 'invalidSplitTotal'
  | 'tooManyItems'
  | 'duplicateId'
  | 'duplicateName'
  | 'missingAccount'
  | 'missingCategory'
  | 'unknownAccount'
  | 'unknownCategory'
  | 'invalidAccountType'
  | 'invalidCategoryType'
  | 'invalidTransactionType'
  | 'invalidBoolean'
  | 'invalidRate'
  | 'invalidTerm'
  | 'invalidStatus'
  | 'invalidCurrency'
  | 'invalidValue';

export interface BackupValidationError {
  code: BackupValidationErrorCode;
  path?: string;
  sheet?: string;
  row?: number;
  column?: string;
  params?: Record<string, string | number>;
}

export type BackupParseResult =
  | { ok: true; backup: BackupFile; preview: BackupPreview }
  | { ok: false; errors: BackupValidationError[] };
