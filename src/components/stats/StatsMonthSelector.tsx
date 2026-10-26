import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColors } from '@/components/ui/theme';

interface StatsMonthSelectorProps {
  monthLabel: string;
  previousLabel: string;
  nextLabel: string;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function StatsMonthSelector({
  monthLabel,
  previousLabel,
  nextLabel,
  nextDisabled,
  onPrevious,
  onNext,
}: StatsMonthSelectorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPrevious}
        accessibilityRole="button"
        accessibilityLabel={previousLabel}
        style={({ pressed }) => [
          styles.arrow,
          { backgroundColor: colors.surface },
          pressed && styles.pressed,
        ]}
      >
        <ChevronLeft size={20} color={colors.text} strokeWidth={2.4} />
      </Pressable>

      <Text
        accessibilityRole="header"
        style={[styles.label, { color: colors.text }]}
        numberOfLines={1}
      >
        {monthLabel}
      </Text>

      <Pressable
        onPress={onNext}
        disabled={nextDisabled}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: nextDisabled }}
        style={({ pressed }) => [
          styles.arrow,
          { backgroundColor: colors.surface },
          nextDisabled && styles.disabled,
          pressed && !nextDisabled && styles.pressed,
        ]}
      >
        <ChevronRight
          size={20}
          color={nextDisabled ? colors.textLight : colors.text}
          strokeWidth={2.4}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pressed: {
    opacity: 0.68,
  },
  disabled: {
    opacity: 0.38,
  },
});
