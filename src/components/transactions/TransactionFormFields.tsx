import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OptionChips } from '@/components/ui/OptionChips';
import { SelectField } from '@/components/ui/SelectField';
import { SegmentedTypeControl } from '@/components/ui/SegmentedTypeControl';
import { useColors } from '@/components/ui/theme';
import { MAX_ACCOUNT_CHIPS } from '@/core/constants/formOptions';
import { MAX_TRANSACTION_DESCRIPTION_LENGTH } from '@/core/constants/inputLimits';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Category } from '@/core/models/category';
import type { TransactionType } from '@/core/models/transaction';
import {
  resolveTransactionFormSelection,
  type TransactionAccountOption,
  type TransactionFormValues,
} from './transactionFormState';

interface TransactionFormFieldsProps {
  values: TransactionFormValues;
  onChange: (
    field: 'amount' | 'description' | 'accountId' | 'destinationAccountId' | 'categoryId',
    value: string
  ) => void;
  onTypeChange: (type: TransactionType) => void;
  accounts: TransactionAccountOption[];
  categories: Category[];
  autoFocusAmount?: boolean;
  fallbackToFirstCategory?: boolean;
  allowEmptyCategory?: boolean;
  categoryEmptyLabel?: string;
}

export function TransactionFormFields({
  values,
  onChange,
  onTypeChange,
  accounts,
  categories,
  autoFocusAmount = true,
  fallbackToFirstCategory = true,
  allowEmptyCategory = false,
  categoryEmptyLabel,
}: TransactionFormFieldsProps) {
  const colors = useColors();
  const { currency, format } = useCurrency();
  const { t } = useTranslation();
  const selection = resolveTransactionFormSelection(values, accounts, categories, {
    fallbackToFirstCategory,
  });
  const useAccountChips = accounts.length <= MAX_ACCOUNT_CHIPS;

  return (
    <>
      <SegmentedTypeControl
        value={values.type}
        options={[
          {
            value: 'INCOME',
            label: t('income'),
            color: colors.successSoft,
            textColor: colors.successText,
          },
          {
            value: 'EXPENSE',
            label: t('addExpense'),
            color: colors.errorSoft,
            textColor: colors.errorText,
          },
          {
            value: 'TRANSFER',
            label: t('transfer'),
            color: colors.primarySoft,
            textColor: colors.primaryText,
          },
        ]}
        onChange={onTypeChange}
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
        value={values.amount}
        onChangeText={(value) => onChange('amount', value)}
        autoFocus={autoFocusAmount}
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
        value={values.description}
        onChangeText={(value) => onChange('description', value)}
        maxLength={MAX_TRANSACTION_DESCRIPTION_LENGTH}
      />

      {accounts.length > 0 &&
        (useAccountChips ? (
          <View>
            <Text
              style={[
                styles.formLabel,
                styles.fieldLabel,
                { color: colors.textLight },
              ]}
            >
              {values.type === 'TRANSFER' ? t('sourceAccount') : t('destinationAccount')}
            </Text>
            <OptionChips
              options={accounts.map((account) => ({
                id: account.id,
                label: account.name,
              }))}
              selectedId={selection.effectiveAccountId}
              onSelect={(id) => onChange('accountId', id)}
            />
          </View>
        ) : (
          <SelectField
            label={values.type === 'TRANSFER' ? t('sourceAccount') : t('destinationAccount')}
            title={t('account')}
            emptyLabel={t('reminderNoAccount')}
            accessibilityLabel={`${t('account')}: ${
              selection.selectedAccount?.name ?? t('reminderNoAccount')
            }`}
            options={accounts}
            selectedId={selection.effectiveAccountId}
            onSelect={(id) => onChange('accountId', id)}
            allowEmpty={false}
          />
        ))}

      {values.type === 'TRANSFER' && accounts.length > 0 &&
        (useAccountChips ? (
          <View style={styles.fieldLabel}>
            <Text style={[styles.formLabel, { color: colors.textLight }]}>
              {t('destinationAccount')}
            </Text>
            <OptionChips
              options={accounts
                .filter((account) => account.id !== selection.effectiveAccountId)
                .map((account) => ({ id: account.id, label: account.name }))}
              selectedId={values.destinationAccountId}
              onSelect={(id) => onChange('destinationAccountId', id)}
            />
          </View>
        ) : (
          <SelectField
            label={t('destinationAccount')}
            title={t('account')}
            emptyLabel={t('reminderNoAccount')}
            accessibilityLabel={`${t('destinationAccount')}: ${
              accounts.find((account) => account.id === values.destinationAccountId)?.name ??
              t('reminderNoAccount')
            }`}
            options={accounts.filter(
              (account) => account.id !== selection.effectiveAccountId
            )}
            selectedId={values.destinationAccountId}
            onSelect={(id) => onChange('destinationAccountId', id)}
            allowEmpty={false}
          />
        ))}

      {values.type === 'TRANSFER' ? null : selection.typeCategories.length > 0 && (
        <SelectField
          label={t('category')}
          title={t('category')}
          emptyLabel={categoryEmptyLabel ?? t('reminderNoCategory')}
          accessibilityLabel={`${t('category')}: ${
            selection.selectedCategory?.name ??
            categoryEmptyLabel ??
            t('reminderNoCategory')
          }`}
          options={selection.typeCategories.map((category) => ({
            id: category.id,
            name: category.name,
            color: category.color,
          }))}
          selectedId={selection.activeCategoryId}
          onSelect={(id) => onChange('categoryId', id)}
          allowEmpty={allowEmptyCategory}
          showColor
          searchable
          searchPlaceholder={t('reminderSearch')}
          noResultsLabel={t('reminderNoCategoriesFound')}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  fieldLabel: {
    marginTop: 18,
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
});
