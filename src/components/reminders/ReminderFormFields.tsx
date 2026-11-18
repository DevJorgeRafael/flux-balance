import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { OptionChips } from '@/components/ui/OptionChips';
import { SelectField } from '@/components/ui/SelectField';
import { useColors } from '@/components/ui/theme';
import { SegmentedTypeControl } from '@/components/ui/SegmentedTypeControl';
import { MAX_ACCOUNT_CHIPS } from '@/core/constants/formOptions';
import {
  MAX_REMINDER_TITLE_LENGTH,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '@/core/constants/inputLimits';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Account } from '@/core/models/account';
import type { Category } from '@/core/models/category';
import type {
  ReminderRecurrence,
  ReminderType,
} from '@/core/models/reminder';
import { ReminderScheduleFields } from './ReminderScheduleFields';
import { REMINDER_RECURRENCE_LABELS } from './reminderLabels';

export interface ReminderFormValues {
  title: string;
  description: string;
  amount: string;
  type: ReminderType;
  accountId: string;
  categoryId: string;
  recurrence: ReminderRecurrence;
  startDate: string;
  time: string;
}

interface ReminderFormFieldsProps {
  values: ReminderFormValues;
  onChange: <K extends keyof ReminderFormValues>(
    key: K,
    value: ReminderFormValues[K]
  ) => void;
  onTypeChange: (type: ReminderType) => void;
  accounts: Account[];
  categories: Category[];
  onFieldFocus?: (
    input: React.ComponentRef<typeof TextInput> | null
  ) => void;
}

const RECURRENCES: readonly ReminderRecurrence[] = [
  'ONCE',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
];

export function ReminderFormFields({
  values,
  onChange,
  onTypeChange,
  accounts,
  categories,
  onFieldFocus,
}: ReminderFormFieldsProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const titleRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const descriptionRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const amountRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const typeCategories = categories.filter(
    (category) => category.type === values.type
  );
  const selectedAccount = accounts.find(
    (account) => account.id === values.accountId
  );
  const selectedCategory = typeCategories.find(
    (category) => category.id === values.categoryId
  );
  const useAccountChips = accounts.length <= MAX_ACCOUNT_CHIPS;

  const handleFocus = (
    input: React.RefObject<React.ComponentRef<typeof TextInput> | null>
  ) => {
    onFieldFocus?.(input.current);
  };

  return (
    <>
      <Text style={[styles.label, { color: colors.textLight }]}>
        {t('reminderType')}
      </Text>
      <SegmentedTypeControl
        value={values.type}
        options={[
          {
            value: 'EXPENSE',
            label: t('addExpense'),
            color: colors.errorSoft,
            textColor: colors.errorText,
          },
          {
            value: 'INCOME',
            label: t('addIncome'),
            color: colors.successSoft,
            textColor: colors.successText,
          },
        ]}
        onChange={onTypeChange}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('reminderTitle')}
      </Text>
      <TextInput
        ref={titleRef}
        value={values.title}
        onChangeText={(value) => onChange('title', value)}
        onFocus={() => handleFocus(titleRef)}
        onSubmitEditing={() => descriptionRef.current?.focus()}
        placeholder={t('reminderTitlePlaceholder')}
        placeholderTextColor={colors.textLight}
        maxLength={MAX_REMINDER_TITLE_LENGTH}
        returnKeyType="next"
        submitBehavior="submit"
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('description')}
      </Text>
      <TextInput
        ref={descriptionRef}
        value={values.description}
        onChangeText={(value) => onChange('description', value)}
        onFocus={() => handleFocus(descriptionRef)}
        onSubmitEditing={() => amountRef.current?.focus()}
        placeholder={t('reminderDescriptionPlaceholder')}
        placeholderTextColor={colors.textLight}
        maxLength={MAX_TRANSACTION_DESCRIPTION_LENGTH}
        returnKeyType="next"
        submitBehavior="submit"
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('reminderAmountOptional')}
      </Text>
      <TextInput
        ref={amountRef}
        value={values.amount}
        onChangeText={(value) => onChange('amount', value)}
        onFocus={() => handleFocus(amountRef)}
        onSubmitEditing={() => amountRef.current?.blur()}
        placeholder={t('reminderAmountPlaceholder')}
        placeholderTextColor={colors.textLight}
        keyboardType="decimal-pad"
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('recurrence')}
      </Text>
      <OptionChips
        options={RECURRENCES.map((option) => ({
          id: option,
          label: t(REMINDER_RECURRENCE_LABELS[option]),
        }))}
        selectedId={values.recurrence}
        onSelect={(id) => onChange('recurrence', id as ReminderRecurrence)}
      />

      <ReminderScheduleFields
        startDate={values.startDate}
        time={values.time}
        onChange={(key, value) => onChange(key, value)}
      />

      {accounts.length > 0 ? (
        useAccountChips ? (
          <>
            <Text
              style={[
                styles.label,
                styles.fieldLabel,
                { color: colors.textLight },
              ]}
            >
              {t('reminderAccountOptional')}
            </Text>
            <OptionChips
              options={accounts.map((account) => ({
                id: account.id,
                label: account.name,
              }))}
              selectedId={values.accountId}
              onSelect={(id) => onChange('accountId', id)}
              allowDeselect
            />
          </>
        ) : (
          <SelectField
            label={t('reminderAccountOptional')}
            title={t('reminderAccountSheetTitle')}
            emptyLabel={t('reminderNoAccount')}
            accessibilityLabel={`${t('account')}: ${
              selectedAccount?.name ?? t('reminderNoAccount')
            }`}
            options={accounts.map((account) => ({
              id: account.id,
              name: account.name,
            }))}
            selectedId={values.accountId}
            onSelect={(id) => onChange('accountId', id)}
          />
        )
      ) : null}

      <SelectField
        label={t('reminderCategoryOptional')}
        title={t('reminderCategorySheetTitle')}
        emptyLabel={t('reminderNoCategory')}
        accessibilityLabel={`${t('category')}: ${
          selectedCategory?.name ?? t('reminderNoCategory')
        }`}
        options={typeCategories.map((category) => ({
          id: category.id,
          name: category.name,
          color: category.color,
        }))}
        selectedId={values.categoryId}
        onSelect={(id) => onChange('categoryId', id)}
        showColor
        searchable
        searchPlaceholder={t('reminderSearch')}
        noResultsLabel={t('reminderNoCategoriesFound')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fieldLabel: {
    marginTop: 18,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});
