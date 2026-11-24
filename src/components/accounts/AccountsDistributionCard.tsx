import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, withAlpha } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AccountDistributionSegment } from '@/core/services/account-distribution';

interface AccountsDistributionCardProps {
  segments: AccountDistributionSegment[];
}

const SEGMENT_OPACITIES = [1, 0.72, 0.52, 0.36, 0.24];

export function AccountsDistributionCard({ segments }: AccountsDistributionCardProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>{t('distribution')}</Text>

      <View style={[styles.bar, { backgroundColor: colors.controlTrack }]}>
        {segments.map((segment, index) => (
          <View
            key={segment.id}
            style={{
              flex: segment.amount,
              backgroundColor: withAlpha(
                colors.primary,
                SEGMENT_OPACITIES[index] ?? 0.2
              ),
            }}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <View key={segment.id} style={styles.legendRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: withAlpha(
                    colors.primary,
                    SEGMENT_OPACITIES[index] ?? 0.2
                  ),
                },
              ]}
            />
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 28,
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
