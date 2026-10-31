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
import { X, CreditCard, TrendingUp, Calendar } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { appAlert } from '@/components/ui/alert/appAlert';
import { AccountType } from '@/core/models/account';
import { useColors, useThemeMode } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { SqliteAccountRepository } from '@/infrastructure/repositories';
import {
  calculateDailyProjection,
  calculateFixedTermMaturity,
} from '@/core/services/interest-calculator';
import { AccountProjectionPreview } from '@/components/dashboard/AccountProjectionPreview';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrency } from '@/core/currency/useCurrency';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import {
  MAX_ACCOUNT_NAME_LENGTH,
  MAX_AMOUNT,
  MAX_ANNUAL_RATE_PERCENT,
  MAX_TERM_MONTHS,
} from '@/core/constants/inputLimits';
import { parseAmountInput } from '@/core/utils/money';
import { validateAccountForm } from './accountFormValidation';

interface CreateAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
  blurTarget: React.RefObject<React.ComponentRef<typeof View> | null>;
}

const accountRepo = new SqliteAccountRepository();

export function CreateAccountModal({
  visible,
  onClose,
  onAccountCreated,
  blurTarget,
}: CreateAccountModalProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { currency, format, locale } = useCurrency();
  const { t } = useTranslation();
  const submittingRef = useRef(false);

  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('CHECKING');
  const [accBalance, setAccBalance] = useState('');
  const [accTNA, setAccTNA] = useState('');
  const [accTermMonths, setAccTermMonths] = useState('3');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const resetForm = () => {
    setAccName('');
    setAccType('CHECKING');
    setAccBalance('');
    setAccTNA('');
    setAccTermMonths('3');
  };

  const handleCreate = async () => {
    if (submittingRef.current) return;

    const validation = validateAccountForm({
      name: accName,
      type: accType,
      balance: accBalance,
      annualRate: accTNA,
      termMonths: accTermMonths,
      locale,
      currency,
    });
    if (!validation.ok) {
      const params = {
        ...validation.params,
        ...(validation.maxAmount
          ? { max: format(MAX_AMOUNT, { showCurrency: false }) }
          : {}),
      };
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t(validation.errorKey, params),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    submittingRef.current = true;
    try {
      setIsCreatingAccount(true);

      const fixedDeposit =
        accType === 'FIXED_TERM'
          ? {
              principalAmount: validation.balance,
              annualRate: validation.annualRate ?? 0.4,
              termMonths: validation.termMonths,
            }
          : undefined;

      await accountRepo.create({
        name: validation.name,
        type: accType,
        initialBalance: validation.balance,
        annualRate: validation.annualRate,
        initialFixedTermDeposit: fixedDeposit,
      });

      resetForm();
      onClose();
      onAccountCreated();
    } catch (err) {
      console.error('Error creating account:', err);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('createAccountError'),
        buttons: [{ text: t('accept') }],
      });
    } finally {
      submittingRef.current = false;
      setIsCreatingAccount(false);
    }
  };

  const previewBalance = parseAmountInput(
    accBalance,
    locale,
    getCurrencyDecimals(currency),
    { allowZero: true }
  );
  const previewCapital = previewBalance.ok ? previewBalance.value : 0;
  const previewRateResult = parseAmountInput(accTNA, locale, 2, {
    allowZero: true,
  });
  const enteredPreviewRate = previewRateResult.ok
    ? previewRateResult.value
    : NaN;
  const previewRate = Math.min(
    MAX_ANNUAL_RATE_PERCENT,
    Math.max(
      0,
      Number.isFinite(enteredPreviewRate)
        ? enteredPreviewRate
        : accType === 'FIXED_TERM'
          ? 40
          : 0
    )
  );
  const previewMonthsValue = Number(accTermMonths);
  const previewMonths = Math.min(
    MAX_TERM_MONTHS,
    Math.max(
      1,
      Number.isInteger(previewMonthsValue) ? previewMonthsValue : 3
    )
  );
  const previewFixedMaturity =
    accType === 'FIXED_TERM'
      ? calculateFixedTermMaturity(previewCapital, previewRate, previewMonths)
      : null;
  const previewFlexibleMaturity =
    accType === 'FLEXIBLE_SAVINGS'
      ? calculateDailyProjection(previewCapital, previewRate, 365).at(-1)?.balance ?? previewCapital
      : null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      blurTarget={blurTarget}
      maxHeight="88%"
      bottomPaddingExtra={20}
    >
      <View style={styles.modalTopBar}>
        <Text style={[styles.modalHeading, { color: colors.text }]}>{t('newAccountTitle')}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={22} color={colors.textLight} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Selector de Tipo de Cuenta */}
            <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 4 }]}>{t('accountType')}</Text>
            <View style={styles.accountTypeSelectorRow}>
              <Card
                backgroundColor={
                  accType === 'CHECKING' ? colors.primarySoft : colors.surfaceMuted
                }
                borderColor={accType === 'CHECKING' ? colors.primary : colors.border}
                borderWidth={1.5}
                style={styles.accountTypeCardOption}
                onPress={() => setAccType('CHECKING')}
              >
                <CreditCard size={18} color={accType === 'CHECKING' ? colors.primaryText : colors.textLight} />
                <Text style={[styles.accountTypeOptionTitle, { color: accType === 'CHECKING' ? colors.primaryText : colors.text }]}>
                  {t('checking')}
                </Text>
                <Text style={[styles.accountTypeOptionDesc, { color: colors.textLight }]}>{t('operations')}</Text>
              </Card>

              <Card
                backgroundColor={
                  accType === 'FLEXIBLE_SAVINGS' ? colors.primarySoft : colors.surfaceMuted
                }
                borderColor={accType === 'FLEXIBLE_SAVINGS' ? colors.primary : colors.border}
                borderWidth={1.5}
                style={styles.accountTypeCardOption}
                onPress={() => setAccType('FLEXIBLE_SAVINGS')}
              >
                <TrendingUp size={18} color={accType === 'FLEXIBLE_SAVINGS' ? colors.primaryText : colors.textLight} />
                <Text style={[styles.accountTypeOptionTitle, { color: accType === 'FLEXIBLE_SAVINGS' ? colors.primaryText : colors.text }]}>
                  Flexible
                </Text>
                <Text style={[styles.accountTypeOptionDesc, { color: colors.textLight }]}>{t('returnLabel')}</Text>
              </Card>

              <Card
                backgroundColor={
                  accType === 'FIXED_TERM' ? colors.warningSoft : colors.surfaceMuted
                }
                borderColor={accType === 'FIXED_TERM' ? colors.warning : colors.border}
                borderWidth={1.5}
                style={styles.accountTypeCardOption}
                onPress={() => setAccType('FIXED_TERM')}
              >
                <Calendar size={18} color={accType === 'FIXED_TERM' ? colors.warningText : colors.textLight} />
                <Text style={[styles.accountTypeOptionTitle, { color: accType === 'FIXED_TERM' ? colors.warningText : colors.text }]}>
                  {t('fixedTerm')}
                </Text>
                <Text style={[styles.accountTypeOptionDesc, { color: colors.textLight }]}>{t('atTerm')}</Text>
              </Card>
            </View>

            {/* Nombre de la Cuenta */}
            <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>{t('accountName')}</Text>
            <TextInput
              style={[
                styles.formTextInput,
                { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
              ]}
              placeholder={t('accountNamePlaceholder')}
              placeholderTextColor={colors.textLight}
              value={accName}
              onChangeText={setAccName}
              maxLength={MAX_ACCOUNT_NAME_LENGTH}
            />

            {/* Saldo Inicial / Capital */}
            <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>
              {accType === 'FIXED_TERM'
                ? t('investedCapital', { currency })
                : t('initialBalance', { currency })}
            </Text>
            <TextInput
              style={[
                styles.formTextInput,
                { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="0.00"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
              value={accBalance}
              onChangeText={setAccBalance}
            />

            {/* Tasa Nominal Anual con fade in */}
            {(accType === 'FLEXIBLE_SAVINGS' || accType === 'FIXED_TERM') && (
              <Animated.View entering={FadeIn.duration(150)}>
                <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>
                  {t('annualRate')}
                </Text>
                <TextInput
                  style={[
                    styles.formTextInput,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder={
                    accType === 'FLEXIBLE_SAVINGS'
                      ? t('annualRateFlexiblePlaceholder')
                      : t('annualRateFixedPlaceholder')
                  }
                  placeholderTextColor={colors.textLight}
                  keyboardType="decimal-pad"
                  value={accTNA}
                  onChangeText={setAccTNA}
                />
              </Animated.View>
            )}

            {/* Plazo en Meses con fade in */}
            {accType === 'FIXED_TERM' && (
              <Animated.View entering={FadeIn.duration(150)}>
                <Text style={[styles.formLabel, { color: colors.textLight, marginTop: 14 }]}>{t('maturityTerm')}</Text>
                <View style={styles.termMonthsRow}>
                  {['1', '3', '6', '12'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.termMonthPill,
                        {
                          backgroundColor:
                            accTermMonths === m
                              ? colors.primary
                              : isDark
                                ? colors.surfaceMuted
                                : colors.inputBackground,
                          borderColor: accTermMonths === m ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setAccTermMonths(m)}
                    >
                      <Text
                        style={[
                          styles.termMonthPillText,
                          { color: accTermMonths === m ? colors.onPrimary : colors.text },
                        ]}
                      >
                        {m} {m === '1' ? t('month') : t('months')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {(accType === 'FIXED_TERM' || accType === 'FLEXIBLE_SAVINGS') && (
              <AccountProjectionPreview
                accountType={accType}
                rate={previewRate}
                finalAmount={previewFixedMaturity ?? previewFlexibleMaturity ?? previewCapital}
              />
            )}

            {/* Botón Crear Cuenta */}
            <TouchableOpacity
              style={[
                styles.submitTransactionButton,
                { backgroundColor: colors.primary, marginTop: 24, opacity: isCreatingAccount ? 0.7 : 1 },
              ]}
              onPress={handleCreate}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.submitTransactionButtonText, { color: colors.onPrimary }]}>
                  {t('createAccount')}
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
    marginBottom: 20,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  accountTypeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  accountTypeCardOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  accountTypeOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  accountTypeOptionDesc: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  formTextInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  termMonthsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  termMonthPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  termMonthPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitTransactionButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitTransactionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
