import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { StatsTransactionType } from '@/core/services/stats-breakdown';
import type { DailyStats } from '@/core/services/stats-daily';

interface DailyTrendSummaryProps {
  stats: DailyStats;
  type: StatsTransactionType;
  month: Date;
}

export function DailyTrendSummary({ stats, type, month }: DailyTrendSummaryProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { format, locale } = useCurrency();
  const peak = stats.maxPoint;
  const peakDate = peak
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
        new Date(month.getFullYear(), month.getMonth(), peak.day)
      )
    : null;

  const metrics = [
    {
      key: 'average',
      label: t('dailyAverage'),
      value: format(stats.average),
      detail: null,
    },
    {
      key: 'peak',
      label: t('highestDay'),
      value: peak ? format(peak.amount) : '—',
      detail: peakDate,
    },
    {
      key: 'active',
      label: t(type === 'INCOME' ? 'daysWithIncome' : 'daysWithExpenses'),
      value: String(stats.activeDays),
      detail: null,
    },
  ];

  return (
    <Card style={styles.card}>
      {metrics.map((metric) => (
        <View
          key={metric.key}
          accessible
          accessibilityLabel={`${metric.label}: ${metric.value}${
            metric.detail ? ` (${metric.detail})` : ''
          }`}
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
            style={[styles.value, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {metric.value}
          </Text>
          {metric.detail ? (
            <Text
              style={[styles.detail, { color: colors.textLight }]}
              numberOfLines={1}
            >
              {metric.detail}
            </Text>
          ) : null}
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
  detail: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '600',
  },
});
