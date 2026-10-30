import { getCurrencyDecimals } from '@/core/constants/currencies';
import {
  MAX_ACCOUNT_NAME_LENGTH,
  MAX_ANNUAL_RATE_PERCENT,
  MAX_TERM_MONTHS,
} from '@/core/constants/inputLimits';
import type { TranslationKey } from '@/core/i18n/translations';
import { getAmountInputErrorKey } from '@/core/i18n/validationMessages';
import type { AccountType } from '@/core/models/account';
import { parseAmountInput } from '@/core/utils/money';

export interface AccountFormInput {
  name: string;
  type: AccountType;
  balance: string;
  annualRate: string;
  termMonths: string;
  locale: string;
  currency: string;
}

export type AccountFormValidation =
  | {
      ok: true;
      name: string;
      balance: number;
      annualRate: number | undefined;
      termMonths: number;
    }
  | {
      ok: false;
      errorKey: TranslationKey;
      params?: Record<string, string | number>;
      maxAmount?: boolean;
    };

export function validateAccountForm(
  input: AccountFormInput
): AccountFormValidation {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, errorKey: 'accountNameRequired' };
  }
  if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
    return {
      ok: false,
      errorKey: 'accountNameTooLong',
      params: { max: MAX_ACCOUNT_NAME_LENGTH },
    };
  }

  const decimals = getCurrencyDecimals(input.currency);
  const balanceText = input.balance.trim();
  let balance = 0;
  if (balanceText) {
    const result = parseAmountInput(balanceText, input.locale, decimals, {
      allowZero: input.type !== 'FIXED_TERM',
    });
    if (!result.ok) {
      if (input.type === 'FIXED_TERM' && result.error === 'zero') {
        return { ok: false, errorKey: 'accountCapitalRequired' };
      }
      return {
        ok: false,
        errorKey: getAmountInputErrorKey(result.error),
        params: { decimals },
        maxAmount: result.error === 'tooLarge',
      };
    }
    balance = result.value;
  } else if (input.type === 'FIXED_TERM') {
    return { ok: false, errorKey: 'accountCapitalRequired' };
  }

  const rateText = input.annualRate.trim();
  let annualRate: number | undefined;
  if (rateText) {
    const result = parseAmountInput(rateText, input.locale, 2, {
      allowZero: true,
    });
    if (
      !result.ok ||
      result.value > MAX_ANNUAL_RATE_PERCENT
    ) {
      return {
        ok: false,
        errorKey: 'annualRateInvalid',
        params: { max: MAX_ANNUAL_RATE_PERCENT },
      };
    }
    annualRate = result.value / 100;
  }

  const termMonths = Number(input.termMonths);
  if (
    !Number.isInteger(termMonths) ||
    termMonths < 1 ||
    termMonths > MAX_TERM_MONTHS
  ) {
    return {
      ok: false,
      errorKey: 'termMonthsInvalid',
      params: { max: MAX_TERM_MONTHS },
    };
  }

  return {
    ok: true,
    name,
    balance,
    annualRate,
    termMonths,
  };
}
