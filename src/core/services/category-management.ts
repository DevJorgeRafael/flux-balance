import type { Category, CategoryType } from '../models/category';

export type CategoryNameError = 'required' | 'duplicate';

type CategoryNameCandidate = Pick<Category, 'id' | 'name' | 'type'>;

export function normalizeCategoryName(name: string): string {
  return name.trim();
}

function comparableName(name: string): string {
  return normalizeCategoryName(name).toLocaleLowerCase();
}

export function validateCategoryName(
  name: string,
  categories: readonly CategoryNameCandidate[],
  type: CategoryType,
  excludeId?: string | null
): CategoryNameError | null {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return 'required';

  const comparable = comparableName(normalized);
  const duplicate = categories.some(
    (category) =>
      category.type === type &&
      category.id !== excludeId &&
      comparableName(category.name) === comparable
  );

  return duplicate ? 'duplicate' : null;
}

export function parseCategoryType(value: string | null | undefined): CategoryType | null {
  const normalized = value?.trim().toUpperCase();
  return normalized === 'INCOME' || normalized === 'EXPENSE' ? normalized : null;
}
