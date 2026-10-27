import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useColors, useInsets } from '@/components/ui/theme';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';
import { AccountsHeader } from '@/components/accounts/AccountsHeader';
import { AccountsDistributionCard } from '@/components/accounts/AccountsDistributionCard';
import { AccountGroupSection } from '@/components/accounts/AccountGroupSection';
import { AccountsEmptyState } from '@/components/accounts/AccountsEmptyState';
import { BottomFade } from '@/components/ui/BottomFade';
import { useMonthlyAccountMovementCounts } from '@/hooks/useMonthlyAccountMovementCounts';
import { buildAccountDistribution } from '@/core/services/account-distribution';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useDashboard } from '@/context/DashboardContext';

export default function AccountsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const {
    accounts,
    totalBalance,
    isLoading,
    isBalanceVisible,
    openAccountModal,
  } = useDashboard();

  const movementCounts = useMonthlyAccountMovementCounts(accounts);

  const distribution = useMemo(
    () =>
      buildAccountDistribution(accounts, {
        otherLabel: t('otherAccounts'),
        otherColor: colors.chartOther,
      }),
    [accounts, colors.chartOther, t]
  );

  const groups = useMemo(
    () =>
      [
        {
          type: 'CHECKING' as const,
          title: t('accountsGroupChecking'),
          accounts: accounts.filter((account) => account.type === 'CHECKING'),
        },
        {
          type: 'FLEXIBLE_SAVINGS' as const,
          title: t('accountsGroupFlexible'),
          accounts: accounts.filter((account) => account.type === 'FLEXIBLE_SAVINGS'),
        },
        {
          type: 'FIXED_TERM' as const,
          title: t('accountsGroupFixed'),
          accounts: accounts.filter((account) => account.type === 'FIXED_TERM'),
        },
      ].filter((group) => group.accounts.length > 0),
    [accounts, t]
  );

  const openAccountDetail = (id: string) => {
    router.push({
      pathname: '/account/[id]',
      params: { id },
    });
  };

  if (isLoading) {
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
        <AccountsHeader
          totalBalance={totalBalance}
          accountCount={accounts.length}
          isBalanceVisible={isBalanceVisible}
          onPressNewAccount={openAccountModal}
        />

        {accounts.length === 0 ? (
          <AccountsEmptyState onCreateAccount={openAccountModal} />
        ) : (
          <>
            {distribution.shouldShowBar && (
              <AccountsDistributionCard segments={distribution.segments} />
            )}

            <View style={styles.groups}>
              {groups.map((group) => (
                <AccountGroupSection
                  key={group.type}
                  title={group.title}
                  accounts={group.accounts}
                  movementCounts={movementCounts}
                  isBalanceVisible={isBalanceVisible}
                  onPressAccount={openAccountDetail}
                />
              ))}
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  groups: {
    gap: 24,
  },
});
