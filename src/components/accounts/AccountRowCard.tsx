import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CreditCard from 'lucide-react-native/icons/credit-card';
import type { Account, FixedTermDeposit } from '@/core/models/account';
import { calculateDailyProjection } from '@/core/services/interest-calculator';
import { useCurrency } from '@/core/currency/useCurrency';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountRowCardProps {
  account: Account;
  movementCount: number;
  isBalanceVisible: boolean;
  onPress: () => void;
}

interface FixedTermTimeline {
  daysLeft: number;
  progress: number;
}

const DAY_MS = 86_400_000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getFlexibleAccruedYield(account: Account): number | null {
  const rate = account.annualRate;

  if (
    account.type !== 'FLEXIBLE_SAVINGS' ||
    !rate ||
    rate <= 0 ||
    account.balance <= 0
  ) {
    return null;
  }

  const projection = calculateDailyProjection(account.balance, rate * 100, 365);
  const finalBalance = projection.at(-1)?.balance;

  return finalBalance === undefined ? null : finalBalance - account.balance;
}

function getNearestDeposit(account: Account): FixedTermDeposit | null {
  if (account.type !== 'FIXED_TERM') return null;

  const deposits = (account.fixedTermDeposits ?? []).filter(
    (deposit) => deposit.status !== 'CANCELLED'
  );

  if (deposits.length === 0) return null;

  return deposits.reduce((nearest, candidate) =>
    candidate.maturityDate < nearest.maturityDate ? candidate : nearest
  );
}

function getFixedTermTimeline(account: Account, now = new Date()): FixedTermTimeline | null {
  const deposit = getNearestDeposit(account);
  if (!deposit) return null;

  const start = parseDateOnly(deposit.startDate);
  const maturity = parseDateOnly(deposit.maturityDate);
  if (!maturity) return null;

  const daysLeft = Math.max(0, Math.ceil((maturity.getTime() - now.getTime()) / DAY_MS));

  let progress = 0;
  if (start) {
    const totalDuration = maturity.getTime() - start.getTime();
    if (totalDuration > 0) {
      progress = Math.min(
        1,
        Math.max(0, (now.getTime() - start.getTime()) / totalDuration)
      );
    }
  }

  return { daysLeft, progress };
}

export function AccountRowCard({
  account,
  movementCount,
  isBalanceVisible,
  onPress,
}: AccountRowCardProps) {
  const colors = useColors();
  const { format } = useCurrency();
  const { t } = useTranslation();

  const movementLabel =
    movementCount === 1
      ? t('movementsThisMonthOne')
      : t('movementsThisMonthMany', { count: movementCount });

  const flexibleYield = getFlexibleAccruedYield(account);
  const fixedTimeline = getFixedTermTimeline(account);
  const progressWidth: `${number}%` = `${Math.round((fixedTimeline?.progress ?? 0) * 100)}%`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={account.name}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.card}>
        <View style={styles.mainRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <CreditCard size={18} color={colors.primaryText} strokeWidth={2.2} />
          </View>

          <View style={styles.copy}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {account.name}
            </Text>
            <Text style={[styles.meta, { color: colors.textLight }]} numberOfLines={1}>
              {movementLabel}
            </Text>
          </View>

          <Text
            style={[styles.balance, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {format(account.balance, { hidden: !isBalanceVisible })}
          </Text>
        </View>

        {flexibleYield !== null && (
          <View
            style={[styles.performanceStrip, { backgroundColor: colors.surfaceMuted }]}
          >
            <Text
              style={[styles.performanceText, { color: colors.primaryText }]}
              numberOfLines={1}
            >
              {`${t('estimated')}: ${format(flexibleYield, {
                showSign: isBalanceVisible,
                hidden: !isBalanceVisible,
              })}`}
            </Text>
          </View>
        )}

        {fixedTimeline && (
          <View
            style={[styles.performanceStrip, { backgroundColor: colors.surfaceMuted }]}
          >
            <Text
              style={[styles.performanceText, { color: colors.primaryText }]}
              numberOfLines={1}
            >
              {fixedTimeline.daysLeft === 1
                ? t('maturesInDaysOne')
                : t('maturesInDaysMany', { days: fixedTimeline.daysLeft })}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.controlTrack }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: progressWidth, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.78,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  balance: {
    maxWidth: '38%',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'right',
  },
  performanceStrip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
