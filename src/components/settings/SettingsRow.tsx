import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useColors } from '@/components/ui/theme';

export interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  destructive?: boolean;
  isLast?: boolean;
  showChevron?: boolean;
  onPress: () => void;
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  destructive = false,
  isLast = false,
  showChevron = false,
  onPress,
}: SettingsRowProps) {
  const colors = useColors();
  const labelColor = destructive ? colors.errorText : colors.text;
  const iconColor = destructive ? colors.errorText : colors.primaryText;
  const iconBackground = destructive ? colors.errorSoft : colors.primarySoft;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>

      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>

      {value ? (
        <View style={[styles.valuePill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.valueText, { color: colors.primaryText }]}>{value}</Text>
        </View>
      ) : null}

      {showChevron ? (
        <ChevronRight size={17} color={colors.textLight} strokeWidth={2.4} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  valuePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
