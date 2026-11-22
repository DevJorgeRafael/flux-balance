import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ReminderScreenHeader } from '@/components/reminders/ReminderScreenHeader';
import { appAlert } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { useColors, useInsets } from '@/components/ui/theme';
import { TransactionFormFields } from '@/components/transactions/TransactionFormFields';
import {
  resolveTransactionFormSelection,
  type TransactionAccountOption,
  type TransactionFormValues,
} from '@/components/transactions/transactionFormState';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { MAX_AMOUNT } from '@/core/constants/inputLimits';
import { useCurrency } from '@/core/currency/useCurrency';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import { useTranslation } from '@/core/i18n/useTranslation';
import type {
  Transaction,
  TransactionType,
  UpdateTransactionDTO,
} from '@/core/models/transaction';
import {
  getTransactionEditBlockReason,
  validateTransactionUpdate,
  type TransactionEditBlockReason,
} from '@/core/services/transaction-edit';
import { parseAmountInput } from '@/core/utils/money';
import { useDashboard } from '@/context/DashboardContext';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';

const transactionRepo = new SqliteTransactionRepository();

const EMPTY_VALUES: TransactionFormValues = {
  type: 'EXPENSE',
  amount: '',
  description: '',
  accountId: '',
  destinationAccountId: '',
  categoryId: '',
};

function blockReasonMessage(
  reason: TransactionEditBlockReason,
  t: ReturnType<typeof useTranslation>['t']
): string {
  switch (reason) {
    case 'TRANSFER':
      return t('movementTransferNotEditable');
    case 'MULTIPLE_SPLITS':
      return t('movementSplitNotEditable');
    default:
      return t('movementNotEditable');
  }
}

export default function EditTransactionScreen() {
  const rawParams = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const colors = useColors();
  const insets = useInsets();
  const { currency, format, locale } = useCurrency();
  const { t } = useTranslation();
  const {
    accounts,
    categories,
    isLoading: isDashboardLoading,
    refreshData,
  } = useDashboard();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [values, setValues] = useState<TransactionFormValues>(EMPTY_VALUES);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [notFound, setNotFound] = useState(!id);
  const [isSaving, setIsSaving] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    let isCancelled = false;

    transactionRepo
      .getById(id)
      .then((loaded) => {
        if (isCancelled) return;
        if (!loaded) {
          setNotFound(true);
          return;
        }

        setTransaction(loaded);
        setValues({
          type: loaded.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
          amount: format(loaded.totalAmount, { showCurrency: false }),
          description: loaded.description ?? '',
          accountId: loaded.splits[0]?.accountId ?? '',
          destinationAccountId: '',
          categoryId: loaded.splits[0]?.categoryId ?? '',
        });
      })
      .catch((error) => {
        console.error('Error loading transaction:', error);
        if (!isCancelled) setNotFound(true);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [format, id]);

  const accountOptions = useMemo<TransactionAccountOption[]>(() => {
    const options = accounts.map((account) => ({
      id: account.id,
      name: account.name,
    }));
    const currentAccountId = transaction?.splits[0]?.accountId;

    if (
      currentAccountId &&
      !options.some((option) => option.id === currentAccountId)
    ) {
      options.push({
        id: currentAccountId,
        name: transaction?.splits[0]?.accountName ?? t('account'),
      });
    }

    return options;
  }, [accounts, t, transaction]);

  const selection = useMemo(
    () =>
      resolveTransactionFormSelection(values, accountOptions, categories, {
        fallbackToFirstCategory: false,
      }),
    [accountOptions, categories, values]
  );

  const originalAccountId = transaction?.splits[0]?.accountId;
  const isAccountChanged = Boolean(
    originalAccountId && selection.effectiveAccountId !== originalAccountId
  );
  const blockReason = transaction
    ? getTransactionEditBlockReason(transaction)
    : null;

  const updateField = (
    field: 'amount' | 'description' | 'accountId' | 'destinationAccountId' | 'categoryId',
    value: string
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleTypeChange = (type: TransactionType) => {
    setValues((current) => ({
      ...current,
      type,
      categoryId: categories.find((category) => category.type === type)?.id ?? '',
    }));
  };

  const handleSave = async () => {
    if (!transaction || submittingRef.current || blockReason) return;

    const decimals = getCurrencyDecimals(currency);
    const amountResult = parseAmountInput(values.amount, locale, decimals);
    if (!amountResult.ok) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t(getAmountInputErrorKey(amountResult.error), {
          decimals,
          max: format(MAX_AMOUNT, { showCurrency: false }),
        }),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    if (!selection.effectiveAccountId) {
      void appAlert({
        type: 'warning',
        title: t('error'),
        message: t('noAccountsForMovement'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    if (values.type !== 'INCOME' && values.type !== 'EXPENSE') {
      return;
    }

    const payload: UpdateTransactionDTO = {
      type: values.type,
      totalAmount: amountResult.value,
      description: values.description.trim() || null,
      date: transaction.date,
      splits: [
        {
          accountId: selection.effectiveAccountId,
          categoryId: selection.activeCategoryId,
          amount: amountResult.value,
          notes: transaction.splits[0]?.notes ?? undefined,
        },
      ],
    };

    const validation = validateTransactionUpdate(payload);
    if (!validation.ok) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('transactionUpdateInvalid'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    submittingRef.current = true;
    try {
      setIsSaving(true);
      await transactionRepo.updateWithSplits(transaction.id, payload);
      refreshData();
      router.back();
    } catch (error) {
      console.error('Error updating transaction:', error);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('updateTransactionError'),
        buttons: [{ text: t('accept') }],
      });
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  };

  const isBusy = isLoading || isDashboardLoading;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ReminderScreenHeader
        title={t('editMovement')}
        onBack={() => router.back()}
      />

      {notFound ? (
        <View style={styles.centered}>
          <Text style={[styles.centeredText, { color: colors.textLight }]}>
            {t('movementNotFound')}
          </Text>
        </View>
      ) : isBusy ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : blockReason ? (
        <View style={styles.centered}>
          <Text style={[styles.centeredText, { color: colors.textLight }]}>
            {blockReasonMessage(blockReason, t)}
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <TransactionFormFields
              values={values}
              onChange={updateField}
              onTypeChange={handleTypeChange}
              accounts={accountOptions}
              categories={categories}
              autoFocusAmount={false}
              fallbackToFirstCategory={false}
              allowEmptyCategory
              categoryEmptyLabel={t('uncategorized')}
            />

            {isAccountChanged ? (
              <Text style={[styles.accountHint, { color: colors.textLight }]}>
                {t('accountChangeHint')}
              </Text>
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <Button
              title={t('saveChanges')}
              onPress={handleSave}
              loading={isSaving}
              style={styles.actionButton}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centeredText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  accountHint: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
