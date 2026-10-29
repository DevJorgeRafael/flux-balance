import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Download, RotateCcw, Upload, type LucideIcon } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { ResetDataModal } from './ResetDataModal';
import { SectionLabel } from './SectionLabel';
import { SettingsRow } from './SettingsRow';

interface DataSectionProps {
  onExportData?: () => void;
  onImportData?: () => void;
}

interface TransferRow {
  key: 'exportData' | 'importData';
  icon: LucideIcon;
  onPress: () => void;
}

export function DataSection({ onExportData, onImportData }: DataSectionProps) {
  const { t } = useTranslation();
  const { handleResetAllData } = useDashboard();
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);

  const transferRows: TransferRow[] = [];

  if (onExportData) {
    transferRows.push({ key: 'exportData', icon: Download, onPress: onExportData });
  }

  if (onImportData) {
    transferRows.push({ key: 'importData', icon: Upload, onPress: onImportData });
  }

  const handleConfirmReset = useCallback(async () => {
    await handleResetAllData();
    setIsResetModalVisible(false);
    router.navigate('/');
  }, [handleResetAllData]);

  return (
    <>
      <SectionLabel>{t('data')}</SectionLabel>
      <Card style={styles.card}>
        {transferRows.map((row) => (
          <SettingsRow
            key={row.key}
            icon={row.icon}
            label={t(row.key)}
            showChevron
            onPress={row.onPress}
          />
        ))}

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
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
});
