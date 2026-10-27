import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bestTextColor, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import type { CategoryDonutSlice } from './CategoryDonut';

interface CategoryBreakdownListProps {
  items: CategoryDonutSlice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryBreakdownList({
  items,
  selectedId,
  onSelect,
}: CategoryBreakdownListProps) {
  const colors = useColors();
  const { format } = useCurrency();

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const chipTextColor = bestTextColor(item.color, colors.white, colors.black);

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.percentage}%, ${format(item.amount)}`}
            accessibilityState={{ selected: selectedId === item.id }}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.surface },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.chip, { backgroundColor: item.color }]}>
              <Text style={[styles.chipText, { color: chipTextColor }]}>
                {item.percentage}%
              </Text>
            </View>

            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>

            <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
              {format(item.amount)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  chip: {
    minWidth: 48,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  name: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
