import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/components/ui/theme';

export interface OptionChip {
  id: string;
  label: string;
}

interface OptionChipsProps {
  options: OptionChip[];
  selectedId: string;
  onSelect: (id: string) => void;
  allowDeselect?: boolean;
}

export function OptionChips({
  options,
  selectedId,
  onSelect,
  allowDeselect = false,
}: OptionChipsProps) {
  const colors = useColors();

  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option.id === selectedId;

        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(selected && allowDeselect ? '' : option.id)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            hitSlop={2}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.inputBackground,
                borderColor: colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected ? colors.onPrimary : colors.text },
              ]}
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
