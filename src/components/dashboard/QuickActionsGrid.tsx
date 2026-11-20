import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import Plus from 'lucide-react-native/icons/plus';
import Minus from 'lucide-react-native/icons/minus';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickActionsGridProps {
  onOpenTransactionModal: (type: 'INCOME' | 'EXPENSE') => void;
}

export function QuickActionsGrid({ onOpenTransactionModal }: QuickActionsGridProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const incomeScale = useSharedValue(1);
  const expenseScale = useSharedValue(1);

  const incomeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: incomeScale.get() }],
  }));
  const expenseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: expenseScale.get() }],
  }));

  return (
    <View style={styles.actionGrid}>
      {/* Botón Ingreso */}
      <AnimatedPressable
        style={[styles.primaryActionBtn, { backgroundColor: colors.success }, incomeStyle]}
        onPressIn={() => incomeScale.set(withTiming(0.96, { duration: 100 }))}
        onPressOut={() => incomeScale.set(withTiming(1, { duration: 100 }))}
        onPress={() => onOpenTransactionModal('INCOME')}
        accessibilityRole="button"
        accessibilityLabel={t('addIncome')}
      >
        <View style={[styles.actionIconCircle, { backgroundColor: colors.onAccentMuted }]}>
          <Plus size={20} color={colors.onSuccess} strokeWidth={2.5} />
        </View>
        <Text style={[styles.primaryActionText, { color: colors.onSuccess }]}>{t('addIncome')}</Text>
      </AnimatedPressable>

      {/* Botón Gasto */}
      <AnimatedPressable
        style={[styles.primaryActionBtn, { backgroundColor: colors.error }, expenseStyle]}
        onPressIn={() => expenseScale.set(withTiming(0.96, { duration: 100 }))}
        onPressOut={() => expenseScale.set(withTiming(1, { duration: 100 }))}
        onPress={() => onOpenTransactionModal('EXPENSE')}
        accessibilityRole="button"
        accessibilityLabel={t('addExpense')}
      >
        <View style={[styles.actionIconCircle, { backgroundColor: colors.onAccentMuted }]}>
          <Minus size={20} color={colors.onError} strokeWidth={2.5} />
        </View>
        <Text style={[styles.primaryActionText, { color: colors.onError }]}>{t('addExpense')}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  primaryActionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  actionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
