import type { TransactionType } from '@/core/models/transaction';

export interface TransactionDraft {
  type: TransactionType;
  amount: string;
  description: string;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
}

const TRANSACTION_TYPES: readonly string[] = ['INCOME', 'EXPENSE', 'TRANSFER'];
const STRING_FIELDS = [
  'amount',
  'description',
  'accountId',
  'destinationAccountId',
  'categoryId',
] as const;

export function parseTransactionDraft(raw: string | null | undefined): TransactionDraft | null {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;

    const record = value as Record<string, unknown>;
    if (typeof record.type !== 'string' || !TRANSACTION_TYPES.includes(record.type)) {
      return null;
    }
    if (!STRING_FIELDS.every((field) => typeof record[field] === 'string')) {
      return null;
    }

    return {
      type: record.type as TransactionType,
      amount: record.amount as string,
      description: record.description as string,
      accountId: record.accountId as string,
      destinationAccountId: record.destinationAccountId as string,
      categoryId: record.categoryId as string,
    };
  } catch {
    return null;
  }
}

export function serializeTransactionDraft(draft: TransactionDraft): string {
  return JSON.stringify(draft);
}
