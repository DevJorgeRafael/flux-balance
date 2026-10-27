export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  icon?: string;
  color?: string;
}
