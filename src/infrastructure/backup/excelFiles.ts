import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getExcelFileName } from '../../core/services/backup-format';
import { BackupFileError } from './backupFiles';
import { deleteCachedFile } from './exportCache';

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSX_UTI = 'org.openxmlformats.spreadsheetml.sheet';

export async function writeExcelFile(
  bytes: Uint8Array,
  date: Date = new Date()
): Promise<File> {
  const file = new File(Paths.cache, getExcelFileName(date));
  try {
    file.create({ overwrite: true, intermediates: true });
    await file.write(bytes);
    return file;
  } catch {
    deleteCachedFile(file);
    throw new BackupFileError('writeFailed');
  }
}

export async function shareExcelFile(
  file: File,
  dialogTitle: string
): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new BackupFileError('sharingUnavailable');
    }

    await Sharing.shareAsync(file.uri, {
      dialogTitle,
      mimeType: XLSX_MIME_TYPE,
      UTI: XLSX_UTI,
    });
  } finally {
    deleteCachedFile(file);
  }
}

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(value: string): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of value.replace(/[^A-Za-z0-9+/=]/g, '')) {
    if (char === '=') break;
    const index = BASE64_CHARS.indexOf(char);
    if (index === -1) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

async function readExcelBytes(uri: string): Promise<Uint8Array> {
  try {
    return await new File(uri).bytes();
  } catch (error) {
    if (uri.startsWith('content://')) throw error;

    console.warn('File.bytes() falló, reintentando con readAsStringAsync.');
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return decodeBase64(base64);
  }
}

export async function pickExcelFileBytes(): Promise<Uint8Array | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [XLSX_MIME_TYPE],
    copyToCacheDirectory: Platform.OS !== 'android',
    multiple: false,
  });

  if (result.canceled) return null;

  try {
    return await readExcelBytes(result.assets[0].uri);
  } catch {
    console.error('Error reading Excel file.');
    throw new BackupFileError('readFailed');
  }
}
