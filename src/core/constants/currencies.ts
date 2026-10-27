export type CurrencyLanguage = 'es' | 'en';

export interface CurrencyOption {
  code: string;
  nameEs: string;
  nameEn: string;
}

export const CURRENCIES: readonly CurrencyOption[] = [
  { code: 'USD', nameEs: 'Dólar estadounidense', nameEn: 'US Dollar' },
  { code: 'EUR', nameEs: 'Euro', nameEn: 'Euro' },
  { code: 'GBP', nameEs: 'Libra esterlina', nameEn: 'British Pound' },
  { code: 'JPY', nameEs: 'Yen japonés', nameEn: 'Japanese Yen' },
  { code: 'CNY', nameEs: 'Yuan chino', nameEn: 'Chinese Yuan' },
  { code: 'CHF', nameEs: 'Franco suizo', nameEn: 'Swiss Franc' },
  { code: 'CAD', nameEs: 'Dólar canadiense', nameEn: 'Canadian Dollar' },
  { code: 'AUD', nameEs: 'Dólar australiano', nameEn: 'Australian Dollar' },
  { code: 'MXN', nameEs: 'Peso mexicano', nameEn: 'Mexican Peso' },
  { code: 'BRL', nameEs: 'Real brasileño', nameEn: 'Brazilian Real' },
  { code: 'ARS', nameEs: 'Peso argentino', nameEn: 'Argentine Peso' },
  { code: 'COP', nameEs: 'Peso colombiano', nameEn: 'Colombian Peso' },
  { code: 'CLP', nameEs: 'Peso chileno', nameEn: 'Chilean Peso' },
  { code: 'PEN', nameEs: 'Sol peruano', nameEn: 'Peruvian Sol' },
  { code: 'UYU', nameEs: 'Peso uruguayo', nameEn: 'Uruguayan Peso' },
];

export const DEFAULT_CURRENCY_CODE = 'USD';

export const DEFAULT_CURRENCY_DECIMALS = 2;

export const CURRENCY_DECIMALS_BY_CODE: Readonly<Record<string, number>> = {
  JPY: 0,
  CLP: 0,
};

export function isSupportedCurrency(code: string | null | undefined): boolean {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  return CURRENCIES.some((currency) => currency.code === normalized);
}

export function resolveCurrencyCode(code: string | null | undefined): string {
  if (!code) return DEFAULT_CURRENCY_CODE;
  const normalized = code.trim().toUpperCase();
  return isSupportedCurrency(normalized) ? normalized : DEFAULT_CURRENCY_CODE;
}

export function getCurrencyDecimals(code: string | null | undefined): number {
  const resolved = resolveCurrencyCode(code);
  return CURRENCY_DECIMALS_BY_CODE[resolved] ?? DEFAULT_CURRENCY_DECIMALS;
}

export function getCurrencyName(
  code: string | null | undefined,
  language: CurrencyLanguage
): string {
  const resolved = resolveCurrencyCode(code);
  const option = CURRENCIES.find((currency) => currency.code === resolved);
  if (!option) return resolved;
  return language === 'es' ? option.nameEs : option.nameEn;
}
