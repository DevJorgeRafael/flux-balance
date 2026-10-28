import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountsHeaderProps {
  totalBalance: number;
  accountCount: number;
  isBalanceVisible: boolean;
  onPressNewAccount: () => void;
}

export function AccountsHeader({
  totalBalance,
  accountCount,
  isBalanceVisible,
  onPressNewAccount,
}: AccountsHeaderProps) {
  const colors = useColors();
  const { format } = useCurrency();
  const { t } = useTranslation();

  const accountCountLabel =
    accountCount === 1
      ? t('accountCountOne')
      : t('accountCountMany', { count: accountCount });

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>{t('accountsTab')}</Text>

        <Pressable
          onPress={onPressNewAccount}
          accessibilityRole="button"
          accessibilityLabel={t('newAccount')}
          style={({ pressed }) => [
            styles.newAccountChip,
            { backgroundColor: colors.cardRaised },
            pressed && styles.pressed,
          ]}
        >
          <Plus size={15} color={colors.primaryText} strokeWidth={2.6} />
          <Text style={[styles.newAccountChipText, { color: colors.primaryText }]}>
            {t('newAccount')}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.balanceLabel, { color: colors.textLight }]}>
        {t('consolidatedBalance')}
      </Text>
      <Text
        style={[styles.total, { color: colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {format(totalBalance, { hidden: !isBalanceVisible })}
      </Text>
      <Text style={[styles.accountCount, { color: colors.textLight }]}>
        {accountCountLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  newAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  newAccountChipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 18,
  },
  total: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 3,
  },
  accountCount: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 7,
  },
  pressed: {
    opacity: 0.75,
  },
});
