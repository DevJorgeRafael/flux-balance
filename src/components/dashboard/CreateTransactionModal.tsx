import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { X } from 'lucide-react-native';
import { appAlert } from '@/components/ui/alert/appAlert';
import { TransactionPrefill, TransactionType } from '@/core/models/transaction';
import { Account } from '@/core/models/account';
import { Category } from '@/core/models/category';
import { isHexColor, useColors, useThemeMode } from '@/components/ui/theme';
import { Button } from '@/components/ui/atoms/Button';
import { SegmentedTypeControl } from '@/components/ui/SegmentedTypeControl';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { MAX_AMOUNT, MAX_TRANSACTION_DESCRIPTION_LENGTH } from '@/core/constants/inputLimits';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import { parseAmountInput } from '@/core/utils/money';
import { applyTransactionPrefill } from './transactionPrefill';

interface CreateTransactionModalProps {
  visible: boolean;
  initialType?: TransactionType;
  initialPrefill?: TransactionPrefill | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onTransactionCreated: () => void;
  blurTarget: React.RefObject<React.ComponentRef<typeof View> | null>;
}

const transactionRepo = new SqliteTransactionRepository();

export function CreateTransactionModal({
  visible,
  initialType = 'EXPENSE',
  initialPrefill = null,
  accounts,
  categories,
  onClose,
  onTransactionCreated,
  blurTarget,
}: CreateTransactionModalProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { currency, format, locale } = useCurrency();
  const { t } = useTranslation();
  const submittingRef = useRef(false);

  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedPrefill, setAppliedPrefill] = useState<TransactionPrefill | null>(null);
  const typeCategories = categories.filter((category) => category.type === txType);
  const activeCategoryId = typeCategories.some(
    (category) => category.id === selectedCategoryId
  )
    ? selectedCategoryId
    : typeCategories[0]?.id ?? '';

  const resetForm = () => {
    setTxAmount('');
    setTxDesc('');
    setSelectedAccountId(accounts[0]?.id || '');
    setSelectedCategoryId('');
  };

  const handleTypeChange = (type: TransactionType) => {
    setTxType(type);
    setSelectedCategoryId('');
  };

  const applyPrefill = (prefill: TransactionPrefill, type: TransactionType) => {
    setAppliedPrefill(prefill);
    applyTransactionPrefill(prefill, type, accounts, categories,
      (value) => format(value, { showCurrency: false }),
      { amount: setTxAmount, description: setTxDesc, accountId: setSelectedAccountId, categoryId: setSelectedCategoryId }
    );
  };

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setTxType(initialType);
      if (initialPrefill) {
        applyPrefill(initialPrefill, initialType);
      } else if (appliedPrefill) {
        setAppliedPrefill(null);
        resetForm();
      } else if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  } else if (visible && initialPrefill && initialPrefill !== appliedPrefill) {
    setTxType(initialType);
    applyPrefill(initialPrefill, initialType);
  }

  const handleCreate = async () => {
    if (submittingRef.current) return;

    const decimals = getCurrencyDecimals(currency);
    const amountResult = parseAmountInput(txAmount, locale, decimals);
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
    const amountVal = amountResult.value;

    const accountId = selectedAccountId || accounts[0]?.id;
    if (!accountId) {
      void appAlert({
        type: 'warning',
        title: t('error'),
        message: t('noAccountsForMovement'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    const catId = activeCategoryId;

    submittingRef.current = true;
    try {
      setIsSubmitting(true);
      await transactionRepo.createWithSplits({
        type: txType,
        date: new Date().toISOString(),
        totalAmount: amountVal,
        description: txDesc.trim() || undefined,
        splits: [
          {
            accountId: accountId,
            categoryId: catId,
            amount: amountVal,
          },
        ],
      });

      resetForm();
      onClose();
      onTransactionCreated();
    } catch (err: unknown) {
      console.error('Error creating transaction:', err);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('createTransactionError'),
        buttons: [{ text: t('accept') }],
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      blurTarget={blurTarget}
      maxHeight="92%"
    >
      <View style={styles.modalTopBar}>
        <Text style={[styles.modalHeading, { color: colors.text }]}>
          {txType === 'INCOME' ? t('registerIncome') : t('registerExpense')}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          hitSlop={14}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <X size={22} color={colors.textLight} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <SegmentedTypeControl
          value={txType}
          options={[
            {
              value: 'INCOME',
              label: t('income'),
              color: colors.success,
              textColor: colors.onSuccess,
            },
            {
              value: 'EXPENSE',
              label: t('expense'),
              color: colors.error,
              textColor: colors.onError,
            },
          ]}
          onChange={handleTypeChange}
          style={styles.typeSegmentedControl}
        />

        <Text style={[styles.formLabel, { color: colors.textLight }]}>
          {t('amount', { currency })}
        </Text>
        <TextInput
          style={[
            styles.largeAmountInput,
            {
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            },
          ]}
          placeholder={format(0, { showCurrency: false })}
          placeholderTextColor={colors.textLight}
          keyboardType="decimal-pad"
          value={txAmount}
          onChangeText={setTxAmount}
          autoFocus
        />

        <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>
          {t('description')}
        </Text>
        <TextInput
          style={[
            styles.standardInput,
            {
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            },
          ]}
          placeholder={t('descriptionPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={txDesc}
          onChangeText={setTxDesc}
          maxLength={MAX_TRANSACTION_DESCRIPTION_LENGTH}
        />

        {typeCategories.length > 0 && (
          <>
            <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>
              {t('category')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
            >
              {typeCategories.map((cat) => {
                const selected = activeCategoryId === cat.id;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    accessibilityRole="button"
                    accessibilityLabel={cat.name}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.selectionChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : isDark
                            ? colors.surfaceMuted
                            : colors.inputBackground,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryColorBadge,
                        selected && { backgroundColor: colors.white },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryColorDot,
                          { backgroundColor: isHexColor(cat.color) ? cat.color : colors.chartOther },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.selectionChipText,
                        { color: selected ? colors.onPrimary : colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {accounts.length > 0 && (
          <>
            <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 10 }]}>
              {t('destinationAccount')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
            >
              {accounts.map((acc) => {
                const selected = selectedAccountId === acc.id;

                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    accessibilityRole="button"
                    accessibilityLabel={acc.name}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.selectionChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : isDark
                            ? colors.surfaceMuted
                            : colors.inputBackground,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectionChipText,
                        { color: selected ? colors.onPrimary : colors.text },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        <Button
          title={t('saveMovement')}
          variant={txType === 'INCOME' ? 'success' : 'primary'}
          onPress={handleCreate}
          loading={isSubmitting}
          style={styles.submitTransactionButton}
        />
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  typeSegmentedControl: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  largeAmountInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  standardInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  chipRow: {
    marginVertical: 8,
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryColorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectionChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitTransactionButton: {
    marginTop: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
