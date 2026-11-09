import React from 'react';
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
}: ReminderFormFieldsProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const typeCategories = categories.filter(
    (category) => category.type === values.type
  );

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
        value={values.title}
        onChangeText={(value) => onChange('title', value)}
        placeholder={t('reminderTitlePlaceholder')}
        placeholderTextColor={colors.textLight}
        maxLength={MAX_REMINDER_TITLE_LENGTH}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('description')}
      </Text>
      <TextInput
        value={values.description}
        onChangeText={(value) => onChange('description', value)}
        placeholder={t('reminderDescriptionPlaceholder')}
        placeholderTextColor={colors.textLight}
        maxLength={MAX_TRANSACTION_DESCRIPTION_LENGTH}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
      />

      <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
        {t('reminderAmountOptional')}
      </Text>
      <TextInput
        value={values.amount}
        onChangeText={(value) => onChange('amount', value)}
        placeholder={t('reminderAmountPlaceholder')}
        placeholderTextColor={colors.textLight}
        keyboardType="decimal-pad"
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
            value={values.startDate}
            onChangeText={(value) => onChange('startDate', value)}
            placeholder={t('datePlaceholder')}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
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
            value={values.time}
            onChangeText={(value) => onChange('time', value)}
            placeholder={t('timePlaceholder')}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.inputBackground },
            ]}
          />
        </View>
      </View>

      {accounts.length > 0 ? (
        <>
          <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
            {`${t('account')} (${t('optional')})`}
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
      ) : null}

      {typeCategories.length > 0 ? (
        <>
          <Text style={[styles.label, styles.fieldLabel, { color: colors.textLight }]}>
            {`${t('category')} (${t('optional')})`}
          </Text>
          <View style={styles.chips}>
            {typeCategories.map((category) =>
              renderChip(
                category.id,
                category.name,
                values.categoryId === category.id,
                () =>
                  onChange(
                    'categoryId',
                    values.categoryId === category.id ? '' : category.id
                  )
              )
            )}
          </View>
        </>
      ) : null}
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
