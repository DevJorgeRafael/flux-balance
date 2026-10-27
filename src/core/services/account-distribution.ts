import { CATEGORY_COLOR_PALETTES } from '../constants/categoryPalettes';

export const OTHER_ACCOUNT_SEGMENT_ID = '__other_accounts__';
export const MAX_ACCOUNT_DISTRIBUTION_SEGMENTS = 5;

/**
 * Colores apagados tomados de las paletas de categorías. No se usa morado:
 * azul acero, verde, arena, coral y verde azulado.
 */
const SEGMENT_COLORS: readonly string[] = [
  CATEGORY_COLOR_PALETTES.INCOME[2]![5]!,
  CATEGORY_COLOR_PALETTES.INCOME[4]![1]!,
  CATEGORY_COLOR_PALETTES.EXPENSE[3]![1]!,
  CATEGORY_COLOR_PALETTES.EXPENSE[1]![4]!,
  CATEGORY_COLOR_PALETTES.INCOME[5]![4]!,
];

export interface AccountDistributionInput {
  id: string;
  name: string;
  balance: number;
}

export interface AccountDistributionSegment {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  kind: 'account' | 'other';
}

export interface AccountDistribution {
  /** Base de la barra: suma de los saldos positivos. */
  total: number;
  segments: AccountDistributionSegment[];
  shouldShowBar: boolean;
}

export interface BuildAccountDistributionOptions {
  otherLabel: string;
  otherColor: string;
  maxSegments?: number;
}

interface PositiveAccount {
  id: string;
  name: string;
  amount: number;
}

function sortByAmount(a: PositiveAccount, b: PositiveAccount) {
  return b.amount - a.amount || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

/**
 * Enteros con largest remainder: la suma siempre es exactamente 100 cuando
 * hay al menos un monto positivo.
 */
function calculatePercentages(amounts: number[], total: number): number[] {
  if (total <= 0 || amounts.length === 0) return [];

  const raw = amounts.map((amount) => (amount / total) * 100);
  const percentages = raw.map(Math.floor);
  const remainder = Math.max(0, 100 - percentages.reduce((sum, value) => sum + value, 0));

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let index = 0; index < remainder; index += 1) {
    const target = order[index % order.length];
    if (target) percentages[target.index] += 1;
  }

  return percentages;
}

/**
 * Arma los segmentos de la barra de distribución. Con más de `maxSegments`
 * cuentas se muestran las mayores y el resto se agrupa en "Otras"; el grupo
 * también ocupa un segmento, por eso se reserva un lugar para él.
 */
export function buildAccountDistribution(
  accounts: readonly AccountDistributionInput[],
  {
    otherLabel,
    otherColor,
    maxSegments = MAX_ACCOUNT_DISTRIBUTION_SEGMENTS,
  }: BuildAccountDistributionOptions
): AccountDistribution {
  const limit = Math.max(2, Math.floor(maxSegments));
  const positiveAccounts = accounts
    .map<PositiveAccount>((account) => ({
      id: account.id,
      name: account.name,
      amount: Math.max(0, account.balance),
    }))
    .filter((account) => account.amount > 0)
    .sort(sortByAmount);

  const total = positiveAccounts.reduce((sum, account) => sum + account.amount, 0);

  if (accounts.length <= 1 || positiveAccounts.length <= 1 || total <= 0) {
    return { total, segments: [], shouldShowBar: false };
  }

  const needsOtherGroup = positiveAccounts.length > limit;
  const visibleCount = needsOtherGroup ? limit - 1 : positiveAccounts.length;

  const segments: AccountDistributionSegment[] = positiveAccounts
    .slice(0, visibleCount)
    .map((account, index) => ({
      id: account.id,
      name: account.name,
      amount: account.amount,
      percentage: 0,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]!,
      kind: 'account',
    }));

  if (needsOtherGroup) {
    const otherAmount = positiveAccounts
      .slice(visibleCount)
      .reduce((sum, account) => sum + account.amount, 0);

    segments.push({
      id: OTHER_ACCOUNT_SEGMENT_ID,
      name: otherLabel,
      amount: otherAmount,
      percentage: 0,
      color: otherColor,
      kind: 'other',
    });
  }

  const percentages = calculatePercentages(
    segments.map((segment) => segment.amount),
    total
  );

  return {
    total,
    segments: segments.map((segment, index) => ({
      ...segment,
      percentage: percentages[index] ?? 0,
    })),
    shouldShowBar: true,
  };
}
