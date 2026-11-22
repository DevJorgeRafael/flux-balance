import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import X from 'lucide-react-native/icons/x';
import { appAlert } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useColors } from '@/components/ui/theme';
import { TransactionFormFields } from '@/components/transactions/TransactionFormFields';
import {
  resolveTransactionFormSelection,
  type TransactionFormValues,
} from '@/components/transactions/transactionFormState';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { MAX_AMOUNT } from '@/core/constants/inputLimits';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import { buildTransferDraft, validateTransferInput } from '@/core/services/transfer';
import {
  buildLearnedRules,
  suggestCategory,
  type CategoryRule,
} from '@/core/services/category-rules';
import type { Account } from '@/core/models/account';
import type { Category } from '@/core/models/category';
import type {
  TransactionPrefill,
  TransactionType,
} from '@/core/models/transaction';
import { parseAmountInput } from '@/core/utils/money';
import {
  SqliteCategoryRuleRepository,
  SqliteTransactionRepository,
} from '@/infrastructure/repositories';
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
const categoryRuleRepo = new SqliteCategoryRuleRepository();

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
  const { currency, format, locale } = useCurrency();
  const { t } = useTranslation();
  const submittingRef = useRef(false);
  const rulesRef = useRef<CategoryRule[]>([]);
  const categoryTouchedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    categoryTouchedRef.current = false;
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    categoryRuleRepo
      .getAll()
      .then((rules) => {
        rulesRef.current = rules;
      })
      .catch((error) => {
        console.error('Error cargando reglas de categoría:', error);
      });
  }, [visible]);

  const [formValues, setFormValues] = useState<TransactionFormValues>(() => ({
    type: initialType,
    amount: '',
    description: '',
    accountId: accounts[0]?.id ?? '',
    destinationAccountId: accounts[1]?.id ?? '',
    categoryId: '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedPrefill, setAppliedPrefill] = useState<TransactionPrefill | null>(
    null
  );

  const updateField = (
    field: 'amount' | 'description' | 'accountId' | 'destinationAccountId' | 'categoryId',
    value: string
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleFieldChange = (
    field: 'amount' | 'description' | 'accountId' | 'destinationAccountId' | 'categoryId',
    value: string
  ) => {
    if (field === 'categoryId') categoryTouchedRef.current = true;
    if (field === 'description') {
      setFormValues((current) => {
        const suggestion =
          current.type === 'TRANSFER'
            ? null
            : suggestCategory(value, rulesRef.current, current.type);
        return {
          ...current,
          description: value,
          categoryId:
            !categoryTouchedRef.current && suggestion
              ? suggestion.categoryId
              : current.categoryId,
        };
      });
      return;
    }
    updateField(field, value);
  };

  const resetForm = () => {
    setFormValues((current) => ({
      ...current,
      amount: '',
      description: '',
      accountId: accounts[0]?.id ?? '',
      destinationAccountId: accounts[1]?.id ?? '',
      categoryId: '',
    }));
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormValues((current) => ({
      ...current,
      type,
      categoryId: '',
      destinationAccountId:
        type === 'TRANSFER' && current.destinationAccountId === current.accountId
          ? (accounts.find((account) => account.id !== current.accountId)?.id ?? '')
          : current.destinationAccountId,
    }));
  };

  const applyPrefill = (prefill: TransactionPrefill, type: TransactionType) => {
    setAppliedPrefill(prefill);
    applyTransactionPrefill(
      prefill,
      type,
      accounts,
      categories,
      (value) => format(value, { showCurrency: false }),
      {
        amount: (value) => updateField('amount', value),
        description: (value) => updateField('description', value),
        accountId: (value) => updateField('accountId', value),
        categoryId: (value) => updateField('categoryId', value),
      }
    );
  };

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setFormValues((current) => ({ ...current, type: initialType }));
      if (initialPrefill) {
        applyPrefill(initialPrefill, initialType);
      } else if (appliedPrefill) {
        setAppliedPrefill(null);
        resetForm();
      } else if (accounts.length > 0 && !formValues.accountId) {
        setFormValues((current) => ({ ...current, accountId: accounts[0].id }));
      }
    }
  } else if (visible && initialPrefill && initialPrefill !== appliedPrefill) {
    setFormValues((current) => ({ ...current, type: initialType }));
    applyPrefill(initialPrefill, initialType);
  }

  const handleCreate = async () => {
    if (submittingRef.current) return;

    const decimals = getCurrencyDecimals(currency);
    const amountResult = parseAmountInput(
      formValues.amount,
      locale,
      decimals
    );
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

    const selection = resolveTransactionFormSelection(
      formValues,
      accounts,
      categories
    );
    const accountId = selection.effectiveAccountId;
    if (!accountId) {
      void appAlert({
        type: 'warning',
        title: t('error'),
        message: t('noAccountsForMovement'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    if (formValues.type === 'TRANSFER') {
      const input = {
        sourceAccountId: accountId,
        destinationAccountId: formValues.destinationAccountId,
        amount: amountVal,
        date: new Date().toISOString(),
        description: formValues.description,
      };
      const validation = validateTransferInput(input);
      if (validation) {
        void appAlert({
          type: 'warning',
          title: t('error'),
          message: t(
            validation === 'invalidAccounts'
              ? 'transferInvalidAccounts'
              : 'transferInvalidInput'
          ),
          buttons: [{ text: t('accept') }],
        });
        return;
      }

      const transfer = buildTransferDraft(input);
      if (!transfer.ok) return;

      submittingRef.current = true;
      try {
        setIsSubmitting(true);
        await transactionRepo.createWithSplits(transfer.draft);
        resetForm();
        onClose();
        onTransactionCreated();
      } catch (err: unknown) {
        console.error('Error creating transfer:', err);
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
      return;
    }

    if (formValues.type !== 'INCOME' && formValues.type !== 'EXPENSE') {
      return;
    }

    submittingRef.current = true;
    try {
      setIsSubmitting(true);
      await transactionRepo.createWithSplits({
        type: formValues.type,
        date: new Date().toISOString(),
        totalAmount: amountVal,
        description: formValues.description.trim() || undefined,
        splits: [
          {
            accountId,
            categoryId: selection.activeCategoryId,
            amount: amountVal,
          },
        ],
      });

      const learned = buildLearnedRules(
        formValues.description,
        selection.activeCategoryId,
        formValues.type,
        rulesRef.current
      );
      if (learned.length > 0) {
        await Promise.all(learned.map((draft) => categoryRuleRepo.create(draft))).catch(
          (error) => {
            console.error('Error aprendiendo reglas de categoría:', error);
          }
        );
        rulesRef.current = await categoryRuleRepo.getAll().catch(() => rulesRef.current);
      }

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
          {formValues.type === 'INCOME'
            ? t('registerIncome')
            : formValues.type === 'TRANSFER'
              ? t('registerTransfer')
              : t('registerExpense')}
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
        <TransactionFormFields
          values={formValues}
          onChange={handleFieldChange}
          onTypeChange={handleTypeChange}
          accounts={accounts}
          categories={categories}
          autoFocusAmount
          fallbackToFirstCategory
          allowEmptyCategory={false}
        />

        <Button
          title={t('saveMovement')}
          variant="primary"
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
  submitTransactionButton: {
    marginTop: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
