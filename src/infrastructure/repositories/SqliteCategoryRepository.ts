import { ICategoryRepository } from '@/core/repositories/ICategoryRepository';
import { Category, CategoryType, CreateCategoryDTO, UpdateCategoryDTO } from '@/core/models/category';
import { categoryTableForType } from '@/core/services/category-resolution';
import {
  normalizeCategoryName,
  validateCategoryName,
} from '@/core/services/category-management';
import {
  deleteCategoryAndUncategorize,
  getCategoryUsageCount,
} from '../database/categoryManagement';
import { getDatabase } from '../database/db';

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: number;
  sort_order: number;
  created_at: string;
}

function mapCategory(row: CategoryRow, type: CategoryType): Category {
  return {
    id: row.id,
    name: row.name,
    type,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

const CATEGORY_ORDER = 'ORDER BY sort_order ASC, name COLLATE NOCASE ASC';

export class SqliteCategoryRepository implements ICategoryRepository {
  async getAll(type?: CategoryType): Promise<Category[]> {
    const db = await getDatabase();

    if (type) {
      const table = categoryTableForType(type);
      const rows = await db.getAllAsync<CategoryRow>(
        `SELECT * FROM ${table} ${CATEGORY_ORDER}`
      );
      return rows.map((row) => mapCategory(row, type));
    }

    const [incomeRows, expenseRows] = await Promise.all([
      db.getAllAsync<CategoryRow>(
        `SELECT * FROM income_categories ${CATEGORY_ORDER}`
      ),
      db.getAllAsync<CategoryRow>(
        `SELECT * FROM expense_categories ${CATEGORY_ORDER}`
      ),
    ]);

    return [
      ...incomeRows.map((row) => mapCategory(row, 'INCOME')),
      ...expenseRows.map((row) => mapCategory(row, 'EXPENSE')),
    ];
  }

  async getById(id: string, type?: CategoryType): Promise<Category | null> {
    const db = await getDatabase();

    if (type) {
      const table = categoryTableForType(type);
      const row = await db.getFirstAsync<CategoryRow>(
        `SELECT * FROM ${table} WHERE id = ?`,
        [id]
      );
      return row ? mapCategory(row, type) : null;
    }

    const incomeRow = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM income_categories WHERE id = ?',
      [id]
    );
    if (incomeRow) return mapCategory(incomeRow, 'INCOME');

    const expenseRow = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM expense_categories WHERE id = ?',
      [id]
    );
    return expenseRow ? mapCategory(expenseRow, 'EXPENSE') : null;
  }

  async getUsageCount(id: string, type: CategoryType): Promise<number> {
    const db = await getDatabase();
    return getCategoryUsageCount(db, id, type);
  }

  private async assertValidName(
    name: string,
    type: CategoryType,
    excludeId?: string
  ): Promise<string> {
    const categories = await this.getAll(type);
    const normalized = normalizeCategoryName(name);
    const error = validateCategoryName(normalized, categories, type, excludeId);

    if (error) {
      throw new Error(`CATEGORY_NAME_${error.toUpperCase()}`);
    }

    return normalized;
  }

  async create(data: CreateCategoryDTO): Promise<Category> {
    const db = await getDatabase();
    const table = categoryTableForType(data.type);
    const typePrefix = data.type === 'INCOME' ? 'inc' : 'exp';
    const id = `cat_${typePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const name = await this.assertValidName(data.name, data.type);
    const orderRow = await db.getFirstAsync<{ max_order: number | null }>(
      `SELECT MAX(sort_order) AS max_order FROM ${table}`
    );
    const sortOrder = (orderRow?.max_order ?? -1) + 1;

    await db.runAsync(
      `INSERT INTO ${table} (id, name, color, icon, is_default, sort_order, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, name, data.color ?? null, data.icon ?? null, sortOrder, now]
    );

    return {
      id,
      name,
      type: data.type,
      icon: data.icon ?? null,
      color: data.color ?? null,
      isDefault: false,
      sortOrder,
      createdAt: now,
    };
  }

  async update(
    id: string,
    data: UpdateCategoryDTO,
    type: CategoryType
  ): Promise<Category> {
    const db = await getDatabase();
    const table = categoryTableForType(type);
    const existing = await this.getById(id, type);
    if (!existing) throw new Error(`Category not found: ${id}`);

    const updates: string[] = [];
    const params: (string | null)[] = [];

    if (data.name !== undefined) {
      const name = await this.assertValidName(data.name, type, id);
      updates.push('name = ?');
      params.push(name);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      params.push(data.icon ?? null);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color ?? null);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.runAsync(
        `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const updated = await this.getById(id, type);
    return updated!;
  }

  async delete(id: string, type: CategoryType): Promise<number> {
    const db = await getDatabase();
    return deleteCategoryAndUncategorize(db, id, type);
  }
}
