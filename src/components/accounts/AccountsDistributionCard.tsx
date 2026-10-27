import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shadow, useColors, useThemeMode } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AccountDistributionSegment } from '@/core/services/account-distribution';

interface AccountsDistributionCardProps {
  segments: AccountDistributionSegment[];
}

export function AccountsDistributionCard({ segments }: AccountsDistributionCardProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        !isDark && shadow.md,
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t('distribution')}</Text>

      <View style={[styles.bar, { backgroundColor: colors.surfaceMuted }]}>
        {segments.map((segment) => (
          <View
            key={segment.id}
            style={{ flex: segment.amount, backgroundColor: segment.color }}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.id} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text
              style={[styles.legendName, { color: colors.text }]}
              numberOfLines={1}
            >
              {segment.name}
            </Text>
            <Text style={[styles.legendPercentage, { color: colors.textLight }]}>
              {segment.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  legend: {
    marginTop: 16,
    gap: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  legendPercentage: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
