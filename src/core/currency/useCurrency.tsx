import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  getCurrencyName,
  isSupportedCurrency,
  resolveCurrencyCode,
  type CurrencyOption,
} from '../constants/currencies';
import { useTranslation } from '../i18n/useTranslation';
import { formatMoney, HIDDEN_AMOUNT, type FormatMoneyOptions } from '../utils/money';
import { getAppSetting, setAppSetting } from '@/infrastructure/database/appSettings';

const CURRENCY_SETTING_KEY = 'currency';

export interface FormatAmountOptions extends FormatMoneyOptions {
  hidden?: boolean;
}

export interface CurrencyProviderProps {
  children: React.ReactNode;
  initialCurrency?: string;
}

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export async function loadStoredCurrency(): Promise<string> {
  try {
    return resolveCurrencyCode(await getAppSetting(CURRENCY_SETTING_KEY));
  } catch (error) {
    console.error('Error loading currency preference:', error);
    return DEFAULT_CURRENCY_CODE;
  }
}

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<string>(() =>
    resolveCurrencyCode(initialCurrency)
  );

  useEffect(() => {
    if (initialCurrency !== undefined) return;

    let cancelled = false;

    void getAppSetting(CURRENCY_SETTING_KEY)
      .then((savedCurrency) => {
        if (cancelled) return;
        if (isSupportedCurrency(savedCurrency)) {
          setCurrencyState(resolveCurrencyCode(savedCurrency));
        }
      })
      .catch((error) => {
        console.error('Error loading currency preference:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [initialCurrency]);

  const setCurrency = useCallback((code: string) => {
    const nextCurrency = resolveCurrencyCode(code);
    setCurrencyState(nextCurrency);
    void setAppSetting(CURRENCY_SETTING_KEY, nextCurrency).catch((error) => {
      console.error('Error saving currency preference:', error);
    });
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, setCurrency }),
    [currency, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const { currency, setCurrency } = useCurrencyContext();
  const { language } = useTranslation();
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const format = useCallback(
    (amount: number, options?: FormatAmountOptions) => {
      if (options?.hidden) return HIDDEN_AMOUNT;
      return formatMoney(amount, currency, locale, {
        showSign: options?.showSign,
        showCurrency: options?.showCurrency,
      });
    },
    [currency, locale]
  );

  const currencyOption: CurrencyOption | undefined = CURRENCIES.find(
    (option) => option.code === currency
  );

  return {
    currency,
    currencyOption,
    currencyName: getCurrencyName(currency, language),
    setCurrency,
    locale,
    format,
  };
}

function useCurrencyContext(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider.');
  }
  return context;
}
