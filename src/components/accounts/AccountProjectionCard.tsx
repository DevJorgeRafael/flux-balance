import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calculator, TrendingUp } from 'lucide-react-native';
import { Account } from '@/core/models/account';
import {
  calculateDailyProjection,
  calculateFixedTermMaturity,
  calculateMonthlyGain,
} from '@/core/services/interest-calculator';
import { useCurrency } from '@/core/currency/useCurrency';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountProjectionCardProps {
  account: Account;
}

export function AccountProjectionCard({ account }: AccountProjectionCardProps) {
  const colors = useColors();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const isFlexible = account.type === 'FLEXIBLE_SAVINGS';
  const isFixed = account.type === 'FIXED_TERM';

  if (!isFlexible && !isFixed) return null;

  const deposits = account.fixedTermDeposits ?? [];
  const fixedRate = deposits[0]?.annualRate;
  const flexibleRate = account.annualRate ?? 0;
  const rate = isFixed ? (fixedRate ?? 0) * 100 : flexibleRate * 100;

  const monthlyGain = isFixed
    ? deposits.reduce(
        (total, deposit) => total + calculateMonthlyGain(deposit.principalAmount, deposit.annualRate * 100),
        0
      )
    : calculateMonthlyGain(account.balance, rate);

  const fixedMaturity = isFixed
    ? deposits.reduce(
        (total, deposit) =>
          total + calculateFixedTermMaturity(deposit.principalAmount, deposit.annualRate * 100, deposit.termMonths),
        0
      )
    : null;
  const flexibleProjection = isFlexible ? calculateDailyProjection(account.balance, rate, 365) : [];
  const flexibleYearEnd = flexibleProjection.at(-1)?.balance ?? account.balance;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: isFixed ? colors.warningSoft : colors.successSoft }]}>
          {isFixed ? (
            <Calculator size={18} color={colors.warningText} strokeWidth={2.5} />
          ) : (
            <TrendingUp size={18} color={colors.successText} strokeWidth={2.5} />
          )}
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>{t('projection')}</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            {t('projectionDisclaimer')}
          </Text>
        </View>
      </View>

      <View style={[styles.rateRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textLight }]}>Tasa aplicada</Text>
        <Text style={[styles.rate, { color: isFixed ? colors.warningText : colors.successText }]}>
          {rate.toFixed(2)}% TNA
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={[styles.label, { color: colors.textLight }]}>{t('monthlyGeneration')}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{format(monthlyGain)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.label, { color: colors.textLight }]}>
            {isFixed ? t('maturityAmount') : t('estimatedYearAmount')}
          </Text>
          <Text style={[styles.value, { color: colors.primaryText }]}>
            {format(fixedMaturity ?? flexibleYearEnd)}
          </Text>
        </View>
      </View>

      <Text style={[styles.note, { color: colors.textLight }]}>
        {isFixed
          ? t('simpleInterestCapital')
          : `${t('accumulatedReturn')} ${format(
              flexibleYearEnd - account.balance
            )}.`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  rate: {
    fontSize: 14,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  note: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
  },
});
