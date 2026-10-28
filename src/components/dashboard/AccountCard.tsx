import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Zap, Calendar } from 'lucide-react-native';
import { Account, AccountType } from '@/core/models/account';
import { spacing, useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onPress: () => void;
}

/** Alto común de todas las cards del carrusel de cuentas. */
export const ACCOUNT_CARD_HEIGHT = 144;

export function AccountCard({ account, isSelected, onPress }: AccountCardProps) {
  const colors = useColors();
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
      style={styles.cardPressable}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Card
        variant={isSelected ? 'raised' : 'default'}
        shadowSize="sm"
        style={styles.card}
      >
        <View style={styles.accountCardHeader}>
          <Text
            style={[styles.accountTypeHeader, { color: colors.textLight }]}
            numberOfLines={1}
          >
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
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
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
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    width: 220,
  },
  card: {
    width: 220,
    minHeight: ACCOUNT_CARD_HEIGHT,
    padding: spacing.lg,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  accountTypeHeader: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tnaBadge: {
    flexShrink: 0,
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
    marginBottom: spacing.xs,
  },
  accountCardBalance: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
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
