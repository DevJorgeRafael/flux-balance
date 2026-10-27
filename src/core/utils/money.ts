import { getCurrencyDecimals, resolveCurrencyCode } from '../constants/currencies';

export interface FormatMoneyOptions {
  showSign?: boolean;
  showCurrency?: boolean;
}

export const HIDDEN_AMOUNT = '••••••';

const FALLBACK_LOCALE = 'en-US';

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
