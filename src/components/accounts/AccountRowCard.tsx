import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Calendar,
  CreditCard,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import type { Account, AccountType, FixedTermDeposit } from '@/core/models/account';
import { calculateDailyProjection } from '@/core/services/interest-calculator';
import { formatCurrency } from '@/core/utils/currency';
import { shadow, useColors, useThemeMode } from '@/components/ui/theme';
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
  const { isDark } = useThemeMode();
  const { t } = useTranslation();

  const visuals: Record<
    AccountType,
    { Icon: LucideIcon; background: string; foreground: string }
  > = {
    CHECKING: {
      Icon: CreditCard,
      background: colors.primarySoft,
      foreground: colors.primaryText,
    },
    FLEXIBLE_SAVINGS: {
      Icon: Zap,
      background: colors.successSoft,
      foreground: colors.successText,
    },
    FIXED_TERM: {
      Icon: Calendar,
      background: colors.warningSoft,
      foreground: colors.warningText,
    },
  };

  const { Icon, background, foreground } = visuals[account.type];
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
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface },
        !isDark && shadow.sm,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.mainRow}>
        <View style={[styles.iconCircle, { backgroundColor: background }]}>
          <Icon size={18} color={foreground} strokeWidth={2.2} />
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
          {formatCurrency(account.balance, false, isBalanceVisible)}
        </Text>
      </View>

      {flexibleYield !== null && (
        <View
          style={[
            styles.performanceStrip,
            styles.flexibleStrip,
            { backgroundColor: colors.successSoft },
          ]}
        >
          <TrendingUp size={13} color={colors.successText} strokeWidth={2.4} />
          <Text
            style={[styles.performanceText, { color: colors.successText }]}
            numberOfLines={1}
          >
            {isBalanceVisible ? '+' : ''}
            {formatCurrency(flexibleYield, false, isBalanceVisible)}
          </Text>
          <View style={[styles.estimatedTag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.estimatedText, { color: colors.successText }]}>
              {t('estimated')}
            </Text>
          </View>
        </View>
      )}

      {fixedTimeline && (
        <View style={[styles.performanceStrip, { backgroundColor: colors.warningSoft }]}>
          <View style={styles.fixedHeaderRow}>
            <Calendar size={13} color={colors.warningText} strokeWidth={2.4} />
            <Text
              style={[styles.performanceText, { color: colors.warningText }]}
              numberOfLines={1}
            >
              {fixedTimeline.daysLeft === 1
                ? t('maturesInDaysOne')
                : t('maturesInDaysMany', { days: fixedTimeline.daysLeft })}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: progressWidth, backgroundColor: colors.warningText },
              ]}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
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
  flexibleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  estimatedTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 'auto',
  },
  estimatedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fixedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
