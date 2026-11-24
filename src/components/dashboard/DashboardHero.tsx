import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import { CountUpText } from '@/components/ui/atoms/CountUpText';
import { useColors } from '@/components/ui/theme';
import { useSplashTransition } from '@/store/splashTransitionStore';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { HomeReveal } from './HomeReveal';

let hasPlayedBalanceIntro = false;

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
  const { isSplashHidden } = useSplashTransition();
  const animateBalance = isSplashHidden && !hasPlayedBalanceIntro;
  const displayedBalance = isSplashHidden ? totalBalance : 0;

  const handleBalanceIntroStart = useCallback(() => {
    hasPlayedBalanceIntro = true;
  }, []);

  return (
    <HomeReveal distance={15} style={styles.heroContainer}>
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
          accessibilityLabel={t(isBalanceVisible ? 'hideBalance' : 'showBalance')}
        >
          {isBalanceVisible ? (
            <Eye size={18} color={colors.onHero} strokeWidth={2} />
          ) : (
            <EyeOff size={18} color={colors.onHero} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      <CountUpText
        value={displayedBalance}
        animate={animateBalance}
        formatValue={format}
        hidden={!isBalanceVisible}
        hiddenText={format(totalBalance, { hidden: true })}
        onStart={handleBalanceIntroStart}
        style={[styles.heroAmount, { color: colors.onHero }]}
        adjustsFontSizeToFit
        numberOfLines={1}
      />
    </HomeReveal>
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
