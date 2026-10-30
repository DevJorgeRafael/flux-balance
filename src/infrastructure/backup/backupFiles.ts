import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { BackupFile } from '../../core/models/backup';
import {
  getBackupFileName,
  serializeBackup,
} from '../../core/services/backup-format';

export type BackupFileErrorCode =
  | 'sharingUnavailable'
  | 'readFailed'
  | 'writeFailed';

export class BackupFileError extends Error {
  readonly code: BackupFileErrorCode;

  constructor(code: BackupFileErrorCode) {
    super(code);
    this.name = 'BackupFileError';
    this.code = code;
  }
}

async function writeFile(file: File, content: string): Promise<void> {
  try {
    file.create({ overwrite: true, intermediates: true });
    await file.write(content);
  } catch {
    throw new BackupFileError('writeFailed');
  }
}

export async function writeExportFile(
  backup: BackupFile,
  date: Date = new Date()
): Promise<File> {
  const file = new File(Paths.cache, getBackupFileName(date));
  await writeFile(file, serializeBackup(backup));
  return file;
}

export async function shareBackupFile(
  file: File,
  dialogTitle: string
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new BackupFileError('sharingUnavailable');
  }

  await Sharing.shareAsync(file.uri, {
    dialogTitle,
    mimeType: 'application/json',
    UTI: 'public.json',
  });
}

async function readTextFromUri(uri: string): Promise<string> {
  try {
    return await new File(uri).text();
  } catch (error) {
    console.warn('File.text() falló, reintentando con readAsStringAsync:', {
      uri,
      error,
    });
    return readAsStringAsync(uri);
  }
}

export async function pickBackupFileText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: Platform.OS !== 'android',
    multiple: false,
  });

  if (result.canceled) return null;

  try {
    return await readTextFromUri(result.assets[0].uri);
  } catch (error) {
    console.error('Error reading backup file:', {
      error,
      asset: result.assets[0],
    });
    throw new BackupFileError('readFailed');
  }
}

