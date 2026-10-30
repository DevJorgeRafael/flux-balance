import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Download, RotateCcw, Upload } from 'lucide-react-native';
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
  replaceAllDataWithBackup,
  shareBackup,
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
  const { t } = useTranslation();
  const { setCurrency } = useCurrency();
  const {
    handleResetAllData,
    handleDataImported,
  } = useDashboard();

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExport = useCallback(() => {
    if (isExporting || isImporting) return;

    Alert.alert(t('backupExportWarningTitle'), t('backupExportWarningMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('backupExportContinue'),
        onPress: () => {
          void runExport();
        },
      },
    ]);
  }, [isExporting, isImporting, runExport, t]);

  const handleImport = useCallback(async () => {
    if (isExporting || isImporting) return;

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
  }, [isExporting, isImporting, t]);

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
        onClose={handleCloseImportModal}
        onConfirm={() => {
          void handleConfirmImport();
        }}
      />

      <BackupProgressModal
        visible={isExporting}
        message={t('backupExportProgress')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
});
