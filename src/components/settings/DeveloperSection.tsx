import React from 'react';
import { StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/components/ui/theme';
import { IS_DEVELOPMENT_MODE } from '@/core/constants/environment';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { SectionLabel } from './SectionLabel';
import { SettingsRow } from './SettingsRow';

export function DeveloperSection() {
  const { t } = useTranslation();
  const { handleSeedDemoData } = useDashboard();

  if (!IS_DEVELOPMENT_MODE) return null;

  return (
    <>
      <SectionLabel>{t('developerMode')}</SectionLabel>
      <Card style={styles.card}>
        <SettingsRow
          icon={Sparkles}
          label={t('demoMode')}
          isLast
          onPress={() => void handleSeedDemoData()}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
});
