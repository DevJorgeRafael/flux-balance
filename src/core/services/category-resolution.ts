import type { Category, CategoryType } from '../models/category';

export const INCOME_CATEGORY_TABLE = 'income_categories';
export const EXPENSE_CATEGORY_TABLE = 'expense_categories';

export type CategoryTable =
  | typeof INCOME_CATEGORY_TABLE
  | typeof EXPENSE_CATEGORY_TABLE;

export function categoryTableForType(type: CategoryType): CategoryTable {
  return type === 'INCOME' ? INCOME_CATEGORY_TABLE : EXPENSE_CATEGORY_TABLE;
}

export function resolveCategoryForType(
  categoryId: string | null | undefined,
  type: CategoryType,
  categories: readonly Category[]
): Category | null {
  const normalizedId = categoryId?.trim();
  if (!normalizedId) return null;

  return (
    categories.find(
      (category) => category.id === normalizedId && category.type === type
    ) ?? null
  );
}
