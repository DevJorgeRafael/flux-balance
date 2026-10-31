import type { AmountInputError } from '../utils/money';
import type { TranslationKey } from './translations';

export function getAmountInputErrorKey(
  error: AmountInputError
): TranslationKey {
  switch (error) {
    case 'empty':
      return 'amountInputRequired';
    case 'negative':
      return 'amountInputNegative';
    case 'zero':
      return 'amountInputZero';
    case 'tooManyDecimals':
      return 'amountInputTooManyDecimals';
    case 'tooLarge':
      return 'amountInputTooLarge';
    default:
      return 'amountInputInvalid';
  }
}
