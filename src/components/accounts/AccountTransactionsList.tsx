import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
  const { format } = useCurrency();
  const { t } = useTranslation();

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  return (
    <>
      {/* HISTORIAL COMPLETO DE MOVIMIENTOS */}
      <View style={styles.historySectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('movementHistory')}</Text>
        <Text style={[styles.historyCountText, { color: colors.textLight }]}>
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'movimiento' : 'movimientos'}
        </Text>
      </View>

      {/* Filtros tipo píldora: Todos / Ingresos / Gastos */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[
            styles.filterPillBtn,
            {
              backgroundColor: filterType === 'ALL' ? colors.primary : colors.surface,
              borderColor: filterType === 'ALL' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setFilterType('ALL')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: filterType === 'ALL' ? colors.onPrimary : colors.textLight },
            ]}
          >
            Todos ({transactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPillBtn,
            {
              backgroundColor: filterType === 'INCOME' ? colors.success : colors.surface,
              borderColor: filterType === 'INCOME' ? colors.success : colors.border,
            },
          ]}
          onPress={() => setFilterType('INCOME')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: filterType === 'INCOME' ? colors.onSuccess : colors.textLight },
            ]}
          >
            Ingresos ({transactions.filter((t) => t.type === 'INCOME').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPillBtn,
            {
              backgroundColor: filterType === 'EXPENSE' ? colors.error : colors.surface,
              borderColor: filterType === 'EXPENSE' ? colors.error : colors.border,
            },
          ]}
          onPress={() => setFilterType('EXPENSE')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: filterType === 'EXPENSE' ? colors.onError : colors.textLight },
            ]}
          >
            Gastos ({transactions.filter((t) => t.type === 'EXPENSE').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Movimientos */}
      {filteredTransactions.length === 0 ? (
        <Card style={styles.emptyContainer}>
          <View style={{ marginBottom: 12 }}>
            <Receipt size={32} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyHeading, { color: colors.text }]}>{t('noMovements')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            {filterType === 'ALL'
              ? t('noAccountMovements')
              : 'No se encontraron movimientos con el filtro seleccionado.'}
          </Text>
        </Card>
      ) : (
        <View style={styles.transactionsList}>
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const dateFormatted = new Date(tx.date).toLocaleDateString('es-ES', {
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
                    {tx.description || (isIncome ? 'Ingreso' : 'Gasto')}
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
    gap: 8,
    marginBottom: 16,
  },
  filterPillBtn: {
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
});
