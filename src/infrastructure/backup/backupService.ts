import Constants from 'expo-constants';
import type {
  BackupFile,
  BackupPreview,
  BackupValidationError,
} from '../../core/models/backup';
import { resolveCurrencyCode } from '../../core/constants/currencies';
import { createBackupFile } from '../../core/services/backup-format';
import {
  createExcelTemplateBytes,
  createExcelWorkbookBytes,
  parseExcelWorkbookBytes,
} from '../../core/services/backup-excel';
import type { ExcelLanguage } from '../../core/services/backup-excel-format';
import { parseBackupText } from '../../core/services/backup-validation';
import { getAppSetting } from '../database/appSettings';
import {
  buildBackupFromDatabase,
  importBackupIntoDatabase,
} from '../database/backup';
import { getDatabase } from '../database/db';
import {
  pickBackupFileText,
  saveSafetyBackup,
  shareBackupFile,
  writeExportFile,
} from './backupFiles';
import {
  pickExcelFileBytes,
  shareExcelFile,
  writeExcelFile,
} from './excelFiles';

export type PickBackupResult =
  | { status: 'canceled' }
  | { status: 'invalid'; errors: BackupValidationError[] }
  | { status: 'valid'; backup: BackupFile; preview: BackupPreview };

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export async function buildCurrentBackup(): Promise<BackupFile> {
  const db = await getDatabase();
  const [data, savedCurrency] = await Promise.all([
    buildBackupFromDatabase(db),
    getAppSetting('currency'),
  ]);

  return createBackupFile(data, {
    appVersion: getAppVersion(),
    exportedAt: new Date().toISOString(),
    currency: resolveCurrencyCode(savedCurrency),
  });
}

export async function shareBackup(
  backup: BackupFile,
  dialogTitle: string
): Promise<void> {
  const file = await writeExportFile(backup);
  await shareBackupFile(file, dialogTitle);
}

export async function shareExcelBackup(
  backup: BackupFile,
  language: ExcelLanguage,
  dialogTitle: string
): Promise<void> {
  const bytes = createExcelWorkbookBytes(backup, language);
  const file = await writeExcelFile(bytes);
  await shareExcelFile(file, dialogTitle);
}

export async function shareExcelTemplate(
  language: ExcelLanguage,
  currency: string,
  dialogTitle: string
): Promise<void> {
  const bytes = createExcelTemplateBytes(
    language,
    getAppVersion(),
    currency,
    new Date().toISOString()
  );
  const file = await writeExcelFile(bytes);
  await shareExcelFile(file, dialogTitle);
}

export async function pickAndValidateExcelBackup(
  language: ExcelLanguage,
  fallbackCurrency: string
): Promise<PickBackupResult> {
  const bytes = await pickExcelFileBytes();
  if (bytes === null) return { status: 'canceled' };

  const result = parseExcelWorkbookBytes(bytes, {
    language,
    appVersion: getAppVersion(),
    fallbackCurrency,
  });

  if (!result.ok) {
    return { status: 'invalid', errors: result.errors };
  }

  return {
    status: 'valid',
    backup: result.backup,
    preview: result.preview,
  };
}

export async function pickAndValidateBackup(): Promise<PickBackupResult> {
  const text = await pickBackupFileText();
  if (text === null) return { status: 'canceled' };

  const result = parseBackupText(text);
  if (!result.ok) {
    return { status: 'invalid', errors: result.errors };
  }

  return {
    status: 'valid',
    backup: result.backup,
    preview: result.preview,
  };
}

export async function replaceAllDataWithBackup(
  backup: BackupFile
): Promise<{ safetyBackupUri: string }> {
  const currentBackup = await buildCurrentBackup();
  const safetyBackupUri = await saveSafetyBackup(currentBackup);
  const db = await getDatabase();

  await importBackupIntoDatabase(db, backup);

  return { safetyBackupUri };
}
