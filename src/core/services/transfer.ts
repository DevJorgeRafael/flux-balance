import {
  MAX_AMOUNT,
  MAX_TRANSACTION_DESCRIPTION_LENGTH,
} from '../constants/inputLimits';
import type {
  CreateTransactionDTO,
  TransactionSplit,
  TransactionType,
} from '../models/transaction';
import { parseLedgerDate } from '../utils/ledger-date';

export const TRANSFER_SPLIT_COUNT = 2;
export const TRANSFER_SOURCE_INDEX = 0;
export const TRANSFER_DESTINATION_INDEX = 1;

export type TransferValidationError =
  | 'invalidAccounts'
  | 'invalidAmount'
  | 'invalidDate'
  | 'descriptionTooLong';

export type TransferDraftResult =
  | { ok: true; draft: CreateTransactionDTO }
  | { ok: false; error: TransferValidationError };

export interface TransferInput {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  date: string;
  description?: string;
}

export interface ReconciliationInput {
  accountId: string;
  currentBalance: number;
  expectedBalance: number;
  date: string;
  description: string;
}

function rounded(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function validateTransferInput(input: TransferInput): TransferValidationError | null {
  if (
    !input.sourceAccountId.trim() ||
    !input.destinationAccountId.trim() ||
    input.sourceAccountId === input.destinationAccountId
  ) {
    return 'invalidAccounts';
  }
  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    input.amount > MAX_AMOUNT
  ) {
    return 'invalidAmount';
  }
  if (!parseLedgerDate(input.date)) return 'invalidDate';
  if (
    input.description != null &&
    input.description.trim().length > MAX_TRANSACTION_DESCRIPTION_LENGTH
  ) {
    return 'descriptionTooLong';
  }
  return null;
}

export function buildTransferDraft(input: TransferInput): TransferDraftResult {
  const error = validateTransferInput(input);
  if (error) return { ok: false, error };

  return {
    ok: true,
    draft: {
      type: 'TRANSFER',
      totalAmount: input.amount,
      date: input.date,
      description: input.description?.trim() || undefined,
      splits: [
        { accountId: input.sourceAccountId, amount: input.amount },
        { accountId: input.destinationAccountId, amount: input.amount },
      ],
    },
  };
}

export function getSplitBalanceDelta(
  type: TransactionType,
  index: number,
  amount: number
): number {
  if (type === 'INCOME') return amount;
  if (type === 'EXPENSE') return -amount;
  if (type === 'TRANSFER') {
    if (index === TRANSFER_SOURCE_INDEX) return -amount;
    if (index === TRANSFER_DESTINATION_INDEX) return amount;
    throw new Error('Una transferencia debe tener dos divisiones.');
  }
  throw new Error('Tipo de movimiento no admitido.');
}

export function isTransferDraftValid(draft: CreateTransactionDTO): boolean {
  if (draft.type !== 'TRANSFER') return false;
  if (draft.splits.length !== TRANSFER_SPLIT_COUNT) return false;
  const [source, destination] = draft.splits;
  return Boolean(
    source &&
      destination &&
      source.accountId !== destination.accountId &&
      source.amount === draft.totalAmount &&
      destination.amount === draft.totalAmount
  );
}

export function getTransferBalanceDelta(
  splits: readonly Pick<TransactionSplit, 'accountId' | 'amount'>[],
  accountId: string
): number {
  let delta = 0;
  splits.forEach((split, index) => {
    if (split.accountId !== accountId) return;
    delta += getSplitBalanceDelta('TRANSFER', index, split.amount);
  });
  return delta;
}

export function buildReconciliationDraft(
  input: ReconciliationInput,
  currencyDecimals = 2
): CreateTransactionDTO | null {
  if (!input.accountId.trim() || !parseLedgerDate(input.date)) return null;
  if (
    !Number.isFinite(input.currentBalance) ||
    !Number.isFinite(input.expectedBalance)
  ) {
    return null;
  }

  const difference = rounded(
    input.expectedBalance - input.currentBalance,
    currencyDecimals
  );
  if (difference === 0) return null;
  if (Math.abs(difference) > MAX_AMOUNT) return null;

  return {
    type: difference > 0 ? 'INCOME' : 'EXPENSE',
    totalAmount: Math.abs(difference),
    date: input.date,
    description: input.description.trim() || undefined,
    splits: [
      {
        accountId: input.accountId,
        amount: Math.abs(difference),
      },
    ],
  };
}
