import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Receipt, Plus, Minus } from 'lucide-react-native';
import { Transaction } from '@/core/models/transaction';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountTransactionsListProps {
  transactions: Transaction[];
}

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

export function AccountTransactionsList({ transactions }: AccountTransactionsListProps) {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const colors = useColors();
  const { format, locale } = useCurrency();
  const { t } = useTranslation();

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });
  const incomeCount = transactions.filter((tx) => tx.type === 'INCOME').length;
  const expenseCount = transactions.filter((tx) => tx.type === 'EXPENSE').length;
  const filters: { type: FilterType; label: string; count: number }[] = [
    { type: 'ALL', label: t('allMovements'), count: transactions.length },
    { type: 'INCOME', label: t('income'), count: incomeCount },
    { type: 'EXPENSE', label: t('expense'), count: expenseCount },
  ];

  return (
    <>
      {/* HISTORIAL COMPLETO DE MOVIMIENTOS */}
      <View style={styles.historySectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('movementHistory')}</Text>
        <Text style={[styles.historyCountText, { color: colors.textLight }]}>
          {t(
            filteredTransactions.length === 1 ? 'movementCountOne' : 'movementCountMany',
            { count: filteredTransactions.length }
          )}
        </Text>
      </View>

      <View style={styles.filterPillsRow}>
        {filters.map(({ type, label, count }) => {
          const selected = filterType === type;
          const accent =
            type === 'ALL'
              ? colors.primary
              : type === 'INCOME'
                ? colors.success
                : colors.error;
          const activeText =
            type === 'ALL'
              ? colors.onPrimary
              : type === 'INCOME'
                ? colors.onSuccess
                : colors.onError;
          const text = `${label} (${count})`;

          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.filterPillBtn,
                {
                  backgroundColor: selected ? accent : colors.surface,
                  borderColor: selected ? accent : colors.border,
                },
                pressed && styles.pressed,
              ]}
              onPress={() => setFilterType(type)}
              accessibilityRole="button"
              accessibilityLabel={text}
              accessibilityState={{ selected }}
              hitSlop={2}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: selected ? activeText : colors.textLight },
                ]}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lista de Movimientos */}
      {filteredTransactions.length === 0 ? (
        <Card style={styles.emptyContainer}>
          <View style={{ marginBottom: 12 }}>
            <Receipt size={32} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyHeading, { color: colors.text }]}>{t('noMovements')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            {filterType === 'ALL' ? t('noAccountMovements') : t('noFilteredMovements')}
          </Text>
        </Card>
      ) : (
        <View style={styles.transactionsList}>
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const dateFormatted = new Date(tx.date).toLocaleDateString(locale, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <Card
                key={tx.id}
                style={styles.transactionItemRow}
                onPress={() => {
                  router.push({
                    pathname: '/transaction/[id]',
                    params: { id: tx.id },
                  });
                }}
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
                    {tx.description || t(isIncome ? 'addIncome' : 'addExpense')}
                  </Text>
                  <Text style={[styles.transactionMeta, { color: colors.textLight }]}>
                    {dateFormatted}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.transactionValue,
                    { color: isIncome ? colors.successText : colors.text },
                  ]}
                >
                  {format(isIncome ? tx.totalAmount : -tx.totalAmount, { showSign: isIncome })}
                </Text>
              </Card>
            );
          })}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterPillBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  transactionsList: {
    gap: 10,
  },
  transactionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
