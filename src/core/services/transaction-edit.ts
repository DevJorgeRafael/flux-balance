import {
  MAX_AMOUNT,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '../constants/inputLimits';
import type {
  Transaction,
  TransactionType,
  UpdateTransactionDTO,
} from '../models/transaction';
import { parseLedgerDate } from '../utils/ledger-date';

export type TransactionEditBlockReason =
  | 'TRANSFER'
  | 'MULTIPLE_SPLITS'
  | 'NO_SPLITS';

export type TransactionUpdateValidationError =
  | 'typeNotEditable'
  | 'invalidAmount'
  | 'invalidDate'
  | 'descriptionTooLong'
  | 'missingAccount'
  | 'splitTotalMismatch';

export type TransactionUpdateValidation =
  | { ok: true }
  | { ok: false; error: TransactionUpdateValidationError };

export function getTransactionEditBlockReason(
  transaction: Pick<Transaction, 'type' | 'splits'>
): TransactionEditBlockReason | null {
  if (transaction.type === 'TRANSFER') return 'TRANSFER';
  if (transaction.splits.length === 0) return 'NO_SPLITS';
  if (transaction.splits.length > 1) return 'MULTIPLE_SPLITS';
  return null;
}

export function canEditTransaction(
  transaction: Pick<Transaction, 'type' | 'splits'>
): boolean {
  return getTransactionEditBlockReason(transaction) === null;
}

export function getBalanceDelta(
  type: TransactionType,
  amount: number
): number {
  if (type === 'INCOME') return amount;
  if (type === 'EXPENSE') return -amount;
  throw new Error('Las transferencias no admiten edición.');
}

export function splitTotalMatches(
  totalAmount: number,
  splits: readonly { amount: number }[],
  currencyDecimals = 2
): boolean {
  const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
  const decimals =
    Number.isInteger(currencyDecimals) && currencyDecimals >= 0
      ? currencyDecimals
      : 2;
  const tolerance = 0.5 * 10 ** -decimals;

  return Math.abs(totalAmount - splitTotal) <= tolerance;
}

export function validateTransactionUpdate(
  data: UpdateTransactionDTO
): TransactionUpdateValidation {
  if (data.type !== 'INCOME' && data.type !== 'EXPENSE') {
    return { ok: false, error: 'typeNotEditable' };
  }

  if (
    !Number.isFinite(data.totalAmount) ||
    data.totalAmount <= 0 ||
    data.totalAmount > MAX_AMOUNT
  ) {
    return { ok: false, error: 'invalidAmount' };
  }

  if (!parseLedgerDate(data.date)) {
    return { ok: false, error: 'invalidDate' };
  }

  if (
    data.description != null &&
    data.description.trim().length > MAX_TRANSACTION_DESCRIPTION_LENGTH
  ) {
    return { ok: false, error: 'descriptionTooLong' };
  }

  if (data.splits.length === 0) {
    return { ok: false, error: 'missingAccount' };
  }

  for (const split of data.splits) {
    if (!split.accountId.trim()) {
      return { ok: false, error: 'missingAccount' };
    }
    if (!Number.isFinite(split.amount) || split.amount <= 0) {
      return { ok: false, error: 'invalidAmount' };
    }
  }

  if (!splitTotalMatches(data.totalAmount, data.splits)) {
    return { ok: false, error: 'splitTotalMismatch' };
  }

  return { ok: true };
}
