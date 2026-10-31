const BACKUP_FILE_PATTERN =
  /^flux-balance-backup-\d{4}-\d{2}-\d{2}\.(?:json|xlsx)$/;
const ERROR_REPORT_PATTERN =
  /^flux-balance-error-report-[A-Za-z0-9._-]+\.txt$/;

export function isExportCacheFileName(name: string): boolean {
  return BACKUP_FILE_PATTERN.test(name) || ERROR_REPORT_PATTERN.test(name);
}
