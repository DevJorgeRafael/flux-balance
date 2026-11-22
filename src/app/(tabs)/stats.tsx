import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { isHexColor, useColors, useInsets } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';
import { buildMonthlyStats, type StatsTransactionType } from '@/core/services/stats-breakdown';
import { buildDailyStats, getMonthDayCount } from '@/core/services/stats-daily';
import { buildBalanceStats } from '@/core/services/stats-balance';
import { StatsMonthSelector } from '@/components/stats/StatsMonthSelector';
import { StatsTypeSelector } from '@/components/stats/StatsTypeSelector';
import { StatsViewSelector, type StatsView } from '@/components/stats/StatsViewSelector';
import { StatsAccountSelector } from '@/components/stats/StatsAccountSelector';
import { CategoryDonut, type CategoryDonutSlice } from '@/components/stats/CategoryDonut';
import { CategoryBreakdownList } from '@/components/stats/CategoryBreakdownList';
import { DailyTrendChart } from '@/components/stats/DailyTrendChart';
import { DailyTrendSummary } from '@/components/stats/DailyTrendSummary';
import { BalanceEvolutionChart } from '@/components/stats/BalanceEvolutionChart';
import { BalanceEvolutionSummary } from '@/components/stats/BalanceEvolutionSummary';
import { StatsEmptyState } from '@/components/stats/StatsEmptyState';
import { AccountsEmptyState } from '@/components/accounts/AccountsEmptyState';
import { BottomFade } from '@/components/ui/BottomFade';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';

const transactionRepo = new SqliteTransactionRepository();

function getCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatMonthLabel(date: Date, language: 'es' | 'en') {
  const label = new Intl.DateTimeFormat(language === 'es' ? 'es-AR' : 'en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1).replace(/\.$/, '');
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t, language } = useTranslation();
  const {
    accounts,
    categories,
    isLoading,
    openAccountModal,
    transactions: dashboardTransactions,
  } = useDashboard();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [selectedType, setSelectedType] = useState<StatsTransactionType>('EXPENSE');
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<StatsView>('categories');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof transactionRepo.getAll>>>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const hasLoadedTransactions = useRef(false);
  const requestId = useRef(0);
  const previousDashboardTransactions = useRef(dashboardTransactions);

  const loadTransactions = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    if (!hasLoadedTransactions.current) {
      setIsTransactionsLoading(true);
    }

    try {
      const allTransactions = await transactionRepo.getAll();
      if (requestId.current === currentRequest) {
        setTransactions(allTransactions);
        setSelectedSliceId(null);
        setSelectedDay(null);
      }
    } catch (error) {
      console.error('Error loading stats transactions:', error);
    } finally {
      if (requestId.current === currentRequest) {
        hasLoadedTransactions.current = true;
        setIsTransactionsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTransactions();
      return () => {
        requestId.current += 1;
      };
    }, [loadTransactions])
  );

  useEffect(() => {
    if (previousDashboardTransactions.current === dashboardTransactions) return;

    previousDashboardTransactions.current = dashboardTransactions;
    void loadTransactions();
  }, [dashboardTransactions, loadTransactions]);

  const monthlyStats = useMemo(
    () =>
      buildMonthlyStats({
        transactions,
        categories,
        year: selectedMonth.getFullYear(),
        monthIndex: selectedMonth.getMonth(),
        labels: {
          uncategorized: t('uncategorized'),
          other: t('otherCategories'),
        },
      }),
    [categories, selectedMonth, t, transactions]
  );

  const activeBreakdown = selectedType === 'INCOME' ? monthlyStats.income : monthlyStats.expense;

  const donutSlices = useMemo<CategoryDonutSlice[]>(
    () =>
      activeBreakdown.slices.map((slice) => ({
        ...slice,
        color:
          slice.kind === 'category' && isHexColor(slice.color)
            ? slice.color
            : colors.chartOther,
      })),
    [activeBreakdown.slices, colors.chartOther]
  );

  const activeSelectedSliceId =
    selectedSliceId && activeBreakdown.slices.some((slice) => slice.id === selectedSliceId)
      ? selectedSliceId
      : null;

  const monthLabel = useMemo(
    () => formatMonthLabel(selectedMonth, language),
    [language, selectedMonth]
  );

  const currentMonth = getCurrentMonth();
  const isCurrentMonth =
    selectedMonth.getFullYear() === currentMonth.getFullYear() &&
    selectedMonth.getMonth() === currentMonth.getMonth();

  const trendEndDay = isCurrentMonth
    ? new Date().getDate()
    : getMonthDayCount(selectedMonth.getFullYear(), selectedMonth.getMonth());

  const dailyStats = useMemo(
    () =>
      buildDailyStats({
        transactions,
        type: selectedType,
        year: selectedMonth.getFullYear(),
        monthIndex: selectedMonth.getMonth(),
        endDay: trendEndDay,
      }),
    [selectedMonth, selectedType, transactions, trendEndDay]
  );

  const activeSelectedAccountId =
    selectedAccountId && accounts.some((account) => account.id === selectedAccountId)
      ? selectedAccountId
      : null;

  const balanceStats = useMemo(
    () =>
      buildBalanceStats({
        accounts,
        transactions,
        year: selectedMonth.getFullYear(),
        monthIndex: selectedMonth.getMonth(),
        endDay: trendEndDay,
        accountId: activeSelectedAccountId,
      }),
    [accounts, activeSelectedAccountId, selectedMonth, transactions, trendEndDay]
  );

  const handlePreviousMonth = () => {
    setSelectedMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
    );
    setSelectedSliceId(null);
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;

    setSelectedMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)
    );
    setSelectedSliceId(null);
    setSelectedDay(null);
  };

  const handleTypeChange = (type: StatsTransactionType) => {
    setSelectedType(type);
    setSelectedSliceId(null);
    setSelectedDay(null);
  };

  const handleViewChange = (view: StatsView) => {
    setActiveView(view);
    setSelectedSliceId(null);
    setSelectedDay(null);
  };

  const handleSelectSlice = (id: string) => {
    setSelectedSliceId((current) => (current === id ? null : id));
  };

  const handleAccountChange = (accountId: string | null) => {
    setSelectedAccountId(accountId);
    setSelectedDay(null);
  };

  if (isLoading || isTransactionsLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_CONTENT_OFFSET + TAB_BAR_CONTENT_GAP },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StatsMonthSelector
          monthLabel={monthLabel}
          previousLabel={t('previousMonth')}
          nextLabel={t('nextMonth')}
          nextDisabled={isCurrentMonth}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
        />

        <StatsViewSelector value={activeView} onChange={handleViewChange} />

        {activeView !== 'balance' ? (
          <StatsTypeSelector
            selectedType={selectedType}
            incomeTotal={monthlyStats.income.total}
            expenseTotal={monthlyStats.expense.total}
            onChange={handleTypeChange}
          />
        ) : null}

        {activeView === 'balance' ? (
          accounts.length === 0 ? (
            <AccountsEmptyState onCreateAccount={openAccountModal} />
          ) : (
            <>
              <Card style={styles.chartCard}>
                <StatsAccountSelector
                  accounts={accounts}
                  selectedAccountId={activeSelectedAccountId}
                  onChange={handleAccountChange}
                />
                <BalanceEvolutionChart
                  points={balanceStats.points}
                  month={selectedMonth}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              </Card>
              <BalanceEvolutionSummary stats={balanceStats} />
            </>
          )
        ) : activeBreakdown.slices.length === 0 ? (
          <StatsEmptyState type={selectedType} />
        ) : (
          <>
            <Card style={styles.chartCard}>
              {activeView === 'categories' ? (
                <View style={styles.donutWrap}>
                  <CategoryDonut
                    slices={donutSlices}
                    total={activeBreakdown.total}
                    selectedId={activeSelectedSliceId}
                  />
                </View>
              ) : (
                <DailyTrendChart
                  points={dailyStats.points}
                  type={selectedType}
                  month={selectedMonth}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              )}
            </Card>

            {activeView === 'categories' ? (
              <CategoryBreakdownList
                items={donutSlices}
                selectedId={activeSelectedSliceId}
                onSelect={handleSelectSlice}
              />
            ) : (
              <DailyTrendSummary
                stats={dailyStats}
                type={selectedType}
                month={selectedMonth}
              />
            )}
          </>
        )}
      </ScrollView>

      <BottomFade />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  chartCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  donutWrap: {
    alignItems: 'center',
  },
});
