import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Language } from '@/core/i18n/translations';
import { buildErrorReport } from '@/core/services/errorReport';
import { deleteCachedFile } from '@/infrastructure/backup/exportCache';

export type ErrorReportErrorCode = 'unavailable' | 'writeFailed' | 'shareFailed';

export class ErrorReportError extends Error {
  readonly code: ErrorReportErrorCode;

  constructor(code: ErrorReportErrorCode) {
    super(code);
    this.name = 'ErrorReportError';
    this.code = code;
  }
}

export async function shareErrorReport(
  error: unknown,
  language: Language,
  dialogTitle: string
): Promise<void> {
  const file = new File(
    Paths.cache,
    `flux-balance-error-report-${Date.now()}.txt`
  );

  try {
    try {
      file.create({ overwrite: true, intermediates: true });
      await file.write(
        buildErrorReport(
          error,
          {
            appVersion: Constants.expoConfig?.version ?? '0.0.0',
            platform: `${Platform.OS} ${String(Platform.Version)}`,
            generatedAt: new Date().toISOString(),
          },
          language
        )
      );
    } catch {
      throw new ErrorReportError('writeFailed');
    }

    let available = false;
    try {
      available = await Sharing.isAvailableAsync();
    } catch {
      throw new ErrorReportError('shareFailed');
    }

    if (!available) {
      throw new ErrorReportError('unavailable');
    }

    try {
      await Sharing.shareAsync(file.uri, {
        dialogTitle,
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
      });
    } catch {
      throw new ErrorReportError('shareFailed');
    }
  } finally {
    deleteCachedFile(file);
  }
}
