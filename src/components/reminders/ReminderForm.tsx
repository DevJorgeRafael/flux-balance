import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  findNodeHandle,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appAlert } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { useColors, useInsets } from '@/components/ui/theme';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import {
  MAX_AMOUNT,
  MAX_REMINDER_TITLE_LENGTH,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '@/core/constants/inputLimits';
import { useCurrency } from '@/core/currency/useCurrency';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { ReminderType } from '@/core/models/reminder';
import {
  isValidReminderDate,
  isValidReminderTime,
} from '@/core/services/reminder-schedule';
import { parseReminderAmount } from '@/core/services/reminder-amount';
import { useDashboard } from '@/context/DashboardContext';
import { useReminderNotifications } from '@/context/ReminderNotificationsProvider';
import {
  ReminderValidationError,
  SqliteReminderRepository,
} from '@/infrastructure/repositories';
import {
  ReminderFormFields,
  type ReminderFormValues,
} from './ReminderFormFields';
import { ReminderScreenHeader } from './ReminderScreenHeader';

const reminderRepo = new SqliteReminderRepository();

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function defaultFormValues(): ReminderFormValues {
  const next = new Date(Date.now() + 60 * 60 * 1000);
  next.setMinutes(0, 0, 0);

  return {
    title: '',
    description: '',
    amount: '',
    type: 'EXPENSE',
    accountId: '',
    categoryId: '',
    recurrence: 'MONTHLY',
    startDate: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
    time: `${pad(next.getHours())}:00`,
  };
}

export function ReminderForm() {
  const rawParams = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const colors = useColors();
  const insets = useInsets();
  const { currency, format, locale } = useCurrency();
  const { t } = useTranslation();
  const { accounts, categories } = useDashboard();
  const { refreshReminderNotifications } = useReminderNotifications();

  const [values, setValues] = useState<ReminderFormValues>(defaultFormValues);
  const [hasReminder, setHasReminder] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isReady, setIsReady] = useState(!id);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const submittingRef = useRef(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const handleFieldFocus = (
    input: React.ComponentRef<typeof TextInput> | null
  ) => {
    if (!input) return;
    const node = findNodeHandle(input);
    if (node == null) return;
    scrollRef.current
      ?.getScrollResponder()
      .scrollResponderScrollNativeHandleToKeyboard(
        node,
        footerHeight + 16,
        true
      );
  };

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    const load = async () => {
      try {
        const reminder = await reminderRepo.getById(id);
        if (isCancelled) return;
        if (!reminder) {
          setNotFound(true);
          return;
        }

        setValues({
          title: reminder.title,
          description: reminder.description ?? '',
          amount:
            reminder.amount != null
              ? format(reminder.amount, { showCurrency: false })
              : '',
          type: reminder.type,
          accountId: reminder.accountId ?? '',
          categoryId: reminder.categoryId ?? '',
          recurrence: reminder.recurrence,
          startDate: reminder.startDate,
          time: reminder.time,
        });
        setIsArchived(reminder.isArchived);
        setHasReminder(true);
      } catch (error) {
        console.error('Error loading reminder:', error);
        if (!isCancelled) setNotFound(true);
      } finally {
        if (!isCancelled) setIsReady(true);
      }
    };

    void load();
    return () => {
      isCancelled = true;
    };
  }, [format, id]);

  const updateField = <K extends keyof ReminderFormValues>(
    key: K,
    value: ReminderFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleTypeChange = (type: ReminderType) => {
    setValues((current) => ({
      ...current,
      type,
      categoryId: categories.some(
        (category) =>
          category.id === current.categoryId && category.type === type
      )
        ? current.categoryId
        : '',
    }));
  };

  const showPermissionAlert = () => {
    void appAlert({
      type: 'warning',
      title: t('reminderNotificationsDisabledTitle'),
      message: t('reminderNotificationsDisabledMessage'),
      buttons: [
        { text: t('notNow'), style: 'cancel' },
        {
          text: t('openSettings'),
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ],
    });
  };

  const showSaveError = (error: unknown) => {
    let message = t('errorSavingReminder');
    if (error instanceof ReminderValidationError) {
      switch (error.code) {
        case 'TITLE_REQUIRED':
          message = t('reminderTitleRequired');
          break;
        case 'TITLE_TOO_LONG':
          message = t('reminderTitleTooLong', {
            max: MAX_REMINDER_TITLE_LENGTH,
          });
          break;
        case 'DESCRIPTION_TOO_LONG':
          message = t('reminderDescriptionTooLong', {
            max: MAX_TRANSACTION_DESCRIPTION_LENGTH,
          });
          break;
        case 'AMOUNT_INVALID':
          message = t('reminderAmountInvalid');
          break;
        case 'TIME_INVALID':
          message = t('reminderTimeInvalid');
          break;
        case 'START_DATE_INVALID':
          message = t('reminderDateInvalid');
          break;
        case 'START_DATE_IN_PAST':
          message = t('reminderDateInPast');
          break;
      }
    }

    void appAlert({
      type: 'error',
      title: t('error'),
      message,
      buttons: [{ text: t('accept') }],
    });
  };

  const handleSave = async () => {
    if (submittingRef.current || isSaving || isArchiving) return;

    const decimals = getCurrencyDecimals(currency);
    const amountResult = parseReminderAmount(values.amount, locale, decimals);
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
    const parsedAmount = amountResult.value;

    if (!isValidReminderDate(values.startDate)) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('reminderDateInvalid'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }
    if (!isValidReminderTime(values.time)) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('reminderTimeInvalid'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    const payload = {
      title: values.title,
      type: values.type,
      description: values.description.trim() || null,
      amount: parsedAmount,
      accountId: values.accountId || null,
      categoryId: values.categoryId || null,
      recurrence: values.recurrence,
      startDate: values.startDate,
      time: values.time,
    };

    submittingRef.current = true;
    try {
      setIsSaving(true);
      const saved = hasReminder
        ? await reminderRepo.update(id!, payload)
        : await reminderRepo.create(payload);
      const permission = await refreshReminderNotifications(saved.id, {
        requestPermission: !hasReminder,
      });
      router.back();
      if (permission !== 'granted') {
        showPermissionAlert();
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
      showSaveError(error);
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!hasReminder || submittingRef.current || isSaving || isArchiving) {
      return;
    }

    submittingRef.current = true;
    try {
      setIsArchiving(true);
      await reminderRepo.update(id!, { isArchived: !isArchived });
      await refreshReminderNotifications(id);
      router.back();
    } catch (error) {
      console.error('Error archiving reminder:', error);
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('errorArchivingReminder'),
        buttons: [{ text: t('accept') }],
      });
    } finally {
      submittingRef.current = false;
      setIsArchiving(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ReminderScreenHeader
        title={hasReminder ? t('editReminder') : t('newReminder')}
        onBack={() => router.back()}
      />

      {notFound ? (
        <View style={styles.centered}>
          <Text style={[styles.centeredText, { color: colors.textLight }]}>
            {t('reminderNotFound')}
          </Text>
        </View>
      ) : !isReady ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <ReminderFormFields
              values={values}
              onChange={updateField}
              onTypeChange={handleTypeChange}
              accounts={accounts}
              categories={categories}
              onFieldFocus={handleFieldFocus}
            />

            {hasReminder ? (
              <View style={styles.archiveAction}>
                <Button
                  title={t(isArchived ? 'unarchiveReminder' : 'archiveReminder')}
                  onPress={handleArchive}
                  loading={isArchiving}
                  disabled={isSaving}
                  variant="outline"
                  style={styles.actionButton}
                />
              </View>
            ) : null}
          </ScrollView>

          <View
            onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <Button
              title={t('saveReminder')}
              onPress={handleSave}
              loading={isSaving}
              disabled={isArchiving}
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
  archiveAction: {
    marginTop: 28,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
