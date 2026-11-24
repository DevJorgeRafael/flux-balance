import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Pencil from 'lucide-react-native/icons/pencil';
import Settings from 'lucide-react-native/icons/settings';
import Trash from 'lucide-react-native/icons/trash';
import { appAlert, appConfirm } from '@/components/ui/alert/appAlert';
import { Button } from '@/components/ui/atoms/Button';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/ui/SelectField';
import { SectionLabel } from '@/components/settings/SectionLabel';
import { spacing, useColors, useInsets } from '@/components/ui/theme';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { useCurrency } from '@/core/currency/useCurrency';
import { useDashboard } from '@/context/DashboardContext';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import type { Budget } from '@/core/models/budget';
import { parseAmountInput } from '@/core/utils/money';
import {
  SqliteBudgetRepository,
} from '@/infrastructure/repositories';
import { useAnticipation } from '@/hooks/useAnticipation';

const repository = new SqliteBudgetRepository();

export default function BudgetsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const { currency, format, locale } = useCurrency();
  const { categories } = useDashboard();
  const { budgets, yearMonth, reload } = useAnticipation();
  const decimals = getCurrencyDecimals(currency);
  const expenseCategories = categories.filter((category) => category.type === 'EXPENSE');

  const [editing, setEditing] = useState<Budget | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const openModal = (budget: Budget | null) => {
    setEditing(budget);
    setCategoryId(budget?.categoryId ?? expenseCategories[0]?.id ?? '');
    setAmount(
      budget ? format(budget.limitAmount, { showCurrency: false }) : ''
    );
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const parsed = parseAmountInput(amount, locale, decimals);
    if (!parsed.ok || !categoryId.trim()) {
      void appAlert({
        type: 'error',
        title: t('error'),
        message: parsed.ok
          ? t('reminderNoCategory')
          : t(getAmountInputErrorKey(parsed.error), { decimals }),
        buttons: [{ text: t('accept') }],
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await repository.update(editing.id, { limitAmount: parsed.value });
      } else {
        await repository.create({
          categoryId,
          type: 'EXPENSE',
          yearMonth,
          limitAmount: parsed.value,
        });
      }
      setIsModalVisible(false);
      reload();
    } catch (error) {
      console.error('Error guardando el presupuesto:', error);
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

  const handleDelete = async (budget: Budget) => {
    const confirmed = await appConfirm({
      title: t('deleteBudget'),
      message: categories.find((category) => category.id === budget.categoryId)?.name ?? '',
      confirmText: t('delete'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    await repository.delete(budget.id);
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
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('budgets')}
        </Text>
        <Pressable
          onPress={() => router.push('/settings/home')}
          accessibilityRole="button"
          accessibilityLabel={t('customizeHome')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Settings size={20} color={colors.text} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textLight }]}>
          {t('budgetsIntro')}
        </Text>

        <SectionLabel>{yearMonth}</SectionLabel>
        <Card style={styles.card}>
          {budgets.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textLight }]}>
              {t('noBudgets')}
            </Text>
          ) : (
            budgets.map((budget, index) => {
              const category = categories.find((item) => item.id === budget.categoryId);
              return (
                <View
                  key={budget.id}
                  style={[
                    styles.row,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>
                      {category?.name ?? budget.categoryId}
                    </Text>
                    <Text style={[styles.rowValue, { color: colors.textLight }]}>
                      {format(budget.limitAmount, { showCurrency: true })}
                    </Text>
                  </View>
                  <IconButton
                    icon={<Pencil size={18} color={colors.text} strokeWidth={2.2} />}
                    accessibilityLabel={t('editBudget')}
                    onPress={() => openModal(budget)}
                  />
                  <IconButton
                    icon={<Trash size={18} color={colors.errorText} strokeWidth={2.2} />}
                    accessibilityLabel={t('deleteBudget')}
                    onPress={() => handleDelete(budget)}
                  />
                </View>
              );
            })
          )}
        </Card>

        <Button
          title={t('newBudget')}
          onPress={() => openModal(null)}
          disabled={expenseCategories.length === 0}
        />
      </ScrollView>

      <BottomSheetModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        maxHeight="60%"
      >
        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.text }]}>
            {editing ? t('editBudget') : t('newBudget')}
          </Text>
          <Text style={[styles.formLabel, { color: colors.textLight }]}>
            {t('category')}
          </Text>
          <SelectField
            label={t('category')}
            title={t('category')}
            emptyLabel={t('reminderNoCategory')}
            accessibilityLabel={`${t('category')}: ${
              expenseCategories.find((item) => item.id === categoryId)?.name ?? ''
            }`}
            options={expenseCategories.map((item) => ({
              id: item.id,
              name: item.name,
              color: item.color,
            }))}
            selectedId={categoryId}
            onSelect={setCategoryId}
            allowEmpty={false}
            showColor
            searchable
            searchPlaceholder={t('reminderSearch')}
            noResultsLabel={t('reminderNoCategoriesFound')}
          />
          <Text style={[styles.formLabel, { color: colors.textLight }]}>
            {t('budgetLimit')} ({currency})
          </Text>
          <TextInput
    style={[
      styles.amountInput,
      {
        color: colors.text,
        backgroundColor: colors.inputBackground,
      },
    ]}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder={format(0, { showCurrency: false })}
            placeholderTextColor={colors.textLight}
          />
          <Button
            title={t('accept')}
            onPress={() => void handleSave()}
            disabled={isSaving}
            loading={isSaving}
          />
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '800' },
  intro: { fontSize: 13 },
  card: { paddingVertical: spacing.sm },
  empty: { fontSize: 13, padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700' },
  rowValue: { fontSize: 12 },
  form: { gap: spacing.md, paddingBottom: spacing.lg },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  amountInput: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
  },
});
