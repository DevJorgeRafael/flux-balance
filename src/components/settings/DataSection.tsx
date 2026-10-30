import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/components/ui/theme';
import type {
  BackupFile,
  BackupPreview,
  BackupValidationError,
} from '@/core/models/backup';
import { hasBackupData } from '@/core/services/backup-format';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import {
  buildCurrentBackup,
  pickAndValidateBackup,
  pickAndValidateExcelBackup,
  replaceAllDataWithBackup,
  shareBackup,
  shareExcelBackup,
  shareExcelTemplate,
} from '@/infrastructure/backup/backupService';
import { BackupFileError } from '@/infrastructure/backup/backupFiles';
import { BackupProgressModal } from './BackupProgressModal';
import { ImportBackupModal } from './ImportBackupModal';
import { ResetDataModal } from './ResetDataModal';
import { SectionLabel } from './SectionLabel';
import { SettingsRow } from './SettingsRow';

interface PendingImport {
  backup: BackupFile;
  preview: BackupPreview;
}

export function DataSection() {
  const { language, t } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const {
    handleResetAllData,
    handleDataImported,
  } = useDashboard();

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importErrors, setImportErrors] = useState<BackupValidationError[] | null>(
    null
  );

  const runExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const backup = await buildCurrentBackup();
      if (!hasBackupData(backup)) {
        Alert.alert(t('backupNoDataTitle'), t('backupNoDataMessage'));
        return;
      }

      await shareBackup(backup, t('exportData'));
    } catch (error) {
      console.error('Error exporting backup:', error);
      if (
        error instanceof BackupFileError &&
        error.code === 'sharingUnavailable'
      ) {
        Alert.alert(t('error'), t('backupErrorShareUnavailable'));
      } else {
        Alert.alert(t('error'), t('backupErrorExportFailed'));
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
        Alert.alert(t('backupNoDataTitle'), t('backupNoDataMessage'));
        return;
      }

      await shareExcelBackup(backup, language, t('exportExcel'));
    } catch (error) {
      console.error('Error exporting Excel backup:', error);
      if (
        error instanceof BackupFileError &&
        error.code === 'sharingUnavailable'
      ) {
        Alert.alert(t('error'), t('backupErrorShareUnavailable'));
      } else {
        Alert.alert(t('error'), t('backupErrorExportFailed'));
      }
    } finally {
      setIsExportingExcel(false);
    }
  }, [language, t]);

  const handleExport = useCallback(() => {
    if (isExporting || isExportingExcel || isImporting) return;

    Alert.alert(t('backupExportWarningTitle'), t('backupExportWarningMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('backupExportContinue'),
        onPress: () => {
          void runExport();
        },
      },
    ]);
  }, [isExporting, isExportingExcel, isImporting, runExport, t]);

  const handleExportExcel = useCallback(() => {
    if (isExporting || isExportingExcel || isImporting) return;

    Alert.alert(t('backupExportWarningTitle'), t('backupExportWarningMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('backupExportContinue'),
        onPress: () => {
          void runExportExcel();
        },
      },
    ]);
  }, [isExporting, isExportingExcel, isImporting, runExportExcel, t]);

  const handleExportTemplate = useCallback(async () => {
    if (isExporting || isExportingExcel || isImporting) return;

    setIsExportingExcel(true);
    try {
      await shareExcelTemplate(language, currency, t('backupExcelTemplate'));
    } catch (error) {
      console.error('Error exporting Excel template:', error);
      if (
        error instanceof BackupFileError &&
        error.code === 'sharingUnavailable'
      ) {
        Alert.alert(t('error'), t('backupErrorShareUnavailable'));
      } else {
        Alert.alert(t('error'), t('backupErrorExportFailed'));
      }
    } finally {
      setIsExportingExcel(false);
    }
  }, [currency, isExporting, isExportingExcel, isImporting, language, t]);

  const handleImport = useCallback(async () => {
    if (isExporting || isExportingExcel || isImporting) return;

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
        Alert.alert(t('error'), t('backupErrorFileRead'));
      } else {
        Alert.alert(t('error'), t('backupErrorImportFailed'));
      }
    }
  }, [isExporting, isExportingExcel, isImporting, t]);

  const handleImportExcel = useCallback(async () => {
    if (isExporting || isExportingExcel || isImporting) return;

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
        Alert.alert(t('error'), t('backupErrorFileRead'));
      } else {
        Alert.alert(t('error'), t('backupErrorImportFailed'));
      }
    }
  }, [currency, isExporting, isExportingExcel, isImporting, language, t]);

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
      Alert.alert(t('error'), t('backupErrorImportFailed'));
    } finally {
      setIsImporting(false);
    }
  }, [handleDataImported, isImporting, pendingImport, setCurrency, t]);

  const handleConfirmReset = useCallback(async () => {
    await handleResetAllData();
    setIsResetModalVisible(false);
    router.navigate('/');
  }, [handleResetAllData]);

  return (
    <>
      <SectionLabel>{t('data')}</SectionLabel>
      <Card style={styles.card}>
        <SettingsRow
          icon={Download}
          label={t('exportData')}
          showChevron
          onPress={handleExport}
        />
        <SettingsRow
          icon={Upload}
          label={t('importData')}
          showChevron
          onPress={() => {
            void handleImport();
          }}
        />
        <SettingsRow
          icon={FileSpreadsheet}
          label={t('exportExcel')}
          showChevron
          onPress={handleExportExcel}
        />
        <SettingsRow
          icon={FileSpreadsheet}
          label={t('importExcel')}
          showChevron
          onPress={() => {
            void handleImportExcel();
          }}
        />
        <SettingsRow
          icon={RotateCcw}
          label={t('resetData')}
          destructive
          isLast
          onPress={() => setIsResetModalVisible(true)}
        />
      </Card>

      <ResetDataModal
        visible={isResetModalVisible}
        onClose={() => setIsResetModalVisible(false)}
        onConfirm={handleConfirmReset}
      />

      <ImportBackupModal
        visible={isImportModalVisible}
        preview={pendingImport?.preview ?? null}
        errors={importErrors}
        isImporting={isImporting}
        isExportingTemplate={isExportingExcel}
        onClose={handleCloseImportModal}
        onConfirm={() => {
          void handleConfirmImport();
        }}
        onExportTemplate={() => {
          void handleExportTemplate();
        }}
      />

      <BackupProgressModal
        visible={isExporting || isExportingExcel}
        message={
          isExportingExcel
            ? t('backupExcelExportProgress')
            : t('backupExportProgress')
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
});
