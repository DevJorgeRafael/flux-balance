import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import ListFilter from 'lucide-react-native/icons/list-filter';
import Receipt from 'lucide-react-native/icons/receipt';
import Plus from 'lucide-react-native/icons/plus';
import Minus from 'lucide-react-native/icons/minus';
import X from 'lucide-react-native/icons/x';
import { Transaction } from '@/core/models/transaction';
import { spacing, useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { DateRangeFilterSheet } from '@/components/accounts/DateRangeFilterSheet';
import type { DateRange } from '@/components/ui/organisms/DatePicker';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  filterTransactionsByDateRange,
  formatDateRangeLabel,
} from '@/core/services/transaction-date-filter';

interface AccountTransactionsListProps {
  transactions: Transaction[];
}

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

const PAGE_SIZE = 20;

export function AccountTransactionsList({ transactions }: AccountTransactionsListProps) {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isDateSheetVisible, setIsDateSheetVisible] = useState(false);
  const [dateSheetKey, setDateSheetKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const colors = useColors();
  const { format, locale } = useCurrency();
  const { t } = useTranslation();

  const dateFilteredTransactions = useMemo(
    () => filterTransactionsByDateRange(transactions, dateRange),
    [transactions, dateRange]
  );
  const filteredTransactions = dateFilteredTransactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });
  const incomeCount = dateFilteredTransactions.filter((tx) => tx.type === 'INCOME').length;
  const expenseCount = dateFilteredTransactions.filter((tx) => tx.type === 'EXPENSE').length;
  const dateLabel = formatDateRangeLabel(dateRange, locale);
  const filterKey = `${filterType}|${dateRange?.start.getTime() ?? ''}|${dateRange?.end?.getTime() ?? ''}|${transactions.length}`;
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);

  if (filterKey !== previousFilterKey) {
    setPreviousFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const pagedTransactions = filteredTransactions.slice(0, visibleCount);
  const filters: { type: FilterType; label: string; count: number }[] = [
    { type: 'ALL', label: t('allMovements'), count: dateFilteredTransactions.length },
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

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.filterPillsScroll}
        contentContainerStyle={styles.filterPillsRow}
      >
        {filters.map(({ type, label, count }) => {
          const selected = filterType === type;
          const accent =
            type === 'ALL'
              ? colors.primaryText
              : type === 'INCOME'
                ? colors.successText
                : colors.errorText;
          const softAccent =
            type === 'ALL'
              ? colors.primarySoft
              : type === 'INCOME'
                ? colors.successSoft
                : colors.errorSoft;
          const text = `${label} (${count})`;

          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.filterPillBtn,
                {
                  backgroundColor: selected ? softAccent : colors.surface,
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
                  { color: selected ? accent : colors.textLight },
                ]}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={({ pressed }) => [
            styles.filterPillBtn,
            styles.filterPillWithIcon,
            {
              backgroundColor: dateRange ? colors.primarySoft : colors.surface,
              borderColor: dateRange ? colors.primaryText : colors.border,
            },
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setDateSheetKey((current) => current + 1);
            setIsDateSheetVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('filterByDate')}
          hitSlop={2}
        >
          <ListFilter
            size={15}
            color={dateRange ? colors.primaryText : colors.textLight}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.filterPillText,
              { color: dateRange ? colors.primaryText : colors.textLight },
            ]}
            numberOfLines={1}
          >
            {dateLabel ?? t('filterByDate')}
          </Text>
        </Pressable>

        {dateRange ? (
          <Pressable
            style={({ pressed }) => [
              styles.dateClearButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => setDateRange(null)}
            accessibilityRole="button"
            accessibilityLabel={t('clearDateFilter')}
            hitSlop={2}
          >
            <X size={15} color={colors.textLight} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Lista de Movimientos */}
      {filteredTransactions.length === 0 ? (
        <Card style={styles.emptyContainer}>
          <View style={{ marginBottom: 12 }}>
            <Receipt size={32} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyHeading, { color: colors.text }]}>{t('noMovements')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            {dateRange
              ? t('noDateRangeMovements')
              : filterType === 'ALL'
                ? t('noAccountMovements')
                : t('noFilteredMovements')}
          </Text>
        </Card>
      ) : (
        <View style={styles.transactionsList}>
          {pagedTransactions.map((tx) => {
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

      {filteredTransactions.length > visibleCount ? (
        <Pressable
          onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
          accessibilityRole="button"
          accessibilityLabel={t('moreMovements')}
          style={({ pressed }) => [
            styles.moreButton,
            { backgroundColor: colors.primarySoft },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.moreButtonText, { color: colors.primaryText }]}>
            {t('moreMovements')}
          </Text>
        </Pressable>
      ) : null}

      <DateRangeFilterSheet
        key={dateSheetKey}
        visible={isDateSheetVisible}
        range={dateRange}
        onClose={() => setIsDateSheetVisible(false)}
        onApply={(range) => {
          setDateRange(range);
          setIsDateSheetVisible(false);
        }}
      />
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
  dateClearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 24,
  },
  filterPillBtn: {
    minHeight: 44,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  moreButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginTop: spacing.md,
  },
  moreButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
