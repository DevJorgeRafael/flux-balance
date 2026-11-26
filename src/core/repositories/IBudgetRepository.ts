import type {
  Budget,
  CreateBudgetDTO,
  UpdateBudgetDTO,
} from '../models/budget';

export interface IBudgetRepository {
  getAll(yearMonth?: string): Promise<Budget[]>;
  getById(id: string): Promise<Budget | null>;
  getByCategory(
    categoryId: string,
    type: Budget['type'],
    yearMonth: string
  ): Promise<Budget | null>;
  create(data: CreateBudgetDTO): Promise<Budget>;
  update(id: string, data: UpdateBudgetDTO): Promise<Budget>;
  delete(id: string): Promise<void>;
}
