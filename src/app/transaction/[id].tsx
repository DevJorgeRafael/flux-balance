import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Trash from 'lucide-react-native/icons/trash';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { useColors, useInsets } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { canEditTransaction } from '@/core/services/transaction-edit';
import { useDashboard } from '@/context/DashboardContext';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';
import { Transaction } from '@/core/models/transaction';
import { TransactionDetailCard } from '@/components/transactions/TransactionDetailCard';

const transactionRepo = new SqliteTransactionRepository();

export default function TransactionDetailScreen() {
  const rawParams = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const { refreshData } = useDashboard();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(id));
  const [isDeleting, setIsDeleting] = useState(false);
  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      let isCancelled = false;
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }

      transactionRepo
        .getById(id)
        .then((tx) => {
          if (!isCancelled) {
            setTransaction(tx);
          }
        })
        .catch((e) => {
          console.error('Error cargando transacción:', e);
        })
        .finally(() => {
          if (!isCancelled) {
            hasLoadedRef.current = true;
            setIsLoading(false);
          }
        });

      return () => {
        isCancelled = true;
      };
    }, [id])
  );

  const handleDelete = async () => {
    if (!id || !transaction) return;

    const confirmed = await appConfirm({
      title: t('deleteTransactionTitle'),
      message: t('deleteTransactionMessage'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await transactionRepo.delete(id);
      refreshData();
      router.back();
    } catch (err) {
      console.error('Error eliminando transacción:', err);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('deleteTransactionError'),
        buttons: [{ text: t('accept') }],
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>{t('movementNotFound')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.backButtonPrompt,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
        >
          <Text style={[styles.backButtonPromptText, { color: colors.text }]}>{t('goBack')}</Text>
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

        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('movementDetail')}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.roundIconButton,
            { backgroundColor: colors.errorSoft, borderColor: colors.border },
            pressed && styles.pressed,
            isDeleting && styles.disabled,
          ]}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={t('delete')}
          accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.errorText} />
          ) : (
            <Trash size={18} color={colors.errorText} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TransactionDetailCard
          transaction={transaction}
          isDeleting={isDeleting}
          canEdit={canEditTransaction(transaction)}
          onDelete={handleDelete}
          onEdit={() =>
            router.push({
              pathname: '/transaction/edit',
              params: { id: transaction.id },
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
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
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    paddingVertical: 10,
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
  disabled: {
    opacity: 0.7,
  },
});
