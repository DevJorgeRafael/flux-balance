import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  heroGradientDark,
  heroGradientLight,
  useColors,
  useInsets,
  useThemeMode,
} from '@/components/ui/theme';
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
    isBalanceVisible,
    toggleBalanceVisibility,
    transactions,
    selectedFilterAccountId,
    selectedAccountName,
    handleSelectAccountFilter,
    handleRefresh,
    openAccountModal,
  } = useDashboard();

  const heroGradient = isDark ? heroGradientDark : heroGradientLight;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: heroGradient.colors[0] }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <LinearGradient
          colors={heroGradient.colors}
          locations={heroGradient.locations}
          start={heroGradient.start}
          end={heroGradient.end}
          dither
          style={[styles.heroZone, { paddingTop: insets.top + 12 }]}
        >
          <DashboardHero
            totalBalance={totalBalance}
            isBalanceVisible={isBalanceVisible}
            onToggleBalanceVisibility={toggleBalanceVisibility}
          />
        </LinearGradient>

        <View style={styles.sheetStack}>
          <DashboardSummaryCard
            monthlyTotals={monthlyTotals}
            isBalanceVisible={isBalanceVisible}
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.sheet,
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

      <View
        pointerEvents="none"
        style={[
          styles.statusBarOverlay,
          { height: insets.top, backgroundColor: heroGradient.colors[0] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
