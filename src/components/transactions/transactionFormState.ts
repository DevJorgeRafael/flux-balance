import type { Category } from '@/core/models/category';
import type { TransactionType } from '@/core/models/transaction';

export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  description: string;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
}

export interface TransactionAccountOption {
  id: string;
  name: string;
}

export interface TransactionFormSelection {
  effectiveAccountId: string;
  activeCategoryId: string;
  selectedAccount?: TransactionAccountOption;
  selectedCategory?: Category;
  typeCategories: Category[];
}

export function resolveTransactionFormSelection(
  values: TransactionFormValues,
  accounts: TransactionAccountOption[],
  categories: Category[],
  { fallbackToFirstCategory = true }: { fallbackToFirstCategory?: boolean } = {}
): TransactionFormSelection {
  const selectedAccount = accounts.find(
    (account) => account.id === values.accountId
  );
  const effectiveAccountId = selectedAccount?.id ?? accounts[0]?.id ?? '';
  const typeCategories = categories.filter(
    (category) => category.type === values.type
  );
  const selectedCategory = typeCategories.find(
    (category) => category.id === values.categoryId
  );
  const fallbackCategory = fallbackToFirstCategory
    ? typeCategories[0]
    : undefined;
  const activeCategory = selectedCategory ?? fallbackCategory;

  return {
    effectiveAccountId,
    activeCategoryId: activeCategory?.id ?? '',
    selectedAccount: selectedAccount ?? accounts[0],
    selectedCategory: activeCategory,
    typeCategories,
  };
}
