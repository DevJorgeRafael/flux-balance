import type { AmountInputError } from '../utils/money';
import { parseAmountInput } from '../utils/money';

export type ReminderAmountInputResult =
  | { ok: true; value: number | null }
  | { ok: false; error: AmountInputError };

export function parseReminderAmount(
  text: string,
  locale: string,
  decimals: number
): ReminderAmountInputResult {
  if (!text.trim()) return { ok: true, value: null };

  const result = parseAmountInput(text, locale, decimals, { allowZero: true });
  if (!result.ok) return result;

  return { ok: true, value: result.value === 0 ? null : result.value };
}
