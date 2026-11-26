import type { SQLiteDatabase } from 'expo-sqlite';
import type { IBudgetRepository } from '@/core/repositories/IBudgetRepository';
import type {
  Budget,
  CreateBudgetDTO,
  UpdateBudgetDTO,
} from '@/core/models/budget';
import { categoryTableForType } from '@/core/services/category-resolution';
import { isValidYearMonth } from '@/core/services/anticipation';
import { getDatabase } from '../database/db';

type DatabaseProvider = () => Promise<SQLiteDatabase>;

interface BudgetRow {
  id: string;
  category_id: string;
  type: Budget['type'];
  year_month: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    type: row.type,
    yearMonth: row.year_month,
    limitAmount: row.limit_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteBudgetRepository implements IBudgetRepository {
  private readonly getDb: DatabaseProvider;

  constructor(getDb: DatabaseProvider = getDatabase) {
    this.getDb = getDb;
  }

  async getAll(yearMonth?: string): Promise<Budget[]> {
    const db = await this.getDb();
    const rows = yearMonth
      ? await db.getAllAsync<BudgetRow>(
          'SELECT * FROM budgets WHERE year_month = ? ORDER BY type ASC, category_id ASC',
          [yearMonth]
        )
      : await db.getAllAsync<BudgetRow>(
          'SELECT * FROM budgets ORDER BY year_month DESC, type ASC, category_id ASC'
        );
    return rows.map(mapBudget);
  }

  async getById(id: string): Promise<Budget | null> {
    if (!id) return null;
    const db = await this.getDb();
    const row = await db.getFirstAsync<BudgetRow>(
      'SELECT * FROM budgets WHERE id = ?',
      [id]
    );
    return row ? mapBudget(row) : null;
  }

  async getByCategory(
    categoryId: string,
    type: Budget['type'],
    yearMonth: string
  ): Promise<Budget | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<BudgetRow>(
      `SELECT * FROM budgets
       WHERE category_id = ? AND type = ? AND year_month = ?`,
      [categoryId, type, yearMonth]
    );
    return row ? mapBudget(row) : null;
  }

  async create(data: CreateBudgetDTO): Promise<Budget> {
    const db = await this.getDb();
    const categoryId = data.categoryId.trim();
    if (!categoryId || !isValidYearMonth(data.yearMonth)) {
      throw new Error('Datos del presupuesto inválidos.');
    }
    if (!Number.isFinite(data.limitAmount) || data.limitAmount <= 0) {
      throw new Error('El límite del presupuesto debe ser mayor que cero.');
    }

    let createdId = '';
    await db.withExclusiveTransactionAsync(async (txn) => {
      const table = categoryTableForType(data.type);
      const category = await txn.getFirstAsync<{ id: string }>(
        `SELECT id FROM ${table} WHERE id = ?`,
        [categoryId]
      );
      if (!category) {
        throw new Error('La categoría del presupuesto no existe.');
      }

      const id = `bud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      createdId = id;
      const now = new Date().toISOString();
      await txn.runAsync(
        `INSERT INTO budgets
           (id, category_id, type, year_month, limit_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, categoryId, data.type, data.yearMonth, data.limitAmount, now, now]
      );
    });

    const created = await this.getById(createdId);
    if (!created) throw new Error('No se pudo crear el presupuesto.');
    return created;
  }

  async update(id: string, data: UpdateBudgetDTO): Promise<Budget> {
    const current = await this.getById(id);
    if (!current) throw new Error('El presupuesto no existe.');
    if (!Number.isFinite(data.limitAmount) || data.limitAmount <= 0) {
      throw new Error('El límite del presupuesto debe ser mayor que cero.');
    }

    const db = await this.getDb();
    await db.runAsync(
      'UPDATE budgets SET limit_amount = ?, updated_at = ? WHERE id = ?',
      [data.limitAmount, new Date().toISOString(), id]
    );
    const updated = await this.getById(id);
    if (!updated) throw new Error('No se pudo actualizar el presupuesto.');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
  }
}
