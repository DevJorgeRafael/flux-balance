import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useColors, useInsets, useThemeMode } from '@/components/ui/theme';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { AccountCarousel } from '@/components/dashboard/AccountCarousel';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { useDashboard } from '@/context/DashboardContext';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { isDark } = useThemeMode();
  const {
    accounts,
    totalBalance,
    monthlyTotals,
    isLoading,
    isRefreshing,
    transactions,
    selectedFilterAccountId,
    selectedAccountName,
    handleSelectAccountFilter,
    handleRefresh,
    openAccountModal,
  } = useDashboard();

  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const heroColor = isDark ? '#0F1B3D' : '#1F4FD8';
  const sheetColor = isDark ? '#1C2230' : '#E6E9EF';

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: heroColor, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.heroZone, { backgroundColor: heroColor }]}>
          <DashboardHero
            totalBalance={totalBalance}
            isBalanceVisible={isBalanceVisible}
            onToggleBalanceVisibility={() => setIsBalanceVisible((visible) => !visible)}
          />
        </View>

        <View style={styles.sheetStack}>
          <DashboardSummaryCard
            monthlyTotals={monthlyTotals}
            isBalanceVisible={isBalanceVisible}
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: sheetColor,
                paddingBottom: insets.bottom + TAB_BAR_CONTENT_OFFSET + TAB_BAR_CONTENT_GAP,
              },
            ]}
          >
            <AccountCarousel
              accounts={accounts}
              totalBalance={totalBalance}
              selectedFilterAccountId={selectedFilterAccountId}
              onSelectAccountFilter={handleSelectAccountFilter}
              onOpenCreateAccountModal={openAccountModal}
              showNewAccount={false}
            />

            <RecentTransactionsList
              transactions={accounts.length === 0 ? [] : transactions}
              selectedFilterAccountId={selectedFilterAccountId}
              selectedAccountName={selectedAccountName}
              defaultAccountId={accounts[0]?.id}
            />
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  heroZone: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 80,
  },
  sheetStack: {
    flexGrow: 1,
    marginTop: -72,
  },
  sheet: {
    position: 'relative',
    zIndex: 1,
    flexGrow: 1,
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 64,
  },
});
