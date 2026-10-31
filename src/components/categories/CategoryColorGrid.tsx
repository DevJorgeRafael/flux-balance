import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { CATEGORY_COLOR_PALETTES } from '@/core/constants/categoryPalettes';
import type { CategoryType } from '@/core/models/category';
import {
  getReadableBackgroundColor,
  getReadableTextColor,
  useColors,
} from '@/components/ui/theme';

interface CategoryColorGridProps {
  type: CategoryType;
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function CategoryColorGrid({
  type,
  selectedColor,
  onSelect,
}: CategoryColorGridProps) {
  const colors = useColors();
  const palette = CATEGORY_COLOR_PALETTES[type];
  const normalizedSelected = selectedColor.toLowerCase();

  return (
    <View style={styles.grid}>
      {palette.map((row, rowIndex) => (
        <View key={`${type}-${rowIndex}`} style={styles.row}>
          {row.map((color) => {
            const isSelected = normalizedSelected === color.toLowerCase();
            const badgeBackgroundColor = getReadableBackgroundColor(color);
            const badgeTextColor = getReadableTextColor(badgeBackgroundColor, colors.text);

            return (
              <Pressable
                key={color}
                onPress={() => onSelect(color)}
                accessibilityRole="button"
                accessibilityLabel={color}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.cell,
                  { backgroundColor: color },
                  isSelected && [styles.selectedCell, { borderColor: colors.text }],
                  pressed && styles.pressed,
                ]}
              >
                {isSelected ? (
                  <View style={[styles.checkBadge, { backgroundColor: badgeBackgroundColor }]}>
                    <Check size={14} color={badgeTextColor} strokeWidth={4} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    borderWidth: 2.5,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
