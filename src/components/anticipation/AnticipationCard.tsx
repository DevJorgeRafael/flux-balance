import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Wallet from 'lucide-react-native/icons/wallet';
import { Card } from '@/components/ui/Card';
import { radius, spacing, useColors } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import type { TranslationKey } from '@/core/i18n/translations';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AnticipationEvent } from '@/core/services/anticipation';
import { useDashboard } from '@/context/DashboardContext';
import { useAnticipation } from '@/hooks/useAnticipation';
import { useHomeCards } from '@/store/homeCardsStore';

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
      <Text style={[styles.heading, { color: colors.text }]}>
        {t('anticipationTitle')} · {events.length}
      </Text>

      <Card
        variant="raised"
        shadowSize="sm"
        style={styles.card}
        onPress={() => router.push('/settings/budgets')}
        accessibilityLabel={t('anticipationTitle')}
      >
        {events.slice(0, MAX_VISIBLE).map((event, index) => {
          const Icon = eventIcon(event);
          const severityColor =
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
          const [lead, ...detail] = getMessage(event, t, format, label).split(' · ');

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
              <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <Icon size={18} color={colors.primaryText} strokeWidth={2.2} />
              </View>
              <Text style={[styles.rowText, { color: colors.textLight }]} numberOfLines={2}>
                <Text style={[styles.lead, { color: colors.text }]}>{lead}</Text>
                {detail.length > 0 ? ` · ${detail.join(' · ')}` : null}
              </Text>
              <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
            </View>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: spacing.sm },
  card: { paddingHorizontal: spacing.md },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 13, fontWeight: '600' },
  lead: { fontWeight: '800' },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
});
