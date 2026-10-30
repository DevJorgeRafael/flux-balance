import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  type BackupData,
  type BackupFile,
  type BackupPreview,
} from '../models/backup';

export interface BackupMetadata {
  appVersion: string;
  exportedAt: string;
  currency: string;
}

export function createBackupFile(
  data: BackupData,
  metadata: BackupMetadata
): BackupFile {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: metadata.appVersion,
    exportedAt: metadata.exportedAt,
    currency: metadata.currency,
    accounts: data.accounts,
    incomeCategories: data.incomeCategories,
    expenseCategories: data.expenseCategories,
    transactions: data.transactions,
  };
}

export function serializeBackup(backup: BackupFile): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function getBackupPreview(backup: BackupFile): BackupPreview {
  return {
    accounts: backup.accounts.length,
    incomeCategories: backup.incomeCategories.length,
    expenseCategories: backup.expenseCategories.length,
    transactions: backup.transactions.length,
    exportedAt: backup.exportedAt,
    currency: backup.currency,
    appVersion: backup.appVersion,
    schemaVersion: backup.schemaVersion,
  };
}

export function hasBackupData(backup: BackupFile): boolean {
  return backup.accounts.length > 0 || backup.transactions.length > 0;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function getBackupFileName(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `flux-balance-backup-${year}-${month}-${day}.json`;
}

export function getSafetyBackupFileName(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `flux-balance-pre-import-${year}-${month}-${day}T${hours}-${minutes}-${seconds}.json`;
}
