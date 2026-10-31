import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Download, RotateCcw, Upload } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { ResetDataModal } from './ResetDataModal';
import { SectionLabel } from './SectionLabel';
import { SettingsRow } from './SettingsRow';

export function DataSection() {
  const { t } = useTranslation();
  const { handleResetAllData } = useDashboard();

  const [isResetModalVisible, setIsResetModalVisible] = useState(false);

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
          onPress={() => router.push('/settings/export-data')}
        />
        <SettingsRow
          icon={Upload}
          label={t('importData')}
          showChevron
          onPress={() => router.push('/settings/import-data')}
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
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
});
