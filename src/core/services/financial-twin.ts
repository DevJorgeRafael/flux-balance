export interface GoalProgressInput {
  targetAmount: number;
  deadline: string;
  currentBalance: number;
  today: Date;
}

export interface GoalProgress {
  ratio: number;
  remaining: number;
  daysLeft: number;
  monthsLeft: number;
  monthlyRequired: number;
  reached: boolean;
}

export interface SimulationInput {
  initialBalance: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
}

export interface SimulationPoint {
  month: number;
  balance: number;
}

export interface SimulationResult {
  finalBalance: number;
  totalContributed: number;
  totalInterest: number;
  series: SimulationPoint[];
}

const DAY_MS = 86_400_000;

export function isValidGoalName(value: string): boolean {
  return value.trim().length >= 1 && value.trim().length <= 80;
}

export function isValidGoalDeadline(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return false;
  return new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function isFutureGoalDeadline(value: string, today: Date): boolean {
  if (!isValidGoalDeadline(value)) return false;
  const now = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value >= now;
}

export function getGoalProgress(input: GoalProgressInput): GoalProgress {
  const target = Number.isFinite(input.targetAmount) ? input.targetAmount : 0;
  const current = Number.isFinite(input.currentBalance) ? input.currentBalance : 0;
  const deadline = Date.parse(`${input.deadline}T00:00:00.000Z`);
  const todayUtc = Date.UTC(
    input.today.getUTCFullYear(),
    input.today.getUTCMonth(),
    input.today.getUTCDate()
  );

  const remaining = Math.max(0, target - current);
  const daysLeft = Number.isFinite(deadline)
    ? Math.max(0, Math.ceil((deadline - todayUtc) / DAY_MS))
    : 0;
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));

  return {
    ratio: target > 0 ? Math.min(1, Math.max(0, current / target)) : 0,
    remaining,
    daysLeft,
    monthsLeft,
    monthlyRequired: monthsLeft > 0 ? remaining / monthsLeft : remaining,
    reached: remaining === 0,
  };
}

export function simulateSavings(input: SimulationInput): SimulationResult {
  const months = Math.max(0, Math.trunc(input.months));
  const monthlyRate = input.annualRate / 12;
  let balance = Number.isFinite(input.initialBalance) ? input.initialBalance : 0;
  const series: SimulationPoint[] = [{ month: 0, balance }];

  for (let month = 1; month <= months; month += 1) {
    balance = balance * (1 + monthlyRate) + input.monthlyContribution;
    series.push({ month, balance });
  }

  const totalContributed = input.monthlyContribution * months;
  return {
    finalBalance: balance,
    totalContributed,
    totalInterest: balance - (input.initialBalance + totalContributed),
    series,
  };
}

export function requiredMonthlyContribution(input: {
  target: number;
  initialBalance: number;
  annualRate: number;
  months: number;
}): number {
  const months = Math.max(1, Math.trunc(input.months));
  const needed = input.target - input.initialBalance;
  if (needed <= 0) return 0;

  const rate = input.annualRate / 12;
  if (Math.abs(rate) < 1e-9) return needed / months;

  const factor = (1 + rate) ** months;
  const contribution = (needed - input.initialBalance * (factor - 1)) * rate / (factor - 1);
  return Math.max(0, contribution);
}
