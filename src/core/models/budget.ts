import type { CategoryType } from './category';

export interface Budget {
  id: string;
  categoryId: string;
  type: CategoryType;
  yearMonth: string;
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDTO {
  categoryId: string;
  type: CategoryType;
  yearMonth: string;
  limitAmount: number;
}

export interface UpdateBudgetDTO {
  limitAmount: number;
}
