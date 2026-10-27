import { Category, CategoryType, CreateCategoryDTO, UpdateCategoryDTO } from '../models/category';

export interface ICategoryRepository {
  getAll(type?: CategoryType): Promise<Category[]>;
  getById(id: string, type?: CategoryType): Promise<Category | null>;
  getUsageCount(id: string, type: CategoryType): Promise<number>;
  create(data: CreateCategoryDTO): Promise<Category>;
  update(id: string, data: UpdateCategoryDTO, type: CategoryType): Promise<Category>;
  delete(id: string, type: CategoryType): Promise<number>;
}
