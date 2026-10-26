import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useColors, useInsets } from '@/components/ui/theme';
import { TransactionType } from '@/core/models/transaction';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAccountFilters } from '@/hooks/useAccountFilters';
import { useThemeDropdown } from '@/hooks/useThemeDropdown';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { AccountCarousel } from '@/components/dashboard/AccountCarousel';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { CreateAccountModal } from '@/components/dashboard/CreateAccountModal';
import { CreateTransactionModal } from '@/components/dashboard/CreateTransactionModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { BlurTargetView } from 'expo-blur';
import { BackdropBlur } from '@/components/ui/BackdropBlur';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useInsets();
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);

  // Custom Hooks
  const {
    accounts,
    categories,
    monthlyTotals,
    totalBalance,
    isLoading,
    isRefreshing,
    loadData,
    handleRefresh,
    handleSeedDemoData,
    handleResetAllData,
  } = useDashboardStats();

  const {
    selectedFilterAccountId,
    transactions,
    selectedAccountName,
    handleSelectAccountFilter,
    reloadTransactions,
  } = useAccountFilters(accounts);

  const {
    isSettingsOpen,
    isDevMode,
    isDark,
    toggleTheme,
    toggleSettings,
    closeSettings,
  } = useThemeDropdown();
  const { language, toggleLanguage } = useTranslation();

  // Modal UI States
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isTxModalVisible, setIsTxModalVisible] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('EXPENSE');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const heroColor = isDark ? '#0F1B3D' : '#1F4FD8';
  const sheetColor = isDark ? '#1C2230' : '#E6E9EF';

  const handleOpenTransactionModal = (type: TransactionType) => {
    setTxType(type);
    setIsTxModalVisible(true);
  };

  const handleDataChanged = () => {
    loadData();
    reloadTransactions();
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: heroColor, paddingTop: insets.top }]}>
      <BlurTargetView ref={blurTarget} style={styles.blurTarget}>
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
                  paddingBottom: insets.bottom + 40,
                },
              ]}
            >
              <QuickActionsGrid onOpenTransactionModal={handleOpenTransactionModal} />

              <AccountCarousel
                accounts={accounts}
                totalBalance={totalBalance}
                selectedFilterAccountId={selectedFilterAccountId}
                onSelectAccountFilter={handleSelectAccountFilter}
                onOpenCreateAccountModal={() => setIsAccountModalVisible(true)}
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
      </BlurTargetView>

      {isSettingsOpen && (
        <BackdropBlur visible={isSettingsOpen} onPress={closeSettings} blurTarget={blurTarget} />
      )}

      <View style={[styles.headerOverlay, { top: insets.top }]} pointerEvents="box-none">
        <DashboardHeader
          isSettingsOpen={isSettingsOpen}
          isDevMode={isDevMode}
          isDark={isDark}
          language={language}
          toggleSettings={toggleSettings}
          closeSettings={closeSettings}
          toggleTheme={toggleTheme}
          toggleLanguage={toggleLanguage}
          handleSeedDemoData={handleSeedDemoData}
          handleResetAllData={handleResetAllData}
        />
      </View>

      {/* Modal Registrar Movimiento */}
      <CreateTransactionModal
        visible={isTxModalVisible}
        initialType={txType}
        accounts={accounts}
        categories={categories}
        blurTarget={blurTarget}
        onClose={() => setIsTxModalVisible(false)}
        onTransactionCreated={handleDataChanged}
      />

      {/* Modal Crear Cuenta */}
      <CreateAccountModal
        visible={isAccountModalVisible}
        blurTarget={blurTarget}
        onClose={() => setIsAccountModalVisible(false)}
        onAccountCreated={handleDataChanged}
      />
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
  blurTarget: {
    flex: 1,
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
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
});
