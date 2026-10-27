import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import type { CategorySlice } from '@/core/services/stats-breakdown';

export interface CategoryDonutSlice extends CategorySlice {
  color: string;
}

interface CategoryDonutProps {
  slices: CategoryDonutSlice[];
  total: number;
  selectedId: string | null;
}

const SIZE = 228;
const CENTER = SIZE / 2;
const RADIUS = 82;
const STROKE_WIDTH = 24;
const SELECTED_STROKE_WIDTH = 30;
const SEGMENT_GAP = 3;

export function CategoryDonut({ slices, total, selectedId }: CategoryDonutProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const circumference = 2 * Math.PI * RADIUS;
  const segmentLengths = slices.map((slice) => (slice.amount / total) * circumference);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${t('total')} ${format(total)}`}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={colors.border}
          strokeWidth={STROKE_WIDTH}
          opacity={0.35}
        />

        <G rotation={-90} originX={CENTER} originY={CENTER}>
          {slices.map((slice, index) => {
            const gap = slices.length > 1 ? SEGMENT_GAP : 0;
            const dashLength = Math.max((segmentLengths[index] ?? 0) - gap, 0.5);
            const dashOffset = -segmentLengths
              .slice(0, index)
              .reduce((sum, segmentLength) => sum + segmentLength, 0);

            const isSelected = selectedId === slice.id;
            const isDimmed = Boolean(selectedId) && !isSelected;

            return (
              <Circle
                key={slice.id}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : STROKE_WIDTH}
                strokeDasharray={[dashLength, Math.max(circumference - dashLength, 0)]}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                opacity={isDimmed ? 0.28 : 1}
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.centerLabel, { color: colors.textLight }]}>
          {t('total').toUpperCase()}
        </Text>
        <Text
          style={[styles.centerAmount, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.62}
        >
          {format(total)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    width: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  centerAmount: {
    maxWidth: '100%',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
});
