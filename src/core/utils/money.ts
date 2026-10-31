import {
  DEFAULT_CURRENCY_DECIMALS,
  getCurrencyDecimals,
  resolveCurrencyCode,
} from '../constants/currencies';
import { MAX_AMOUNT } from '../constants/inputLimits';

export interface FormatMoneyOptions {
  showSign?: boolean;
  showCurrency?: boolean;
}

export type AmountInputError =
  | 'empty'
  | 'invalid'
  | 'negative'
  | 'zero'
  | 'tooManyDecimals'
  | 'tooLarge';

export type AmountInputResult =
  | { ok: true; value: number }
  | { ok: false; error: AmountInputError };

export interface ParseAmountInputOptions {
  allowZero?: boolean;
}

export const HIDDEN_AMOUNT = '••••••';

const FALLBACK_LOCALE = 'en-US';

function failAmountInput(error: AmountInputError): AmountInputResult {
  return { ok: false, error };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseGroupedInteger(
  value: string,
  groupingSeparator: string
): string | null {
  if (!value.includes(groupingSeparator)) {
    return /^\d+$/.test(value) ? value : null;
  }

  const pattern = new RegExp(
    `^\\d{1,3}(?:${escapeRegExp(groupingSeparator)}\\d{3})+$`
  );
  return pattern.test(value)
    ? value.split(groupingSeparator).join('')
    : null;
}

function parseSeparatedAmount(
  text: string,
  decimalSeparator: string,
  groupingSeparator: string,
  decimals: number
): AmountInputResult {
  const commaCount = (text.match(/,/g) ?? []).length;
  const dotCount = (text.match(/\./g) ?? []).length;
  let integerPart = text;
  let fractionPart = '';

  if (commaCount > 0 && dotCount > 0) {
    const decimalIndex = Math.max(
      text.lastIndexOf(','),
      text.lastIndexOf('.')
    );
    const decimal = text[decimalIndex];
    const grouping = decimal === ',' ? '.' : ',';
    if (text.indexOf(decimal) !== decimalIndex) {
      return failAmountInput('invalid');
    }

    const normalizedInteger = parseGroupedInteger(
      text.slice(0, decimalIndex),
      grouping
    );
    if (normalizedInteger === null) return failAmountInput('invalid');

    integerPart = normalizedInteger;
    fractionPart = text.slice(decimalIndex + 1);
    if (!fractionPart || !/^\d+$/.test(fractionPart)) {
      return failAmountInput('invalid');
    }
  } else if (commaCount > 0 || dotCount > 0) {
    const separator = commaCount > 0 ? ',' : '.';
    const count = commaCount > 0 ? commaCount : dotCount;
    const separatorIndex = text.lastIndexOf(separator);

    if (separator === decimalSeparator) {
      if (count > 1) return failAmountInput('invalid');

      integerPart = text.slice(0, separatorIndex);
      fractionPart = text.slice(separatorIndex + 1);
      if (!/^\d*$/.test(integerPart) || !/^\d+$/.test(fractionPart)) {
        return failAmountInput('invalid');
      }
    } else {
      const before = text.slice(0, separatorIndex);
      const after = text.slice(separatorIndex + 1);

      if (count > 1) {
        const normalizedInteger = parseGroupedInteger(text, separator);
        if (normalizedInteger === null) return failAmountInput('invalid');
        integerPart = normalizedInteger;
      } else if (after.length > 0 && after.length <= decimals) {
        if (!/^\d*$/.test(before) || !/^\d+$/.test(after)) {
          return failAmountInput('invalid');
        }
        integerPart = before;
        fractionPart = after;
      } else if (
        after.length === 3 &&
        before.length >= 1 &&
        before.length <= 3 &&
        before !== '0' &&
        !before.startsWith('0')
      ) {
        integerPart = `${before}${after}`;
      } else if (after.length > decimals) {
        return failAmountInput('tooManyDecimals');
      } else {
        return failAmountInput('invalid');
      }
    }
  } else if (!/^\d+$/.test(text)) {
    return failAmountInput('invalid');
  }

  if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(fractionPart)) {
    return failAmountInput('invalid');
  }
  if (fractionPart.length > decimals) {
    return failAmountInput('tooManyDecimals');
  }

  const normalizedInteger = integerPart || '0';
  const numericText = fractionPart
    ? `${normalizedInteger}.${fractionPart}`
    : normalizedInteger;
  const value = Number(numericText);
  if (!Number.isFinite(value)) return failAmountInput('tooLarge');

  return { ok: true, value };
}

export function parseAmountInput(
  text: string,
  locale: string,
  decimals = DEFAULT_CURRENCY_DECIMALS,
  { allowZero = false }: ParseAmountInputOptions = {}
): AmountInputResult {
  let trimmed = text.trim();
  if (!trimmed) return failAmountInput('empty');
  if (trimmed.startsWith('-')) return failAmountInput('negative');
  if (trimmed.startsWith('+')) {
    trimmed = trimmed.slice(1);
    if (!trimmed) return failAmountInput('invalid');
  }

  const compact = trimmed.replace(/\s+/g, '');
  if (!compact) return failAmountInput('empty');
  if (!/^[0-9.,]+$/.test(compact)) return failAmountInput('invalid');

  const safeDecimals =
    Number.isInteger(decimals) && decimals >= 0
      ? decimals
      : DEFAULT_CURRENCY_DECIMALS;
  const decimalSeparator = locale.trim().toLowerCase().startsWith('es')
    ? ','
    : '.';
  const groupingSeparator = decimalSeparator === ',' ? '.' : ',';

  const parsed = parseSeparatedAmount(
    compact,
    decimalSeparator,
    groupingSeparator,
    safeDecimals
  );
  if (!parsed.ok) return parsed;
  if (parsed.value === 0 && !allowZero) return failAmountInput('zero');
  if (parsed.value > MAX_AMOUNT) return failAmountInput('tooLarge');

  return parsed;
}

function formatAbsolute(value: number, locale: string, decimals: number): string {
  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  };

  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return new Intl.NumberFormat(FALLBACK_LOCALE, options).format(value);
  }
}

export function formatMoney(
  amount: number,
  currencyCode: string,
  locale: string,
  { showSign = false, showCurrency = true }: FormatMoneyOptions = {}
): string {
  const code = resolveCurrencyCode(currencyCode);
  const decimals = getCurrencyDecimals(code);
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = formatAbsolute(Math.abs(value), locale, decimals);
  const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : '';
  const prefix = showCurrency ? `${code} ` : '';

  return `${sign}${prefix}${formatted}`;
}
