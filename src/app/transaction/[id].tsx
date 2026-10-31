import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Trash } from 'lucide-react-native';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { useColors, useInsets } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
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

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(id));
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (!id) return;

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
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

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
        <Text style={[styles.errorTitle, { color: colors.text }]}>Movimiento no encontrado</Text>
        <TouchableOpacity
          style={[styles.backButtonPrompt, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonPromptText, { color: colors.text }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={[styles.roundIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalle de Movimiento</Text>

        <TouchableOpacity
          style={[styles.roundIconButton, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}
          onPress={handleDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.errorText} />
          ) : (
            <Trash size={18} color={colors.errorText} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TransactionDetailCard
          transaction={transaction}
          isDeleting={isDeleting}
          onDelete={handleDelete}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonPromptText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
