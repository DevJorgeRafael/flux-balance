import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChartPie } from 'lucide-react-native';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { StatsTransactionType } from '@/core/services/stats-breakdown';

interface StatsEmptyStateProps {
  type: StatsTransactionType;
}

export function StatsEmptyState({ type }: StatsEmptyStateProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <ChartPie size={28} color={colors.primaryText} strokeWidth={1.8} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {type === 'INCOME' ? t('noIncomeThisMonth') : t('noExpensesThisMonth')}
      </Text>
      <Text style={[styles.hint, { color: colors.textLight }]}>{t('statsEmptyHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 230,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  hint: {
    maxWidth: 230,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
