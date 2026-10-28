import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Plus, Minus, Zap, TrendingUp, Clock, Calendar } from 'lucide-react-native';
import { Account, AccountType } from '@/core/models/account';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountDetailHeroProps {
  account: Account;
  totalIn: number;
  totalOut: number;
}

export function AccountDetailHero({ account, totalIn, totalOut }: AccountDetailHeroProps) {
  const colors = useColors();
  const { format } = useCurrency();
  const { t } = useTranslation();

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'CHECKING':
        return t('checking');
      case 'FLEXIBLE_SAVINGS':
        return t('flexible');
      case 'FIXED_TERM':
        return t('fixedDeposit');
      default:
        return t('account');
    }
  };

  const isFlexible = account.type === 'FLEXIBLE_SAVINGS';
  const isFixed = account.type === 'FIXED_TERM';

  return (
    <>
      {/* HERO SECTION DE LA CUENTA */}
      <View style={styles.heroSection}>
        <View style={styles.typeBadgeRow}>
          <Text style={[styles.accountTypeSubtitle, { color: colors.textLight }]}>
            {getAccountTypeLabel(account.type)}
          </Text>

          {isFlexible && account.annualRate && (
            <View style={[styles.rateBadge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.rateBadgeText, { color: colors.primaryText }]}>
                {(account.annualRate * 100).toFixed(1)}% TNA
              </Text>
            </View>
          )}

          {isFixed && (
            <View style={[styles.rateBadge, { backgroundColor: colors.warningSoft }]}>
              <Text style={[styles.rateBadgeText, { color: colors.warningText }]}>{t('termInvestment')}</Text>
            </View>
          )}
        </View>

        {/* Saldo Masivo */}
        <Text style={[styles.heroBalanceText, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>
          {format(account.balance)}
        </Text>

        {/* Tarjeta de Resumen Rápido de Flujos */}
        <Card style={styles.flowsCard}>
          <View style={styles.flowItem}>
            <View style={[styles.flowIconDot, { backgroundColor: colors.successSoft }]}>
              <Plus size={12} color={colors.successText} strokeWidth={3} />
            </View>
            <View>
              <Text style={[styles.flowLabel, { color: colors.textLight }]}>{t('totalIncome')}</Text>
              <Text style={[styles.flowValue, { color: colors.successText }]}>
                {format(totalIn)}
              </Text>
            </View>
          </View>

          <View style={[styles.flowDivider, { backgroundColor: colors.border }]} />

          <View style={styles.flowItem}>
            <View style={[styles.flowIconDot, { backgroundColor: colors.errorSoft }]}>
              <Minus size={12} color={colors.errorText} strokeWidth={3} />
            </View>
            <View>
              <Text style={[styles.flowLabel, { color: colors.textLight }]}>{t('totalSpent')}</Text>
              <Text style={[styles.flowValue, { color: colors.errorText }]}>
                {format(totalOut)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Sección Rendimientos para Fondos Flexibles */}
      {isFlexible && account.annualRate && (
        <Card borderColor={colors.primary} borderWidth={1.5} style={styles.yieldContainer}>
          <View style={styles.yieldHeader}>
            <View style={[styles.yieldIconBox, { backgroundColor: colors.successSoft }]}>
              <Zap size={18} color={colors.successText} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.yieldTitle, { color: colors.text }]}>{t('activeDailyReturn')}</Text>
              <Text style={[styles.yieldSubtitle, { color: colors.textLight }]}>
                Generando intereses compuestos en base al saldo
              </Text>
            </View>
          </View>

          <View style={[styles.yieldStatsRow, { borderTopColor: colors.border }]}>
            <View style={styles.yieldStatCol}>
              <Text style={[styles.yieldStatLabel, { color: colors.textLight }]}>TNA {t('annual')}</Text>
              <Text style={[styles.yieldStatNumber, { color: colors.text }]}>
                {(account.annualRate * 100).toFixed(2)}%
              </Text>
            </View>

            <View style={styles.yieldStatCol}>
              <Text style={[styles.yieldStatLabel, { color: colors.textLight }]}>{t('dailyEstimated')}</Text>
              <Text style={[styles.yieldStatNumber, { color: colors.successText }]}>
                {format((account.balance * account.annualRate) / 365, { showSign: true })}
              </Text>
            </View>

            <View style={styles.yieldStatCol}>
              <Text style={[styles.yieldStatLabel, { color: colors.textLight }]}>{t('monthlyEstimated')}</Text>
              <Text style={[styles.yieldStatNumber, { color: colors.primaryText }]}>
                {format((account.balance * account.annualRate) / 12, { showSign: true })}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Sección Plazos Fijos Activos */}
      {isFixed && account.fixedTermDeposits && account.fixedTermDeposits.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Certificados de Plazo Fijo
          </Text>

          {account.fixedTermDeposits.map((dep) => (
            <Card key={dep.id} style={styles.depositCard}>
              <View style={styles.depositTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} color={colors.warningText} />
                  <Text style={[styles.depositCapital, { color: colors.text }]}>
                    {format(dep.principalAmount)}
                  </Text>
                </View>
                <View style={[styles.depositBadge, { backgroundColor: colors.warningSoft }]}>
                  <Text style={[styles.depositBadgeText, { color: colors.warningText }]}>
                    {(dep.annualRate * 100).toFixed(2)}% TNA
                  </Text>
                </View>
              </View>

              <View style={styles.depositDatesRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color={colors.textLight} />
                  <Text style={[styles.depositDateText, { color: colors.textLight }]}>
                    Inicio: {dep.startDate}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} color={colors.primaryText} />
                  <Text style={[styles.depositDateText, { color: colors.primaryText, fontWeight: '700' }]}>
                    Vence: {dep.maturityDate}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingVertical: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accountTypeSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroBalanceText: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    textAlign: 'center',
    marginBottom: 20,
  },
  flowsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  flowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flowIconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  flowValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  flowDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  yieldContainer: {
    padding: 16,
    marginBottom: 20,
  },
  yieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  yieldIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yieldTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  yieldSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  yieldStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  yieldStatCol: {
    flex: 1,
  },
  yieldStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  yieldStatNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  depositCard: {
    padding: 14,
    marginBottom: 10,
  },
  depositTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  depositCapital: {
    fontSize: 16,
    fontWeight: '800',
  },
  depositBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  depositBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  depositDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositDateText: {
    fontSize: 12,
  },
});
