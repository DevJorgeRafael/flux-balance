import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Plus, Minus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Transaction } from '@/core/models/transaction';
import { spacing, useColors, useThemeMode } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  selectedFilterAccountId: string | null;
  selectedAccountName?: string;
  defaultAccountId?: string;
}

export function RecentTransactionsList({
  transactions,
  selectedFilterAccountId,
  selectedAccountName,
  defaultAccountId,
}: RecentTransactionsListProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { format } = useCurrency();
  const { t } = useTranslation();

  const handleSeeMore = () => {
    const targetId = selectedFilterAccountId || defaultAccountId;
    if (targetId) {
      router.push({
        pathname: '/account/[id]',
        params: { id: targetId },
      });
    } else {
      Alert.alert('Sin cuentas', 'Crea una cuenta para ver su historial detallado.');
    }
  };

  return (
    <>
      {/* Sección Últimos Movimientos con botón 'Ver más →' */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('latestMovements')}</Text>
          {selectedAccountName && (
            <Text style={[styles.sectionSubfilter, { color: colors.primaryText }]}>
              Filtrado por: {selectedAccountName}
            </Text>
          )}
        </View>

        {/* Botón Ver más */}
        <TouchableOpacity
          style={[styles.seeMoreBtn, { backgroundColor: colors.cardRaised, borderColor: colors.border }]}
          onPress={handleSeeMore}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.seeMoreText, { color: colors.text }]}>{t('seeMore')}</Text>
          <ChevronRight size={14} color={colors.textLight} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <Card style={styles.emptyContainer}>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            {selectedFilterAccountId
              ? 'Esta cuenta no tiene movimientos registrados.'
              : t('noMovementsPeriod')}
          </Text>
        </Card>
      ) : (
        <Card>
          {transactions.map((tx, idx) => {
            const isIncome = tx.type === 'INCOME';
            const dateFormatted = new Date(tx.date).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <MotiView
                key={tx.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 350, delay: idx * 50 } as any}
              >
                <TouchableOpacity
                  style={[styles.transactionItemRow, isDark && styles.transactionItemRowDark]}
                  onPress={() => {
                    router.push({
                      pathname: '/transaction/[id]',
                      params: { id: tx.id },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.transactionIconContainer,
                      { backgroundColor: isIncome ? colors.successSoft : colors.errorSoft },
                    ]}
                  >
                    {isIncome ? (
                      <Plus size={16} color={colors.successText} strokeWidth={2.5} />
                    ) : (
                      <Minus size={16} color={colors.errorText} strokeWidth={2.5} />
                    )}
                  </View>

                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>
                      {tx.description || (isIncome ? t('income') : t('expense'))}
                    </Text>
                    <Text style={[styles.transactionMeta, { color: colors.textLight }]}>
                      {tx.splits?.[0]?.accountName ?? t('account')} • {dateFormatted}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.transactionValue,
                      { color: isIncome ? colors.successText : colors.text },
                    ]}
                  >
                    {format(isIncome ? tx.totalAmount : -tx.totalAmount, {
                      showSign: isIncome,
                      showCurrency: false,
                    })}
                  </Text>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubfilter: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 28,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  transactionItemRow: {    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  transactionItemRowDark: {
    minHeight: 72,
    paddingVertical: 18,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  transactionMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
