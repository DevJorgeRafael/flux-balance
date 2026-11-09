import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/components/ui/theme';
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
import { ReminderSelectField } from './ReminderSelectField';
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

const MAX_ACCOUNT_CHIPS = 4;

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
  const startDateRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const timeRef = useRef<React.ComponentRef<typeof TextInput>>(null);
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

  const renderChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.inputBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? colors.onPrimary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <>
      <Text style={[styles.label, { color: colors.textLight }]}>
        {t('reminderType')}
      </Text>
      <View
        style={[styles.segmented, { backgroundColor: colors.controlTrack }]}
      >
        {(['EXPENSE', 'INCOME'] as const).map((option) => {
          const selected = values.type === option;
          const isIncome = option === 'INCOME';
          return (
            <Pressable
              key={option}
              onPress={() => onTypeChange(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.segment,
                selected && {
                  backgroundColor: isIncome ? colors.success : colors.error,
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: selected
                      ? isIncome
                        ? colors.onSuccess
                        : colors.onError
                      : colors.textLight,
                  },
                ]}
              >
                {t(isIncome ? 'addIncome' : 'addExpense')}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        onSubmitEditing={() => startDateRef.current?.focus()}
        placeholder={t('reminderAmountPlaceholder')}
        placeholderTextColor={colors.textLight}
        keyboardType="decimal-pad"
        returnKeyType="next"
        submitBehavior="submit"
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('recurrence')}
      </Text>
      <View style={styles.chips}>
        {RECURRENCES.map((option) =>
          renderChip(
            option,
            t(REMINDER_RECURRENCE_LABELS[option]),
            values.recurrence === option,
            () => onChange('recurrence', option)
          )
        )}
      </View>

      <View style={styles.dateTimeRow}>
        <View style={styles.flex}>
          <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
            {t('startDate')}
          </Text>
          <TextInput
            ref={startDateRef}
            value={values.startDate}
            onChangeText={(value) => onChange('startDate', value)}
            onFocus={() => handleFocus(startDateRef)}
            onSubmitEditing={() => timeRef.current?.focus()}
            placeholder={t('datePlaceholder')}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            submitBehavior="submit"
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.inputBackground },
            ]}
          />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
            {t('startTime')}
          </Text>
          <TextInput
            ref={timeRef}
            value={values.time}
            onChangeText={(value) => onChange('time', value)}
            onFocus={() => handleFocus(timeRef)}
            onSubmitEditing={() => timeRef.current?.blur()}
            placeholder={t('timePlaceholder')}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.inputBackground },
            ]}
          />
        </View>
      </View>

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
            <View style={styles.chips}>
              {accounts.map((account) =>
                renderChip(
                  account.id,
                  account.name,
                  values.accountId === account.id,
                  () =>
                    onChange(
                      'accountId',
                      values.accountId === account.id ? '' : account.id
                    )
                )
              )}
            </View>
          </>
        ) : (
          <ReminderSelectField
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

      <ReminderSelectField
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
  flex: {
    flex: 1,
  },
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
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
