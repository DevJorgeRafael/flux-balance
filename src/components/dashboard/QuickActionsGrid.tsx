import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { MotiPressable } from 'moti/interactions';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

interface QuickActionsGridProps {
  onOpenTransactionModal: (type: 'INCOME' | 'EXPENSE') => void;
}

export function QuickActionsGrid({ onOpenTransactionModal }: QuickActionsGridProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={styles.actionGrid}>
      {/* Botón Ingreso */}
      <MotiPressable
        containerStyle={{ flex: 1 }}
        style={[
          styles.primaryActionBtn,
          { backgroundColor: colors.success, shadowColor: colors.shadow },
        ]}
        animate={({ pressed }) => {
          'worklet';
          return {
            scale: pressed ? 0.96 : 1,
          };
        }}
        transition={{
          type: 'timing',
          duration: 100,
        } as any}
        onPress={() => onOpenTransactionModal('INCOME')}
      >
        <View style={[styles.actionIconCircle, { backgroundColor: colors.onAccentMuted }]}>
          <Plus size={20} color={colors.onSuccess} strokeWidth={2.5} />
        </View>
        <Text style={[styles.primaryActionText, { color: colors.onSuccess }]}>{t('addIncome')}</Text>
      </MotiPressable>

      {/* Botón Gasto */}
      <MotiPressable
        containerStyle={{ flex: 1 }}
        style={[
          styles.primaryActionBtn,
          { backgroundColor: colors.error, shadowColor: colors.shadow },
        ]}
        animate={({ pressed }) => {
          'worklet';
          return {
            scale: pressed ? 0.96 : 1,
          };
        }}
        transition={{
          type: 'timing',
          duration: 100,
        } as any}
        onPress={() => onOpenTransactionModal('EXPENSE')}
      >
        <View style={[styles.actionIconCircle, { backgroundColor: colors.onAccentMuted }]}>
          <Minus size={20} color={colors.onError} strokeWidth={2.5} />
        </View>
        <Text style={[styles.primaryActionText, { color: colors.onError }]}>{t('addExpense')}</Text>
      </MotiPressable>
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
