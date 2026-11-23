import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Target from 'lucide-react-native/icons/target';
import { Card } from '@/components/ui/Card';
import { spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useDashboard } from '@/context/DashboardContext';
import { useHomeCards } from '@/context/HomeCardsContext';
import { useTranslation } from '@/core/i18n/useTranslation';
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

  return (
    <View style={styles.section}>
      <Text
        onPress={() => router.push('/settings/goals')}
        accessibilityRole="link"
        style={[styles.heading, { color: colors.text }]}
      >
        {t('goals')}
      </Text>
      <Card
        variant="raised"
        shadowSize="sm"
        style={styles.card}
        onPress={() => router.push('/settings/goals')}
        accessibilityLabel={t('goals')}
      >
        <View style={styles.row}>
          <Target size={18} color={colors.primaryText} strokeWidth={2.2} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={[styles.detail, { color: colors.textLight }]}>
              {progress.reached
                ? t('goalReached')
                : t('goalRemaining', {
                    amount: format(progress.remaining, { showCurrency: true }),
                  })}
            </Text>
          </View>
        </View>
        <View
          style={[styles.track, { backgroundColor: colors.controlTrack }]}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: colors.primary,
                width: `${progress.ratio * 100}%`,
              },
            ]}
          />
        </View>
        {!progress.reached ? (
          <Text style={[styles.footer, { color: colors.primaryText }]}>
            {t('goalMonthly', {
              amount: format(progress.monthlyRequired, { showCurrency: false }),
            })}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: spacing.sm },
  card: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  detail: { fontSize: 12 },
  track: { height: 6, borderRadius: 3, marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  footer: { fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
});
