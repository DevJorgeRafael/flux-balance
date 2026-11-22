import type { Account } from '@/core/models/account';
import type { Category } from '@/core/models/category';
import type {
  TransactionPrefill,
  TransactionType,
} from '@/core/models/transaction';

interface TransactionPrefillSetters {
  amount: (value: string) => void;
  description: (value: string) => void;
  accountId: (value: string) => void;
  categoryId: (value: string) => void;
}

export function applyTransactionPrefill(
  prefill: TransactionPrefill,
  type: TransactionType,
  accounts: Account[],
  categories: Category[],
  formatAmount: (amount: number) => string,
  setters: TransactionPrefillSetters
): void {
  setters.amount(prefill.amount != null ? formatAmount(prefill.amount) : '');
  setters.description(prefill.description ?? '');
  setters.accountId(
    accounts.find((account) => account.id === prefill.accountId)?.id ??
      accounts[0]?.id ??
      ''
  );
  setters.categoryId(
    categories.find(
      (category) =>
        category.id === prefill.categoryId && category.type === type
    )?.id ?? ''
  );
}
