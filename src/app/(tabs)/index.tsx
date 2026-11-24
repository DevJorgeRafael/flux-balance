import React from 'react';
import {
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
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
import { UpcomingRemindersCard } from '@/components/reminders/UpcomingRemindersCard';
import { AnticipationCard } from '@/components/anticipation/AnticipationCard';
import { GoalProgressCard } from '@/components/goals/GoalProgressCard';
import { HomeReveal } from '@/components/dashboard/HomeReveal';
import { BottomFade } from '@/components/ui/BottomFade';
import { useDashboard } from '@/context/DashboardContext';
import { useHomeCards } from '@/store/homeCardsStore';
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
  const { visibility } = useHomeCards();
  const insightsKey = [
    visibility.upcomingReminders ? 'r' : '',
    visibility.anticipations ? 'a' : '',
    visibility.goals ? 'g' : '',
  ].join('');

  const heroGradient = isDark ? heroGradientDark : heroGradientLight;
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const statusBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 100], [1, 0], Extrapolation.CLAMP),
  }));

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
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
          <HomeReveal delay={80} style={styles.summaryReveal}>
            <DashboardSummaryCard
              monthlyTotals={monthlyTotals}
              isBalanceVisible={isBalanceVisible}
            />
          </HomeReveal>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.sheet,
                paddingBottom: insets.bottom + TAB_BAR_CONTENT_OFFSET + TAB_BAR_CONTENT_GAP,
              },
            ]}
          >
            <HomeReveal delay={140}>
              <AccountCarousel
                accounts={accounts}
                totalBalance={totalBalance}
                isBalanceVisible={isBalanceVisible}
                selectedFilterAccountId={selectedFilterAccountId}
                onSelectAccountFilter={handleSelectAccountFilter}
                onOpenCreateAccountModal={openAccountModal}
                showNewAccount={false}
              />

              <RecentTransactionsList
                transactions={accounts.length === 0 ? [] : transactions}
                isBalanceVisible={isBalanceVisible}
                selectedFilterAccountId={selectedFilterAccountId}
                selectedAccountName={selectedAccountName}
                defaultAccountId={accounts[0]?.id}
              />

              <View key={insightsKey}>
                <UpcomingRemindersCard />
                <AnticipationCard />
                <GoalProgressCard />
              </View>
            </HomeReveal>
          </View>
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.statusBarOverlay,
          { height: insets.top, backgroundColor: heroGradient.colors[0] },
          statusBarStyle,
        ]}
      />

      <BottomFade color={colors.sheet} />
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
  summaryReveal: {
    position: 'relative',
    zIndex: 2,
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
