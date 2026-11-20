import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { useColors, useInsets } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  SqliteAccountRepository,
  SqliteTransactionRepository,
} from '@/infrastructure/repositories';
import { Account } from '@/core/models/account';
import { Transaction } from '@/core/models/transaction';
import { AccountDetailHero } from '@/components/accounts/AccountDetailHero';
import { AccountProjectionCard } from '@/components/accounts/AccountProjectionCard';
import { AccountTransactionsList } from '@/components/accounts/AccountTransactionsList';

const accountRepo = new SqliteAccountRepository();
const transactionRepo = new SqliteTransactionRepository();

export default function AccountDetailScreen() {
  const rawParams = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(id));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAccountData = useCallback(async () => {
    if (!id) return;
    try {
      const acc = await accountRepo.getById(id);
      let txs: Transaction[] = [];
      if (acc) {
        txs = await transactionRepo.getAll({ accountId: id });
      }
      setAccount(acc);
      setTransactions(txs);
    } catch (e) {
      console.error('Error cargando detalle de cuenta:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    let isCancelled = false;
    const fetchAccountData = async () => {
      if (!id) return;
      try {
        const acc = await accountRepo.getById(id);
        let txs: Transaction[] = [];
        if (acc) {
          txs = await transactionRepo.getAll({ accountId: id });
        }
        if (!isCancelled) {
          setAccount(acc);
          setTransactions(txs);
        }
      } catch (e) {
        console.error('Error cargando detalle de cuenta:', e);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void fetchAccountData();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAccountData();
  };

  const totalIn = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>{t('accountNotFound')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.backButtonPrompt,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('backToDashboard')}
        >
          <Text style={[styles.backButtonPromptText, { color: colors.text }]}>{t('backToDashboard')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          style={({ pressed }) => [
            styles.roundIconButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {account.name}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero & Métricas */}
        <AccountDetailHero account={account} totalIn={totalIn} totalOut={totalOut} />

        <AccountProjectionCard account={account} />

        {/* Historial de Movimientos */}
        <AccountTransactionsList transactions={transactions} />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  backButtonPrompt: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonPromptText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
