import type { SQLiteDatabase } from 'expo-sqlite';
import {
  categoryTableForType,
  type CategoryTable,
} from '../../core/services/category-resolution';
import { DEFAULT_CATEGORIES, type DefaultCategorySeed } from './schema.sql';

type SeedDatabase = Pick<SQLiteDatabase, 'runAsync'>;

const COLUMNS = '(id, name, color, icon, is_default, sort_order)';
const COLUMN_COUNT = 6;

function buildRows(categories: readonly DefaultCategorySeed[]): {
  placeholders: string;
  params: (string | number)[];
} {
  const rowPlaceholder = `(${Array.from({ length: COLUMN_COUNT }, () => '?').join(', ')})`;
  const placeholders = categories.map(() => rowPlaceholder).join(', ');
  const params = categories.flatMap((category) => [
    category.id,
    category.name,
    category.color,
    category.icon,
    category.is_default,
    category.sort_order,
  ]);

  return { placeholders, params };
}

export async function seedDefaultCategories(db: SeedDatabase): Promise<void> {
  const byTable = new Map<CategoryTable, DefaultCategorySeed[]>();

  for (const category of DEFAULT_CATEGORIES) {
    const table = categoryTableForType(category.type);
    const rows = byTable.get(table);
    if (rows) {
      rows.push(category);
    } else {
      byTable.set(table, [category]);
    }
  }

  for (const [table, categories] of byTable) {
    const { placeholders, params } = buildRows(categories);
    await db.runAsync(
      `INSERT OR IGNORE INTO ${table} ${COLUMNS} VALUES ${placeholders}`,
      params
    );
  }
}
