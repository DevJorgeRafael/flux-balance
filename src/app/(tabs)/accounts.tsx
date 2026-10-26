import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useColors, useInsets } from '@/components/ui/theme';
import { AccountCarousel } from '@/components/dashboard/AccountCarousel';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';
import { useDashboard } from '@/context/DashboardContext';

export default function AccountsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { accounts, totalBalance, isLoading, openAccountModal } = useDashboard();

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
        <AccountCarousel
          accounts={accounts}
          totalBalance={totalBalance}
          onOpenCreateAccountModal={openAccountModal}
          showAllFilter={false}
          onPressAccount={(id) =>
            router.push({
              pathname: '/account/[id]',
              params: { id },
            })
          }
        />
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
