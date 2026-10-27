import type { SQLiteDatabase } from 'expo-sqlite';
import type { CategoryType } from '../../core/models/category';
import { categoryTableForType } from '../../core/services/category-resolution';

type CategoryManagementDatabase = Pick<
  SQLiteDatabase,
  'getFirstAsync' | 'runAsync' | 'withTransactionAsync'
>;

interface CategoryStateRow {
  is_default: number;
}

interface CountRow {
  count: number;
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super('CATEGORY_NOT_FOUND');
    this.name = 'CategoryNotFoundError';
  }
}

export class DefaultCategoryDeletionError extends Error {
  constructor() {
    super('DEFAULT_CATEGORY_NOT_DELETABLE');
    this.name = 'DefaultCategoryDeletionError';
  }
}

export async function getCategoryUsageCount(
  db: Pick<CategoryManagementDatabase, 'getFirstAsync'>,
  categoryId: string,
  type: CategoryType
): Promise<number> {
  const row = await db.getFirstAsync<CountRow>(
    `SELECT COUNT(DISTINCT s.transaction_id) AS count
     FROM transaction_splits s
     INNER JOIN transactions t ON t.id = s.transaction_id
     WHERE s.category_id = ? AND t.type = ?`,
    [categoryId, type]
  );

  return row?.count ?? 0;
}

export async function deleteCategoryAndUncategorize(
  db: CategoryManagementDatabase,
  categoryId: string,
  type: CategoryType
): Promise<number> {
  const table = categoryTableForType(type);
  let usageCount = 0;

  await db.withTransactionAsync(async () => {
    const category = await db.getFirstAsync<CategoryStateRow>(
      `SELECT is_default FROM ${table} WHERE id = ?`,
      [categoryId]
    );

    if (!category) throw new CategoryNotFoundError();
    if (category.is_default === 1) throw new DefaultCategoryDeletionError();

    usageCount = await getCategoryUsageCount(db, categoryId, type);

    await db.runAsync(
      `UPDATE transaction_splits
       SET category_id = ''
       WHERE category_id = ?
         AND transaction_id IN (SELECT id FROM transactions WHERE type = ?)`,
      [categoryId, type]
    );

    await db.runAsync(`DELETE FROM ${table} WHERE id = ? AND is_default = 0`, [
      categoryId,
    ]);
  });

  return usageCount;
}
