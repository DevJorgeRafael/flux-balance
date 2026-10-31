import { MAX_AMOUNT } from '@/core/constants/inputLimits';
import type { TranslationKey } from '@/core/i18n/translations';
import type { BackupValidationError } from '@/core/models/backup';

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export function isExcelFormatError(error: BackupValidationError): boolean {
  return error.code === 'missingSheet' || error.code === 'missingColumn';
}

export function formatBackupError(
  error: BackupValidationError,
  t: Translate
): string {
  const path = error.path ?? String(error.params?.path ?? '');
  const id = String(error.params?.id ?? '');
  const version = String(error.params?.version ?? '?');
  const supported = String(error.params?.supported ?? '?');
  const sheet = String(error.sheet ?? error.params?.sheet ?? '');
  const column = String(error.column ?? error.params?.column ?? '');
  const name = String(error.params?.name ?? '');
  const value = String(error.params?.value ?? '');
  const type = String(error.params?.type ?? '');
  const limit = String(error.params?.limit ?? '?');
  const count = String(error.params?.count ?? '?');
  const expected = String(error.params?.expected ?? '?');
  const actual = String(error.params?.actual ?? '?');
  const max = String(MAX_AMOUNT);

  let message: string;
  switch (error.code) {
    case 'invalidJson':
      message = t('backupErrorInvalidJson');
      break;
    case 'invalidFormat':
      message = t('backupErrorInvalidFormat');
      break;
    case 'invalidExcelFormat':
      message = t('backupErrorInvalidExcelFormat');
      break;
    case 'invalidSchemaVersion':
      message = t('backupErrorInvalidSchemaVersion');
      break;
    case 'futureSchemaVersion':
      message = t('backupErrorFutureVersion', { version, supported });
      break;
    case 'unsupportedSchemaVersion':
      message = t('backupErrorUnsupportedVersion', { version, supported });
      break;
    case 'missingField':
      message = t('backupErrorMissingField', { path });
      break;
    case 'missingSheet':
      message = t('backupErrorMissingSheet', { sheet });
      break;
    case 'missingColumn':
      message = t('backupErrorMissingColumn', { sheet, column });
      break;
    case 'invalidType':
      message = t('backupErrorInvalidType', { path });
      break;
    case 'invalidAmount':
      message = t('backupErrorInvalidAmount', { path, max });
      break;
    case 'invalidPositiveAmount':
      message = t('backupErrorInvalidPositiveAmount', { path });
      break;
    case 'invalidDate':
      message = t('backupErrorInvalidDate', { path });
      break;
    case 'invalidId':
      message = t('backupErrorInvalidId', { path, id });
      break;
    case 'invalidSplitTotal':
      message = t('backupErrorInvalidSplitTotal', {
        path,
        expected,
        actual,
      });
      break;
    case 'tooManyItems':
      message = t('backupErrorTooManyItems', { path, limit, count });
      break;
    case 'duplicateId':
      message = t('backupErrorDuplicateId', { path, id });
      break;
    case 'duplicateName':
      message = t('backupErrorDuplicateName', { name });
      break;
    case 'missingAccount':
      message = t('backupErrorMissingAccount', { path, id });
      break;
    case 'missingCategory':
      message = t('backupErrorMissingCategory', { path, id });
      break;
    case 'unknownAccount':
      message = t('backupErrorUnknownAccount', { name });
      break;
    case 'unknownCategory':
      message = t('backupErrorUnknownCategory', { name, type });
      break;
    case 'invalidAccountType':
      message = t('backupErrorInvalidAccountType', { value });
      break;
    case 'invalidCategoryType':
      message = t('backupErrorInvalidCategoryType', { value });
      break;
    case 'invalidTransactionType':
      message = t('backupErrorInvalidTransactionType', { value });
      break;
    case 'invalidBoolean':
      message = t('backupErrorInvalidBoolean', { value });
      break;
    case 'invalidRate':
      message = t('backupErrorInvalidRate', { value });
      break;
    case 'invalidTerm':
      message = t('backupErrorInvalidTerm', { value });
      break;
    case 'invalidStatus':
      message = t('backupErrorInvalidStatus', { value });
      break;
    case 'invalidCurrency':
      message = t('backupErrorInvalidCurrency', {
        currency: String(error.params?.currency ?? ''),
      });
      break;
    case 'invalidValue':
      message = t('backupErrorInvalidValue', { path });
      break;
    default:
      message = t('backupErrorInvalidFormat');
  }

  if (error.sheet && error.row && !isExcelFormatError(error)) {
    const location = t('backupErrorLocationRow', {
      sheet: error.sheet,
      row: error.row,
    });
    return `${location}: ${message}`;
  }
  return message;
}
