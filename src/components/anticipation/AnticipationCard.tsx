import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Wallet from 'lucide-react-native/icons/wallet';
import { Card } from '@/components/ui/Card';
import { spacing, useColors } from '@/components/ui/theme';
import { useDashboard } from '@/context/DashboardContext';
import { useHomeCards } from '@/context/HomeCardsContext';
import { useCurrency } from '@/core/currency/useCurrency';
import type { TranslationKey } from '@/core/i18n/translations';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AnticipationEvent } from '@/core/services/anticipation';
import { useAnticipation } from '@/hooks/useAnticipation';

const MAX_VISIBLE = 3;

function eventIcon(event: AnticipationEvent) {
  switch (event.kind) {
    case 'DEPOSIT_MATURING':
      return CalendarClock;
    case 'LOW_BALANCE':
      return Wallet;
    case 'SPENDING_SPIKE':
      return TrendingUp;
    default:
      return TriangleAlert;
  }
}

export function AnticipationCard() {
  const colors = useColors();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { categories, accounts } = useDashboard();
  const { events, isLoading } = useAnticipation();
  const { isVisible } = useHomeCards();

  if (!isVisible('anticipations') || isLoading || events.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text }]}>
          {t('anticipationTitle')}
        </Text>
      </View>
      <Card variant="raised" shadowSize="sm" style={styles.card}>
        <View style={styles.cardContent}>
          {events.slice(0, MAX_VISIBLE).map((event, index) => {
            const Icon = eventIcon(event);
            const tone =
              event.severity === 'critical'
                ? colors.errorText
                : event.severity === 'warning'
                  ? colors.warningText
                  : colors.primaryText;
            const name = event.categoryId ?? event.accountId ?? '';
            const label =
              categories.find((category) => category.id === name)?.name ??
              accounts.find((account) => account.id === name)?.name ??
              name;
            const message = getMessage(event, t, format, label);

            return (
              <View
                key={event.id}
                style={[
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Icon size={18} color={tone} strokeWidth={2.2} />
                <Text
                  style={[styles.rowText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {message}
                </Text>
              </View>
            );
          })}
        </View>
        <PressableRow
          label={t('budgets')}
          onPress={() => router.push('/settings/budgets')}
        />
      </Card>
    </View>
  );
}

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;
type Format = (value: number, options?: { showCurrency?: boolean }) => string;

function getMessage(
  event: AnticipationEvent,
  t: Translate,
  format: Format,
  name: string
): string {
  switch (event.kind) {
    case 'BUDGET_WARNING':
      return t('anticipationBudgetWarning', {
        name,
        percent: Math.round((event.ratio ?? 0) * 100),
      });
    case 'BUDGET_EXCEEDED':
      return t('anticipationBudgetExceeded', { name });
    case 'DEPOSIT_MATURING':
      return t('anticipationDepositMaturing', { days: event.days ?? 0, name });
    case 'LOW_BALANCE':
      return t('anticipationLowBalance', { name });
    case 'SPENDING_SPIKE':
      return t('anticipationSpendingSpike', {
        amount: format(event.amount ?? 0, { showCurrency: false }),
        limit: format(event.limit ?? 0, { showCurrency: false }),
      });
  }
}

function PressableRow({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.link,
        { borderTopColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.linkText, { color: colors.primaryText }]}>{label}</Text>
      <ChevronRight size={15} color={colors.primaryText} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  headerRow: { marginBottom: spacing.sm },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  card: { paddingHorizontal: spacing.md },
  cardContent: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1, fontSize: 13, fontWeight: '600' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  linkText: { fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
