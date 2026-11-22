import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius, spacing, useColors } from '@/components/ui/theme';

export interface SegmentedTypeOption<T extends string> {
  value: T;
  label: string;
  color: string;
  textColor: string;
}

interface SegmentedTypeControlProps<T extends string> {
  value: T;
  options: readonly SegmentedTypeOption<T>[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedTypeControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: SegmentedTypeControlProps<T>) {
  const colors = useColors();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.track,
        { backgroundColor: colors.controlTrack },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            hitSlop={{ top: 2, bottom: 2 }}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: option.color },
              pressed && styles.pressed,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: selected ? option.textColor : colors.textLight },
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
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
