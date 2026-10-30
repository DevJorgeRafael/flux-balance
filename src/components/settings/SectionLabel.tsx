import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fontSize, spacing, useColors } from '@/components/ui/theme';

export function SectionLabel({ children }: { children: string }) {
  const colors = useColors();

  return <Text style={[styles.label, { color: colors.textLight }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
});
