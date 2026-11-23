import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Pencil from 'lucide-react-native/icons/pencil';
import Trash from 'lucide-react-native/icons/trash';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/SelectField';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { DatePicker } from '@/components/ui/organisms/DatePicker';
import { SectionLabel } from '@/components/settings/SectionLabel';
import { spacing, useColors, useInsets } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useDashboard } from '@/context/DashboardContext';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Goal } from '@/core/models/goal';
import { getGoalProgress } from '@/core/services/financial-twin';
import {
  localDateFromReminderDate,
  reminderDateFromLocalDate,
} from '@/core/services/reminder-schedule';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { parseAmountInput } from '@/core/utils/money';
import { SqliteGoalRepository } from '@/infrastructure/repositories';

const repository = new SqliteGoalRepository();

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { language, t } = useTranslation();
  const { currency, format, locale } = useCurrency();
  const { accounts } = useDashboard();
  const decimals = getCurrencyDecimals(currency);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());

  const openDatePicker = () => {
    Keyboard.dismiss();
    setDraftDate(localDateFromReminderDate(deadline) ?? new Date());
    setIsDateSheetOpen(true);
  };

  const confirmDate = () => {
    setDeadline(reminderDateFromLocalDate(draftDate));
    setIsDateSheetOpen(false);
  };

  const reload = useCallback(() => {
    repository
      .getAll()
      .then(setGoals)
      .catch((error) => console.error('Error cargando metas:', error));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const openModal = (goal: Goal | null) => {
    setEditing(goal);
    setName(goal?.name ?? '');
    setAmount(goal ? format(goal.targetAmount, { showCurrency: false }) : '');
    setDeadline(goal?.deadline ?? '');
    setAccountId(goal?.accountId ?? '');
    setVisible(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const parsed = parseAmountInput(amount, locale, decimals);
    if (!parsed.ok || !name.trim() || !deadline) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: t('transferInvalidInput'),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        targetAmount: parsed.value,
        deadline,
        accountId: accountId || null,
      };
      if (editing) await repository.update(editing.id, data);
      else await repository.create(data);
      setVisible(false);
      reload();
    } catch (error) {
      console.error('Error guardando la meta:', error);
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

  const handleDelete = async (goal: Goal) => {
    const confirmed = await appConfirm({
      title: t('deleteGoal'),
      message: goal.name,
      confirmText: t('delete'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    await repository.delete(goal.id);
    reload();
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />}
          accessibilityLabel={t('goBack')}
          onPress={() => router.back()}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('goals')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textLight }]}>
          {t('goalsIntro')}
        </Text>

        <Pressable
          onPress={() => router.push('/settings/simulator')}
          accessibilityRole="link"
          accessibilityLabel={t('simulator')}
          style={({ pressed }) => [
            styles.simulatorLink,
            { backgroundColor: colors.primarySoft },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.simulatorText, { color: colors.primaryText }]}>
            {t('simulator')}
          </Text>
        </Pressable>

        <SectionLabel>{t('goals')}</SectionLabel>
        <Card style={styles.card}>
          {goals.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textLight }]}>
              {t('noGoals')}
            </Text>
          ) : (
            goals.map((goal, index) => {
              const account = accounts.find((item) => item.id === goal.accountId);
              const progress = getGoalProgress({
                targetAmount: goal.targetAmount,
                deadline: goal.deadline,
                currentBalance: account?.balance ?? 0,
                today: new Date(),
              });
              return (
                <View
                  key={goal.id}
                  style={[
                    styles.goalRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalName, { color: colors.text }]}>
                      {goal.name}
                    </Text>
                    <Text style={[styles.goalDetail, { color: colors.textLight }]}>
                      {format(goal.targetAmount, { showCurrency: true })} · {goal.deadline}
                    </Text>
                    <Text style={[styles.goalDetail, { color: colors.primaryText }]}>
                      {progress.reached
                        ? t('goalReached')
                        : t('goalMonthly', {
                            amount: format(progress.monthlyRequired, {
                              showCurrency: false,
                            }),
                          })}
                    </Text>
                    <View
                      style={[
                        styles.progressTrack,
                        { backgroundColor: colors.controlTrack },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${progress.ratio * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <IconButton
                    icon={<Pencil size={18} color={colors.text} strokeWidth={2.2} />}
                    accessibilityLabel={t('editGoal')}
                    onPress={() => openModal(goal)}
                  />
                  <IconButton
                    icon={<Trash size={18} color={colors.errorText} strokeWidth={2.2} />}
                    accessibilityLabel={t('deleteGoal')}
                    onPress={() => handleDelete(goal)}
                  />
                </View>
              );
            })
          )}
        </Card>

        <Button title={t('newGoal')} onPress={() => openModal(null)} />
      </ScrollView>

      <BottomSheetModal
        visible={visible}
        onClose={() => setVisible(false)}
        maxHeight="80%"
      >
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {editing ? t('editGoal') : t('newGoal')}
          </Text>
          <Text style={[styles.formLabel, { color: colors.textLight }]}>
            {t('goalName')}
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
            value={name}
            onChangeText={setName}
            placeholder={t('goalName')}
            placeholderTextColor={colors.textLight}
          />
          <Text style={[styles.formLabel, { color: colors.textLight }]}>
            {t('goalTarget')} ({currency})
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder={format(0, { showCurrency: false })}
            placeholderTextColor={colors.textLight}
          />
          <Text style={[styles.formLabel, { color: colors.textLight }]}>
            {t('goalDeadline')}
          </Text>
          <Pressable
            onPress={openDatePicker}
            accessibilityRole="button"
            accessibilityLabel={`${t('goalDeadline')}: ${deadline || t('datePlaceholder')}`}
            accessibilityHint={t('selectDate')}
            style={({ pressed }) => [
              styles.dateField,
              { backgroundColor: colors.inputBackground },
              pressed && styles.pressed,
            ]}
          >
            <CalendarDays size={18} color={colors.textLight} strokeWidth={2.2} />
            <Text
              style={[
                styles.dateText,
                { color: deadline ? colors.text : colors.textLight },
              ]}
            >
              {deadline || t('datePlaceholder')}
            </Text>
          </Pressable>
          <SelectField
            label={t('goalAccount')}
            title={t('goalAccount')}
            emptyLabel={t('goalNoAccount')}
            accessibilityLabel={`${t('goalAccount')}: ${
              accounts.find((item) => item.id === accountId)?.name ?? t('goalNoAccount')
            }`}
            options={accounts.map((item) => ({ id: item.id, name: item.name }))}
            selectedId={accountId}
            onSelect={setAccountId}
            allowEmpty
          />
          <Button
            title={t('accept')}
            onPress={() => void handleSave()}
            disabled={isSaving}
            loading={isSaving}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        maxHeight="90%"
        bottomPaddingExtra={16}
      >
        <View style={styles.dateSheetHeader}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {t('selectDate')}
          </Text>
        </View>
        <DatePicker
          value={draftDate}
          onChange={setDraftDate}
          minDate={new Date()}
          firstDayOfWeek={language === 'es' ? 1 : 0}
        />
        <Button title={t('accept')} onPress={confirmDate} />
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: 13 },
  simulatorLink: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatorText: { fontSize: 13, fontWeight: '800' },
  card: { paddingHorizontal: spacing.md },
  empty: { fontSize: 13, paddingVertical: spacing.md },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 14, fontWeight: '700' },
  goalDetail: { fontSize: 12 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  dateField: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  dateText: { fontSize: 16, fontWeight: '600' },
  dateSheetHeader: { marginBottom: spacing.md },
  formTitle: { fontSize: 20, fontWeight: '800' },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
});
