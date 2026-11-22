import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { BalanceStats } from '@/core/services/stats-balance';

interface BalanceEvolutionSummaryProps {
  stats: BalanceStats;
}

export function BalanceEvolutionSummary({ stats }: BalanceEvolutionSummaryProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { format } = useCurrency();

  const changeColor =
    stats.change > 0
      ? colors.successText
      : stats.change < 0
        ? colors.errorText
        : colors.text;

  const metrics = [
    {
      key: 'start',
      label: t('balanceStart'),
      value: format(stats.startBalance),
      color: stats.startBalance < 0 ? colors.errorText : colors.text,
    },
    {
      key: 'end',
      label: t('balanceEnd'),
      value: format(stats.endBalance),
      color: stats.endBalance < 0 ? colors.errorText : colors.text,
    },
    {
      key: 'change',
      label: t('balanceChange'),
      value: `${stats.change > 0 ? '+' : ''}${format(stats.change)}`,
      color: changeColor,
    },
  ];

  return (
    <Card style={styles.card}>
      {metrics.map((metric) => (
        <View
          key={metric.key}
          accessible
          accessibilityLabel={`${metric.label}: ${metric.value}`}
          style={styles.metric}
        >
          <Text
            style={[styles.label, { color: colors.textLight }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {metric.label}
          </Text>
          <Text
            style={[styles.value, { color: metric.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {metric.value}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
