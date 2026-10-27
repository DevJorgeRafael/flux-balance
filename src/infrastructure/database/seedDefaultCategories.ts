import type { SQLiteDatabase } from 'expo-sqlite';
import { categoryTableForType } from '../../core/services/category-resolution';
import { DEFAULT_CATEGORIES } from './schema.sql';

type SeedDatabase = Pick<SQLiteDatabase, 'runAsync'>;

export async function seedDefaultCategories(db: SeedDatabase): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    const table = categoryTableForType(category.type);

    await db.runAsync(
      `INSERT OR IGNORE INTO ${table}
         (id, name, color, icon, is_default, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.name,
        category.color,
        category.icon,
        category.is_default,
        category.sort_order,
      ]
    );
  }
}
