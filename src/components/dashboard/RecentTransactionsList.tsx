import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import Plus from 'lucide-react-native/icons/plus';
import Minus from 'lucide-react-native/icons/minus';
import Animated, { Keyframe } from 'react-native-reanimated';
import { appAlert } from '@/components/ui/alert/appAlert';
import { Transaction } from '@/core/models/transaction';
import { spacing, useColors, useThemeMode } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import {
  RECENT_TRANSACTIONS_EXPANDED_LIMIT,
  RECENT_TRANSACTIONS_FALLBACK_LIMIT,
  selectRecentTransactions,
  selectVisibleRecentTransactions,
} from '@/core/services/recent-transactions';
import { parseLedgerDate } from '@/core/utils/ledger-date';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  isBalanceVisible: boolean;
  selectedFilterAccountId: string | null;
  selectedAccountName?: string;
  defaultAccountId?: string;
}

export function RecentTransactionsList({
  transactions,
  isBalanceVisible,
  selectedFilterAccountId,
  selectedAccountName,
  defaultAccountId,
}: RecentTransactionsListProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { format, locale } = useCurrency();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { transactions: scopedTransactions, isFallback } =
    selectRecentTransactions(transactions);
  const { transactions: visibleTransactions, hiddenCount } =
    selectVisibleRecentTransactions(scopedTransactions, {
      expanded: isExpanded,
    });
  const nextBatchCount = Math.min(hiddenCount, RECENT_TRANSACTIONS_EXPANDED_LIMIT);

  const headerButtonStyle = (pressed: boolean) => [
    styles.seeMoreBtn,
    { backgroundColor: colors.cardRaised, borderColor: colors.border },
    pressed && styles.pressed,
  ];

  const handleOpenHistory = () => {
    const targetId = selectedFilterAccountId || defaultAccountId;
    if (targetId) {
      router.push({
        pathname: '/account/[id]',
        params: { id: targetId },
      });
    } else {
      void appAlert({
        type: 'info',
        title: t('noAccountsHistoryTitle'),
        message: t('noAccountsHistoryMessage'),
        buttons: [{ text: t('accept') }],
      });
    }
  };

  return (
    <>
      {/* Sección Últimos Movimientos con expansión o acceso al historial */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('latestMovements')}</Text>
          {selectedAccountName && (
            <Text style={[styles.sectionSubfilter, { color: colors.primaryText }]}>
              {t('filteredBy', { name: selectedAccountName })}
            </Text>
          )}
          {isFallback ? (
            <Text style={[styles.sectionFallback, { color: colors.textLight }]}>
              {t('latestMovementsFallback', {
                count: RECENT_TRANSACTIONS_FALLBACK_LIMIT,
              })}
            </Text>
          ) : null}

          {selectedFilterAccountId || defaultAccountId ? (
            <Pressable
              onPress={handleOpenHistory}
              accessibilityRole="link"
              accessibilityLabel={t('seeAccountHistory')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [styles.historyLink, pressed && styles.pressed]}
            >
              <Text style={[styles.historyLinkText, { color: colors.primaryText }]}>
                {t('seeAccountHistory')}
              </Text>
              <ChevronRight size={13} color={colors.primaryText} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>

        {hiddenCount > 0 ? (
          <Pressable
            style={({ pressed }) => headerButtonStyle(pressed)}
            onPress={() => setIsExpanded((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={
              isExpanded ? t('seeLess') : t('seeMoreCount', { count: nextBatchCount })
            }
            accessibilityState={{ expanded: isExpanded }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.seeMoreText, { color: colors.text }]}>
              {isExpanded ? t('seeLess') : t('seeMoreCount', { count: nextBatchCount })}
            </Text>
            {isExpanded ? (
              <ChevronUp size={14} color={colors.textLight} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={14} color={colors.textLight} strokeWidth={2.5} />
            )}
          </Pressable>
        ) : null}
      </View>

      {visibleTransactions.length === 0 ? (
        <Card style={styles.emptyContainer}>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            {selectedFilterAccountId ? t('noAccountMovements') : t('noMovementsPeriod')}
          </Text>
        </Card>
      ) : (
        <Card>
          {visibleTransactions.map((tx, idx) => {
            const isIncome = tx.type === 'INCOME';
            const transactionDate = parseLedgerDate(tx.date) ?? new Date(tx.date);
            const dateFormatted = transactionDate.toLocaleDateString(locale, {
              day: 'numeric',
              month: 'short',
            });

            return (
              <Animated.View
                key={tx.id}
                entering={new Keyframe({
                  from: { opacity: 0, transform: [{ translateY: 10 }] },
                  to: { opacity: 1, transform: [{ translateY: 0 }] },
                })
                  .duration(350)
                  .delay(Math.min(idx, 8) * 40)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.transactionItemRow,
                    isDark && styles.transactionItemRowDark,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    router.push({
                      pathname: '/transaction/[id]',
                      params: { id: tx.id },
                    });
                  }}
                  accessibilityRole="button"
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
                      hidden: !isBalanceVisible,
                    })}
                  </Text>
                </Pressable>
              </Animated.View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitleBlock: {
    flex: 1,
    marginRight: spacing.sm,
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
  sectionFallback: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: 4,
  },
  historyLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
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
  transactionItemRow: {
    flexDirection: 'row',
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
  pressed: {
    opacity: 0.85,
  },
});
