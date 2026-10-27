import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface DashboardHeroProps {
  totalBalance: number;
  isBalanceVisible: boolean;
  onToggleBalanceVisibility: () => void;
}

export function DashboardHero({
  totalBalance,
  isBalanceVisible,
  onToggleBalanceVisibility,
}: DashboardHeroProps) {
  const colors = useColors();
  const { format } = useCurrency();
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 } as any}
      style={styles.heroContainer}
    >
      <View style={styles.heroLabelRow}>
        <Text style={[styles.heroLabel, { color: colors.onHero }]}>
          {t('consolidatedBalance').toUpperCase()}
        </Text>
        <Pressable
          style={styles.visibilityButton}
          onPress={onToggleBalanceVisibility}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          pointerEvents="auto"
          accessibilityRole="button"
          accessibilityLabel={isBalanceVisible ? 'Hide balance' : 'Show balance'}
        >
          {isBalanceVisible ? (
            <Eye size={18} color={colors.onHero} strokeWidth={2} />
          ) : (
            <EyeOff size={18} color={colors.onHero} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      <Text
        style={[styles.heroAmount, { color: colors.onHero }]}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {format(totalBalance, { hidden: !isBalanceVisible })}
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabelRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visibilityButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 50,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
    marginTop: 10,
  },
});
