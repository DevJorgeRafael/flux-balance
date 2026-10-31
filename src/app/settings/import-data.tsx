import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { FileSpreadsheet, FileText } from 'lucide-react-native';
import { appAlert } from '@/components/ui/alert/appAlert';
import { BackupProgressModal } from '@/components/settings/BackupProgressModal';
import {
  DataTransferScreen,
  type DataTransferOption,
} from '@/components/settings/DataTransferScreen';
import { ImportBackupModal } from '@/components/settings/ImportBackupModal';
import type {
  BackupFile,
  BackupPreview,
  BackupValidationError,
} from '@/core/models/backup';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import {
  pickAndValidateBackup,
  pickAndValidateExcelBackup,
  replaceAllDataWithBackup,
  shareExcelTemplate,
} from '@/infrastructure/backup/backupService';
import { BackupFileError } from '@/infrastructure/backup/backupFiles';

interface PendingImport {
  backup: BackupFile;
  preview: BackupPreview;
}

export default function ImportDataScreen() {
  const { language, t } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const { handleDataImported } = useDashboard();

  const [isReadingImport, setIsReadingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingTemplate, setIsExportingTemplate] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importErrors, setImportErrors] = useState<BackupValidationError[] | null>(
    null
  );

  const isBusy = isReadingImport || isImporting || isExportingTemplate;

  const handleImport = useCallback(async () => {
    if (isBusy) return;

    setIsReadingImport(true);

    try {
      const result = await pickAndValidateBackup();
      if (result.status === 'canceled') return;

      if (result.status === 'invalid') {
        setPendingImport(null);
        setImportErrors(result.errors);
        setIsImportModalVisible(true);
        return;
      }

      setImportErrors(null);
      setPendingImport({
        backup: result.backup,
        preview: result.preview,
      });
      setIsImportModalVisible(true);
    } catch (error) {
      console.error('Error reading backup file:', error);
      if (error instanceof BackupFileError && error.code === 'readFailed') {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorFileRead'),
          buttons: [{ text: t('accept') }],
        });
      } else {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorImportFailed'),
          buttons: [{ text: t('accept') }],
        });
      }
    } finally {
      setIsReadingImport(false);
    }
  }, [isBusy, t]);

  const handleImportExcel = useCallback(async () => {
    if (isBusy) return;

    setIsReadingImport(true);

    try {
      const result = await pickAndValidateExcelBackup(language, currency);
      if (result.status === 'canceled') return;

      if (result.status === 'invalid') {
        setPendingImport(null);
        setImportErrors(result.errors);
        setIsImportModalVisible(true);
        return;
      }

      setImportErrors(null);
      setPendingImport({
        backup: result.backup,
        preview: result.preview,
      });
      setIsImportModalVisible(true);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      if (error instanceof BackupFileError && error.code === 'readFailed') {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorFileRead'),
          buttons: [{ text: t('accept') }],
        });
      } else {
        void appAlert({
          type: 'error',
          title: t('error'),
          message: t('backupErrorImportFailed'),
          buttons: [{ text: t('accept') }],
        });
      }
    } finally {
      setIsReadingImport(false);
    }
  }, [currency, isBusy, language, t]);

  const handleExportTemplate = useCallback(async () => {
    if (isBusy) return;

    setIsExportingTemplate(true);

    try {
      await shareExcelTemplate(language, currency, t('backupExcelTemplate'));
    } catch (error) {
      console.error('Error exporting Excel template:', error);
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
      setIsExportingTemplate(false);
    }
  }, [currency, isBusy, language, t]);

  const handleCloseImportModal = useCallback(() => {
    if (isImporting) return;
    setIsImportModalVisible(false);
    setPendingImport(null);
    setImportErrors(null);
  }, [isImporting]);

  const handleConfirmImport = useCallback(async () => {
    if (!pendingImport || isImporting) return;

    setIsImporting(true);

    try {
      await replaceAllDataWithBackup(pendingImport.backup);
      setCurrency(pendingImport.backup.currency);
      await handleDataImported();

      setIsImportModalVisible(false);
      setPendingImport(null);
      setImportErrors(null);
      router.navigate('/');
    } catch (error) {
      console.error('Error importing backup:', error);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('backupErrorImportFailed'),
        buttons: [{ text: t('accept') }],
      });
    } finally {
      setIsImporting(false);
    }
  }, [handleDataImported, isImporting, pendingImport, setCurrency, t]);

  const options: DataTransferOption[] = [
    {
      key: 'json',
      icon: FileText,
      title: t('backupImportJsonTitle'),
      description: t('backupImportJsonDescription'),
      format: t('backupImportJsonFormat'),
      onPress: () => {
        void handleImport();
      },
    },
    {
      key: 'xlsx',
      icon: FileSpreadsheet,
      title: t('backupImportSpreadsheetTitle'),
      description: t('backupImportSpreadsheetDescription'),
      format: t('backupImportSpreadsheetFormat'),
      onPress: () => {
        void handleImportExcel();
      },
    },
  ];

  return (
    <DataTransferScreen
      title={t('importData')}
      intro={t('importDataIntro')}
      warning={t('backupImportReplaceWarning')}
      options={options}
      busy={isBusy}
    >
      <ImportBackupModal
        visible={isImportModalVisible}
        preview={pendingImport?.preview ?? null}
        errors={importErrors}
        isImporting={isImporting}
        isExportingTemplate={isExportingTemplate}
        onClose={handleCloseImportModal}
        onConfirm={() => {
          void handleConfirmImport();
        }}
        onExportTemplate={() => {
          void handleExportTemplate();
        }}
      />

      <BackupProgressModal
        visible={isReadingImport}
        message={t('backupImportProgress')}
      />
    </DataTransferScreen>
  );
}
