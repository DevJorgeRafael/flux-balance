import type { Language } from '../i18n/translations';
import { translations } from '../i18n/translations';

export interface ErrorReportMetadata {
  appVersion: string;
  platform: string;
  generatedAt: string;
}

function describeError(
  error: unknown,
  language: Language
): { name: string; message: string; stack?: string } {
  const copy = translations[language];

  if (error instanceof Error) {
    return {
      name: error.name || copy.errorReportError,
      message: error.message || copy.errorReportNoMessage,
      stack: error.stack,
    };
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return { name: copy.errorReportError, message: error };
  }

  return {
    name: copy.errorReportError,
    message: copy.errorReportUnknownError,
  };
}

export function buildErrorReport(
  error: unknown,
  metadata: ErrorReportMetadata,
  language: Language
): string {
  const copy = translations[language];
  const details = describeError(error, language);
  const lines = [
    copy.errorReportTitle,
    '',
    `${copy.errorReportGeneratedAt}: ${metadata.generatedAt}`,
    `${copy.errorReportAppVersion}: ${metadata.appVersion}`,
    `${copy.errorReportPlatform}: ${metadata.platform}`,
    '',
    `${copy.errorReportError}:`,
    `${details.name}: ${details.message}`,
  ];

  if (details.stack) {
    lines.push('', details.stack);
  }

  return `${lines.join('\n')}\n`;
}
