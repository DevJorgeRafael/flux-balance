import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, useThemeMode } from '@/components/ui/theme';
import { MonthlyTotals } from '@/core/repositories/ITransactionRepository';
import { formatCurrency } from '@/core/utils/currency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface DashboardSummaryCardProps {
  monthlyTotals: MonthlyTotals;
  isBalanceVisible: boolean;
}

export function DashboardSummaryCard({
  monthlyTotals,
  isBalanceVisible,
}: DashboardSummaryCardProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardRaised,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.35 : 0.18,
          elevation: isDark ? 10 : 14,
        },
      ]}
    >
      <View style={styles.metric}>
        <View style={styles.metricLabelRow}>
          <View style={[styles.metricDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.metricLabel, { color: colors.textLight }]} numberOfLines={1}>
            {t('income')}
          </Text>
        </View>
        <Text
          style={[styles.metricValue, { color: colors.successText }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(monthlyTotals.totalIncome, true, isBalanceVisible)}
        </Text>
      </View>

      <View style={styles.metric}>
        <View style={styles.metricLabelRow}>
          <View style={[styles.metricDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.metricLabel, { color: colors.textLight }]} numberOfLines={1}>
            {t('expense')}
          </Text>
        </View>
        <Text
          style={[styles.metricValue, { color: colors.errorText }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(monthlyTotals.totalExpense, true, isBalanceVisible)}
        </Text>
      </View>

      <View style={styles.metric}>
        <View style={styles.metricLabelRow}>
          <View style={[styles.metricDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.metricLabel, { color: colors.textLight }]} numberOfLines={1}>
            {t('net')}
          </Text>
        </View>
        <Text
          style={[styles.metricValue, { color: colors.primaryText }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(monthlyTotals.netSavings, true, isBalanceVisible)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    zIndex: 2,
    elevation: 14,
    minHeight: 80,
    marginHorizontal: 24,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});
