import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { appAlert } from '@/components/ui/alert/appAlert';
import { TransactionType } from '@/core/models/transaction';
import { Account } from '@/core/models/account';
import { Category } from '@/core/models/category';
import { isHexColor, useColors, useThemeMode } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import {
  MAX_AMOUNT,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '@/core/constants/inputLimits';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import { parseAmountInput } from '@/core/utils/money';

interface CreateTransactionModalProps {
  visible: boolean;
  initialType?: TransactionType;
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
  const typeCategories = categories.filter((category) => category.type === txType);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setTxType(initialType);
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }

  const resetForm = () => {
    setTxAmount('');
    setTxDesc('');
    setSelectedAccountId(accounts[0]?.id || '');
    setSelectedCategoryId('');
  };

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

    const catId =
      typeCategories.find((category) => category.id === selectedCategoryId)?.id ??
      typeCategories[0]?.id ??
      '';

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
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={22} color={colors.textLight} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {/* Segmented Control de Tipo */}
          <Card
            backgroundColor={colors.surfaceMuted}
            style={styles.typeSegmentedControl}
          >
            <TouchableOpacity
              style={[
                styles.typeSegmentOption,
                txType === 'INCOME' && { backgroundColor: colors.success, borderRadius: 10 },
              ]}
              onPress={() => {
                setTxType('INCOME');
                setSelectedCategoryId('');
              }}
            >
              <Text
                style={[
                  styles.typeSegmentText,
                  { color: txType === 'INCOME' ? colors.onSuccess : colors.textLight },
                ]}
              >
                {t('income')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeSegmentOption,
                txType === 'EXPENSE' && { backgroundColor: colors.error, borderRadius: 10 },
              ]}
              onPress={() => {
                setTxType('EXPENSE');
                setSelectedCategoryId('');
              }}
            >
              <Text
                style={[
                  styles.typeSegmentText,
                  { color: txType === 'EXPENSE' ? colors.onError : colors.textLight },
                ]}
              >
                {t('expense')}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Input de Monto */}
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

          {/* Input de Descripción */}
          <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>{t('description')}</Text>
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

          {/* Selector de Categoría */}
          {typeCategories.length > 0 && (
            <>
              <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>{t('category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {typeCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.selectionChip,
                      {
                        backgroundColor:
                          selectedCategoryId === cat.id
                            ? colors.primary
                            : isDark
                              ? colors.surfaceMuted
                              : colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <View
                      style={[
                        styles.categoryColorDot,
                        { backgroundColor: isHexColor(cat.color) ? cat.color : colors.chartOther },
                      ]}
                    />
                    <Text
                      style={[
                        styles.selectionChipText,
                        {
                          color: selectedCategoryId === cat.id ? colors.onPrimary : colors.text,
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Selector de Cuenta */}
          {accounts.length > 0 && (
            <>
              <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 10 }]}>{t('destinationAccount')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.selectionChip,
                      {
                        backgroundColor:
                          selectedAccountId === acc.id
                            ? colors.primary
                            : isDark
                              ? colors.surfaceMuted
                              : colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Text
                      style={[
                        styles.selectionChipText,
                        {
                          color: selectedAccountId === acc.id ? colors.onPrimary : colors.text,
                        },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[
              styles.submitTransactionButton,
              {
                backgroundColor: txType === 'INCOME' ? colors.success : colors.primary,
                opacity: isSubmitting ? 0.7 : 1,
              },
            ]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={txType === 'INCOME' ? colors.onSuccess : colors.onPrimary}
              />
            ) : (
              <Text
                style={[
                  styles.submitTransactionButtonText,
                  { color: txType === 'INCOME' ? colors.onSuccess : colors.onPrimary },
                ]}
              >
                {t('saveMovement')}
              </Text>
            )}
          </TouchableOpacity>
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
    flexDirection: 'row',
    padding: 4,
    marginBottom: 18,
  },
  typeSegmentOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeSegmentText: {
    fontSize: 14,
    fontWeight: '700',
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
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
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
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitTransactionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
