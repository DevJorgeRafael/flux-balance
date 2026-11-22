import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { appAlert } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useColors } from '@/components/ui/theme';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import type { Account } from '@/core/models/account';
import { buildReconciliationDraft } from '@/core/services/transfer';
import { parseAmountInput } from '@/core/utils/money';
import { SqliteTransactionRepository } from '@/infrastructure/repositories';

interface BalanceAdjustmentModalProps {
  visible: boolean;
  account: Account;
  onClose: () => void;
  onAdjusted: () => void;
}

const repository = new SqliteTransactionRepository();

export function BalanceAdjustmentModal({
  visible,
  account,
  onClose,
  onAdjusted,
}: BalanceAdjustmentModalProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { currency, format, locale } = useCurrency();
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const decimals = getCurrencyDecimals(currency);

  const handleConfirm = async () => {
    if (isSaving) return;

    const parsed = parseAmountInput(value, locale, decimals);
    if (!parsed.ok) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t(getAmountInputErrorKey(parsed.error), {
          decimals,
          max: format(Number.MAX_SAFE_INTEGER, { showCurrency: false }),
        }),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    const draft = buildReconciliationDraft(
      {
        accountId: account.id,
        currentBalance: account.balance,
        expectedBalance: parsed.value,
        date: new Date().toISOString(),
        description: t('balanceAdjustmentDescription'),
      },
      decimals
    );

    if (!draft) {
      void appAlert({
        type: 'warning',
        title: t('error'),
        message: t('transferInvalidInput'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    setIsSaving(true);
    try {
      await repository.createWithSplits(draft);
      setValue('');
      onClose();
      onAdjusted();
    } catch (error) {
      console.error('Error ajustando el saldo:', error);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('createTransactionError'),
        buttons: [{ text: t('accept') }],
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeight="55%">
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('adjustBalance')}
        </Text>
        <Text style={[styles.hint, { color: colors.textLight }]}>
          {t('realBalance')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            },
          ]}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
          placeholder={format(account.balance, { showCurrency: false })}
          placeholderTextColor={colors.textLight}
          autoFocus
        />
        <Button
          title={t('accept')}
          onPress={() => void handleConfirm()}
          disabled={isSaving}
          loading={isSaving}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  hint: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
  },
});
