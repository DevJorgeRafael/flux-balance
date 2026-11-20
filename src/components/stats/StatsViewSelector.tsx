import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ChartLine from 'lucide-react-native/icons/chart-line';
import ChartPie from 'lucide-react-native/icons/chart-pie';
import Wallet from 'lucide-react-native/icons/wallet';
import { radius, spacing, useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

export type StatsView = 'categories' | 'trend' | 'balance';

interface StatsViewSelectorProps {
  value: StatsView;
  onChange: (view: StatsView) => void;
}

export function StatsViewSelector({ value, onChange }: StatsViewSelectorProps) {
  const colors = useColors();
  const { t } = useTranslation();

  const options = [
    {
      value: 'categories' as const,
      label: t('statsViewCategories'),
      Icon: ChartPie,
    },
    {
      value: 'trend' as const,
      label: t('statsViewTrend'),
      Icon: ChartLine,
    },
    {
      value: 'balance' as const,
      label: t('statsViewBalance'),
      Icon: Wallet,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.controlTrack }]}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.option,
              isSelected && { backgroundColor: colors.cardRaised },
              pressed && styles.pressed,
            ]}
          >
            <option.Icon
              size={14}
              color={isSelected ? colors.text : colors.textLight}
              strokeWidth={2.3}
            />
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.text : colors.textLight },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 3,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  option: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
