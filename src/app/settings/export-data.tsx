import React, { useCallback, useState } from 'react';
import FileSpreadsheet from 'lucide-react-native/icons/file-spreadsheet';
import FileText from 'lucide-react-native/icons/file-text';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { BackupProgressModal } from '@/components/settings/BackupProgressModal';
import {
  DataTransferScreen,
  type DataTransferOption,
} from '@/components/settings/DataTransferScreen';
import { hasBackupData } from '@/core/services/backup-format';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  buildCurrentBackup,
  shareBackup,
  shareExcelBackup,
} from '@/infrastructure/backup/backupService';
import { BackupFileError } from '@/infrastructure/backup/backupFiles';

export default function ExportDataScreen() {
  const { language, t } = useTranslation();

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isBusy = isExporting || isExportingExcel;

  const runExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const backup = await buildCurrentBackup();
      if (!hasBackupData(backup)) {
        void appAlert({
          type: 'warning',
          title: t('backupNoDataTitle'),
          message: t('backupNoDataMessage'),
          buttons: [{ text: t('accept') }],
        });
        return;
      }

      await shareBackup(backup, t('exportData'));
    } catch (error) {
      console.error('Error exporting backup:', error);
      if (
        error instanceof BackupFileError &&
        error.code === 'sharingUnavailable'
      ) {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorShareUnavailable'),
          buttons: [{ text: t('accept') }],
        });
      } else {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorExportFailed'),
          buttons: [{ text: t('accept') }],
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [t]);

  const runExportExcel = useCallback(async () => {
    setIsExportingExcel(true);

    try {
      const backup = await buildCurrentBackup();
      if (!hasBackupData(backup)) {
        void appAlert({
          type: 'warning',
          title: t('backupNoDataTitle'),
          message: t('backupNoDataMessage'),
          buttons: [{ text: t('accept') }],
        });
        return;
      }

      await shareExcelBackup(backup, language, t('exportExcel'));
    } catch (error) {
      console.error('Error exporting Excel backup:', error);
      if (
        error instanceof BackupFileError &&
        error.code === 'sharingUnavailable'
      ) {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorShareUnavailable'),
          buttons: [{ text: t('accept') }],
        });
      } else {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorExportFailed'),
          buttons: [{ text: t('accept') }],
        });
      }
    } finally {
      setIsExportingExcel(false);
    }
  }, [language, t]);

  const handleExport = useCallback(async () => {
    if (isBusy) return;

    const confirmed = await appConfirm({
      title: t('backupExportWarningTitle'),
      message: t('backupExportWarningMessage'),
      confirmText: t('backupExportContinue'),
      cancelText: t('cancel'),
    });
    if (confirmed) void runExport();
  }, [isBusy, runExport, t]);

  const handleExportExcel = useCallback(async () => {
    if (isBusy) return;

    const confirmed = await appConfirm({
      title: t('backupExportWarningTitle'),
      message: t('backupExportWarningMessage'),
      confirmText: t('backupExportContinue'),
      cancelText: t('cancel'),
    });
    if (confirmed) void runExportExcel();
  }, [isBusy, runExportExcel, t]);

  const options: DataTransferOption[] = [
    {
      key: 'json',
      icon: FileText,
      title: t('backupJsonTitle'),
      description: t('backupJsonDescription'),
      format: t('backupJsonFormat'),
      onPress: handleExport,
    },
    {
      key: 'xlsx',
      icon: FileSpreadsheet,
      title: t('backupSpreadsheetTitle'),
      description: t('backupSpreadsheetDescription'),
      format: t('backupSpreadsheetFormat'),
      onPress: handleExportExcel,
    },
  ];

  return (
    <DataTransferScreen
      title={t('exportData')}
      intro={t('exportDataIntro')}
      options={options}
      busy={isBusy}
    >
      <BackupProgressModal
        visible={isBusy}
        message={
          isExportingExcel
            ? t('backupExcelExportProgress')
            : t('backupExportProgress')
        }
      />
    </DataTransferScreen>
  );
}
