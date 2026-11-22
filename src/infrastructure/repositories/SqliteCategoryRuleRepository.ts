import type { SQLiteDatabase } from 'expo-sqlite';
import type { CategoryType } from '@/core/models/category';
import type {
  CategoryRule,
  CategoryRuleDraft,
} from '@/core/services/category-rules';
import { getDatabase } from '../database/db';

type DatabaseProvider = () => Promise<SQLiteDatabase>;

interface CategoryRuleRow {
  id: string;
  keyword: string;
  category_id: string;
  type: CategoryType;
  hits: number;
  created_at: string;
  updated_at: string;
}

function mapRule(row: CategoryRuleRow): CategoryRule {
  return {
    id: row.id,
    keyword: row.keyword,
    categoryId: row.category_id,
    type: row.type,
    hits: row.hits,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteCategoryRuleRepository {
  private readonly getDb: DatabaseProvider;

  constructor(getDb: DatabaseProvider = getDatabase) {
    this.getDb = getDb;
  }

  async getAll(type?: CategoryType): Promise<CategoryRule[]> {
    const db = await this.getDb();
    const rows = type
      ? await db.getAllAsync<CategoryRuleRow>(
          'SELECT * FROM category_rules WHERE type = ? ORDER BY hits DESC, keyword ASC',
          [type]
        )
      : await db.getAllAsync<CategoryRuleRow>(
          'SELECT * FROM category_rules ORDER BY type ASC, hits DESC, keyword ASC'
        );
    return rows.map(mapRule);
  }

  async findByKeyword(
    keyword: string,
    type: CategoryType
  ): Promise<CategoryRule | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<CategoryRuleRow>(
      'SELECT * FROM category_rules WHERE keyword = ? AND type = ?',
      [keyword, type]
    );
    return row ? mapRule(row) : null;
  }

  async create(data: CategoryRuleDraft): Promise<CategoryRule> {
    const db = await this.getDb();
    const existing = await this.findByKeyword(data.keyword, data.type);
    if (existing) {
      await db.runAsync(
        'UPDATE category_rules SET hits = hits + 1, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), existing.id]
      );
      const updated = await this.getById(existing.id);
      if (!updated) throw new Error('No se pudo actualizar la regla.');
      return updated;
    }

    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO category_rules
         (id, keyword, category_id, type, hits, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [id, data.keyword, data.categoryId, data.type, now, now]
    );
    const created = await this.getById(id);
    if (!created) throw new Error('No se pudo crear la regla.');
    return created;
  }

  async getById(id: string): Promise<CategoryRule | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<CategoryRuleRow>(
      'SELECT * FROM category_rules WHERE id = ?',
      [id]
    );
    return row ? mapRule(row) : null;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM category_rules WHERE id = ?', [id]);
  }
}
