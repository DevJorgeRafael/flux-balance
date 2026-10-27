import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Zap, Calendar } from 'lucide-react-native';
import { Account, AccountType } from '@/core/models/account';
import { useColors, useThemeMode } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onPress: () => void;
}

export function AccountCard({ account, isSelected, onPress }: AccountCardProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'CHECKING':
        return t('account');
      case 'FLEXIBLE_SAVINGS':
        return t('flexible');
      case 'FIXED_TERM':
        return t('fixedTerm');
      default:
        return t('account');
    }
  };
  const isFlexible = account.type === 'FLEXIBLE_SAVINGS';
  const isFixed = account.type === 'FIXED_TERM';

  return (
    <TouchableOpacity
      style={[
        styles.modernAccountCard,
        {
          backgroundColor: isSelected ? colors.cardRaised : colors.surface,
          borderColor: isSelected ? colors.cardRaised : colors.border,
          borderWidth: 1,
          shadowColor: colors.shadow,
          shadowOpacity: isSelected ? (isDark ? 0.35 : 0.16) : isDark ? 0.2 : 0.08,
          shadowRadius: isSelected ? 14 : 8,
          elevation: isSelected ? 6 : 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.accountCardHeader}>
        <Text style={[styles.accountTypeHeader, { color: colors.textLight }]}>
          {getAccountTypeLabel(account.type)}
        </Text>

        {isSelected ? (
          <View style={[styles.tnaBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.tnaBadgeText, { color: colors.primaryText }]}>{t('active')}</Text>
          </View>
        ) : isFlexible && account.annualRate ? (
          <View style={[styles.tnaBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.tnaBadgeText, { color: colors.primaryText }]}>
              {(account.annualRate * 100).toFixed(1)}% TNA
            </Text>
          </View>
        ) : isFixed ? (
          <View style={[styles.fixedBadge, { backgroundColor: colors.warningSoft }]}>
            <Text style={[styles.fixedBadgeText, { color: colors.warningText }]}>{t('fixedTerm')}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.accountCardTitle, { color: colors.text }]} numberOfLines={1}>
        {account.name}
      </Text>

      <Text
        style={[
          styles.accountCardBalance,
          { color: isSelected ? colors.primaryText : colors.text },
        ]}
      >
        {format(account.balance)}
      </Text>

      {isFlexible && (
        <View
          style={[
            styles.yieldHighlightBadge,
            { backgroundColor: colors.successSoft, borderColor: colors.successText },
          ]}
        >
          <Zap size={13} color={colors.successText} strokeWidth={2.5} />
          <Text style={[styles.yieldHighlightText, { color: colors.successText }]}>
            {t('activeDailyYield')}
          </Text>
        </View>
      )}

      {isFixed && account.fixedTermDeposits && account.fixedTermDeposits.length > 0 && (
        <View
          style={[
            styles.fixedDateBadge,
            { backgroundColor: colors.cardRaised, borderColor: colors.border },
          ]}
        >
          <Calendar size={12} color={colors.textLight} strokeWidth={2} />
          <Text style={[styles.fixedDateText, { color: colors.textLight }]}>
            {t('due')}: {account.fixedTermDeposits[0].maturityDate}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modernAccountCard: {
    width: 220,
    borderRadius: 28,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountTypeHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tnaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tnaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fixedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  accountCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  accountCardBalance: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  yieldHighlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  yieldHighlightText: {
    fontSize: 11,
    fontWeight: '800',
  },
  fixedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  fixedDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
