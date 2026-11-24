import { useCallback, useMemo } from 'react';
import {
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  getCurrencyName,
  resolveCurrencyCode,
  type CurrencyOption,
} from '../constants/currencies';
import { useTranslation } from '../i18n/useTranslation';
import { formatMoney, HIDDEN_AMOUNT, type FormatMoneyOptions } from '../utils/money';
import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';
import { useCurrencyStore } from '@/store/currencyStore';

const CURRENCY_SETTING_KEY = 'currency';

export interface FormatAmountOptions extends FormatMoneyOptions {
  hidden?: boolean;
}

export async function loadStoredCurrency(): Promise<string> {
  try {
    return resolveCurrencyCode(await getAppSetting(CURRENCY_SETTING_KEY));
  } catch (error) {
    console.error('Error loading currency preference:', error);
    return DEFAULT_CURRENCY_CODE;
  }
}

export function useCurrency() {
  const currency = useCurrencyStore((state) => state.code);
  const setCurrencyCode = useCurrencyStore((state) => state.setCode);
  const { language } = useTranslation();
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const setCurrency = useCallback(
    (code: string) => {
      const nextCurrency = resolveCurrencyCode(code);
      setCurrencyCode(nextCurrency);
      void setAppSetting(CURRENCY_SETTING_KEY, nextCurrency).catch((error) => {
        console.error('Error saving currency preference:', error);
      });
    },
    [setCurrencyCode]
  );

  const format = useCallback(
    (amount: number, options?: FormatAmountOptions) => {
      if (options?.hidden) return HIDDEN_AMOUNT;
      return formatMoney(amount, currency, locale, {
        showSign: options?.showSign,
        showCurrency: options?.showCurrency,
        decimals: options?.decimals,
      });
    },
    [currency, locale]
  );

  const currencyOption: CurrencyOption | undefined = CURRENCIES.find(
    (option) => option.code === currency
  );

  return useMemo(
    () => ({
      currency,
      currencyOption,
      currencyName: getCurrencyName(currency, language),
      setCurrency,
      locale,
      format,
    }),
    [currency, currencyOption, language, setCurrency, locale, format]
  );
}
