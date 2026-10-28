import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AccountType } from '@/core/models/account';
import { useCurrency } from '@/core/currency/useCurrency';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountProjectionPreviewProps {
  accountType: AccountType;
  rate: number;
  finalAmount: number;
}

export function AccountProjectionPreview({
  accountType,
  rate,
  finalAmount,
}: AccountProjectionPreviewProps) {
  const colors = useColors();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const isFixed = accountType === 'FIXED_TERM';

  return (
    <Card
      backgroundColor={isFixed ? colors.warningSoft : colors.successSoft}
      borderColor={isFixed ? colors.warning : colors.successText}
      style={styles.card}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t('previewYield')}</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textLight }]}>{t('appliedRate')}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{rate.toFixed(2)}% TNA</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textLight }]}>{t('estimatedFinalAmount')}</Text>
        <Text style={[styles.value, { color: colors.primaryText }]}>{format(finalAmount)}</Text>
      </View>
      <Text style={[styles.hint, { color: colors.textLight }]}>
        {isFixed
          ? t('simpleInterestHint')
          : t('compoundInterestHint')}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginTop: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
});
