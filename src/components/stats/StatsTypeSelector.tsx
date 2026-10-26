import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { formatCurrency } from '@/core/utils/currency';
import type { StatsTransactionType } from '@/core/services/stats-breakdown';

interface StatsTypeSelectorProps {
  selectedType: StatsTransactionType;
  incomeTotal: number;
  expenseTotal: number;
  onChange: (type: StatsTransactionType) => void;
}

interface TypeOption {
  type: StatsTransactionType;
  label: string;
  total: number;
  color: string;
  softColor: string;
}

export function StatsTypeSelector({
  selectedType,
  incomeTotal,
  expenseTotal,
  onChange,
}: StatsTypeSelectorProps) {
  const colors = useColors();
  const { t } = useTranslation();

  const options: TypeOption[] = [
    {
      type: 'INCOME',
      label: t('income'),
      total: incomeTotal,
      color: colors.successText,
      softColor: colors.successSoft,
    },
    {
      type: 'EXPENSE',
      label: t('expense'),
      total: expenseTotal,
      color: colors.errorText,
      softColor: colors.errorSoft,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground }]}>
      {options.map((option) => {
        const isSelected = selectedType === option.type;
        const formattedTotal = formatCurrency(option.total);

        return (
          <Pressable
            key={option.type}
            onPress={() => onChange(option.type)}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} ${formattedTotal}`}
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.option,
              isSelected && { backgroundColor: option.softColor },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: isSelected ? option.color : colors.textLight },
              ]}
            >
              {option.label}
            </Text>
            <Text
              style={[
                styles.optionAmount,
                { color: isSelected ? option.color : colors.textLight },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {formattedTotal}
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
    gap: 4,
    padding: 4,
    borderRadius: 22,
    marginBottom: 20,
  },
  option: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionAmount: {
    maxWidth: '100%',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.7,
  },
});
