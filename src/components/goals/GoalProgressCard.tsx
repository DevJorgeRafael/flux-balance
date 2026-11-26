import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useDashboard } from '@/context/DashboardContext';
import { useHomeCards } from '@/store/homeCardsStore';
import { useTranslation } from '@/core/i18n/useTranslation';
import { GoalProgressRing } from '@/components/goals/GoalProgressRing';
import type { Goal } from '@/core/models/goal';
import { getGoalProgress } from '@/core/services/financial-twin';
import { SqliteGoalRepository } from '@/infrastructure/repositories';

const repository = new SqliteGoalRepository();

export function GoalProgressCard() {
  const colors = useColors();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { accounts } = useDashboard();
  const [goal, setGoal] = useState<Goal | null>(null);
  const { isVisible } = useHomeCards();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      repository
        .getAll()
        .then((goals) => {
          if (!cancelled) setGoal(goals[0] ?? null);
        })
        .catch((error) => console.error('Error cargando metas:', error));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!isVisible('goals') || !goal) return null;

  const account = accounts.find((item) => item.id === goal.accountId);
  const progress = getGoalProgress({
    targetAmount: goal.targetAmount,
    deadline: goal.deadline,
    currentBalance: account?.balance ?? 0,
    today: new Date(),
  });
  const monthly = `${format(progress.monthlyRequired, { showCurrency: true })}`;
  const secondary = progress.reached
    ? null
    : `${t('goalMonthlyShort', { amount: monthly })} · ${t('goalDaysLeftShort', {
        count: progress.daysLeft,
      })}`;

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('goals')}</Text>
      <Card
        variant="raised"
        shadowSize="sm"
        style={styles.card}
        onPress={() => router.push('/settings/goals')}
        accessibilityLabel={t('goals')}
      >
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={[styles.detail, { color: colors.primaryText }]}>
              {progress.reached
                ? t('goalReached')
                : t('goalRemaining', {
                    amount: format(progress.remaining, { showCurrency: true }),
                  })}
            </Text>
            {secondary ? (
              <Text style={[styles.secondary, { color: colors.textLight }]}>
                {secondary}
              </Text>
            ) : null}
          </View>

          <GoalProgressRing ratio={progress.ratio} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: spacing.sm },
  card: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '800' },
  detail: { fontSize: 13, fontWeight: '700' },
  secondary: { fontSize: 12, fontWeight: '600' },
});
